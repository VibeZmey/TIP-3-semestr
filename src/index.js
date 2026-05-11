const { createApp } = require('./app');
const { createPool, waitForDatabase } = require('./db');
const { ensureUsersTable } = require('./users.repository');

let pool;
let server;

async function main() {
  const port = Number(process.env.PORT || 3000);
  pool = createPool();

  await waitForDatabase(pool);
  await ensureUsersTable(pool);

  const app = createApp(pool);
  server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  const shutdown = async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }

    if (pool) {
      await pool.end();
    }
  };

  process.on('SIGINT', async () => {
    await shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await shutdown();
    process.exit(0);
  });
}

main().catch(async error => {
  console.error('Startup error', error.message || error);

  if (pool) {
    await pool.end().catch(() => {});
  }

  process.exitCode = 1;
});



