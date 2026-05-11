const { Pool, types } = require('pg');

types.setTypeParser(20, value => Number(value));
types.setTypeParser(23, value => Number(value));

function createPool(databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres') {
  return new Pool({
    connectionString: databaseUrl
  });
}

async function waitForDatabase(pool, options = {}) {
  const retries = Number(options.retries ?? process.env.DATABASE_WAIT_RETRIES ?? 30);
  const delayMs = Number(options.delayMs ?? process.env.DATABASE_WAIT_DELAY_MS ?? 2000);

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Database is not available');
}

module.exports = {
  createPool,
  waitForDatabase
};

