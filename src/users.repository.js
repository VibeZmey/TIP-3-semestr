const USER_COLUMNS = 'id, first_name, last_name, age, created_at, updated_at';

const CREATE_USERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0),
    created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
    updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
  );
`;

async function ensureUsersTable(pool) {
  await pool.query(CREATE_USERS_TABLE_SQL);
}

async function createUser(pool, user) {
  const result = await pool.query(
    `
      INSERT INTO users (first_name, last_name, age)
      VALUES ($1, $2, $3)
      RETURNING ${USER_COLUMNS}
    `,
    [user.first_name, user.last_name, user.age]
  );

  return result.rows[0];
}

async function listUsers(pool) {
  const result = await pool.query(`SELECT ${USER_COLUMNS} FROM users ORDER BY id ASC`);
  return result.rows;
}

async function getUserById(pool, id) {
  const result = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

function buildUpdateUserQuery(id, fields) {
  const sets = [];
  const values = [];

  if (Object.prototype.hasOwnProperty.call(fields, 'first_name')) {
    sets.push(`first_name = $${values.length + 1}`);
    values.push(fields.first_name);
  }

  if (Object.prototype.hasOwnProperty.call(fields, 'last_name')) {
    sets.push(`last_name = $${values.length + 1}`);
    values.push(fields.last_name);
  }

  if (Object.prototype.hasOwnProperty.call(fields, 'age')) {
    sets.push(`age = $${values.length + 1}`);
    values.push(fields.age);
  }

  if (sets.length === 0) {
    throw new Error('At least one field must be provided for update');
  }

  sets.push('updated_at = EXTRACT(EPOCH FROM NOW())::BIGINT');
  values.push(id);

  return {
    text: `
      UPDATE users
      SET ${sets.join(', ')}
      WHERE id = $${values.length}
      RETURNING ${USER_COLUMNS}
    `,
    values
  };
}

async function updateUser(pool, id, fields) {
  const query = buildUpdateUserQuery(id, fields);
  const result = await pool.query(query.text, query.values);
  return result.rows[0] || null;
}

async function deleteUser(pool, id) {
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

module.exports = {
  ensureUsersTable,
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  buildUpdateUserQuery,
  USER_COLUMNS
};

