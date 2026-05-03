const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/postgres';
const DB_MAX_ATTEMPTS = Number(process.env.DB_MAX_ATTEMPTS || 30);
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 2000);

const pool = new Pool({ connectionString });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabase() {
  let lastError;
  for (let attempt = 1; attempt <= DB_MAX_ATTEMPTS; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      lastError = error;
      console.log(`Waiting for database... attempt ${attempt}/${DB_MAX_ATTEMPTS}`);
      if (attempt < DB_MAX_ATTEMPTS) {
        await sleep(DB_RETRY_DELAY_MS);
      }
    }
  }
  throw lastError;
}

async function init() {
  await waitForDatabase();
  // Создадим таблицу users, если она отсутствует
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      age INTEGER,
      created_at BIGINT,
      updated_at BIGINT
    );
  `);
}

module.exports = { pool, init };


