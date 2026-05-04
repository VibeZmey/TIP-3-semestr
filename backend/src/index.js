const express = require('express');
const bodyParser = require('body-parser');
const { pool, init } = require('./db');
const { createClient } = require('redis');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const SERVER_ID = process.env.SERVER_ID || 'backend';

const app = express();
app.use(bodyParser.json());

let redisClient = null;
async function initRedis() {
  try {
    if (process.env.REDIS_URL) {
      redisClient = createClient({ url: process.env.REDIS_URL });
    } else {
      redisClient = createClient({ url: 'redis://redis:6379' });
    }
    redisClient.on('error', (e) => console.error('Redis error', e));
    await redisClient.connect();
    console.log('Redis connected');
  } catch (err) {
    console.log('Redis not available (continuing without cache).', err.message);
    redisClient = null;
  }
}

function cacheMiddleware(keyFn, ttlSec = 60) {
  return async (req, res, next) => {
    if (!redisClient) return next();
    try {
      const key = keyFn(req);
      const cached = await redisClient.get(key);
      if (cached) {
        return res.json({ source: 'cache', data: JSON.parse(cached) });
      }
      req._cacheKey = key;
      req._cacheTTL = ttlSec;
      return next();
    } catch (err) {
      console.error('Cache read error', err.message);
      return next();
    }
  };
}

async function saveToCache(key, data, ttl) {
  if (!redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl });
  } catch (err) {
    console.error('Cache save error', err.message);
  }
}

app.get('/', (req, res) => {
  res.json({ server: SERVER_ID });
});

app.post('/api/users', async (req, res) => {
  const { first_name, last_name, age } = req.body;
  const now = Date.now();
  try {
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, age, created_at, updated_at) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [first_name, last_name, age || null, now, now]
    );
    if (redisClient) await redisClient.del('users:all');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create user error', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/users', cacheMiddleware(() => 'users:all', 60), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    const data = result.rows;
    if (req._cacheKey) await saveToCache(req._cacheKey, data, req._cacheTTL);
    res.json({ source: 'server', data });
  } catch (err) {
    console.error('List users error', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/users/:id', cacheMiddleware((req) => `users:${req.params.id}`, 60), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
    const user = result.rows[0];
    if (req._cacheKey) await saveToCache(req._cacheKey, user, req._cacheTTL);
    res.json({ source: 'server', data: user });
  } catch (err) {
    console.error('Get user error', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  const { first_name, last_name, age } = req.body;
  const now = Date.now();
  try {
    const result = await pool.query(
      'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), age = COALESCE($3, age), updated_at = $4 WHERE id = $5 RETURNING *',
      [first_name, last_name, age, now, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
    if (redisClient) {
      await redisClient.del('users:all');
      await redisClient.del(`users:${req.params.id}`);
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
    if (redisClient) {
      await redisClient.del('users:all');
      await redisClient.del(`users:${req.params.id}`);
    }
    res.json({ message: 'deleted', id: req.params.id });
  } catch (err) {
    console.error('Delete user error', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
});

async function start() {
  try {
    await init();
    await initRedis();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server ${SERVER_ID} listening on ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error', err.message);
    process.exit(1);
  }
}

start();

