const { pool } = require('../config/db');

const findUserByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT u.*, r.name AS role_name, r.is_super_admin
     FROM users u JOIN roles r ON u.role_id = r.id
     WHERE u.email = ?`,
    [email]
  );
  return rows[0] || null;
};

const findUserById = async (id) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.status, u.role_id,
            r.name AS role_name, r.is_super_admin
     FROM users u JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const createUser = async ({ full_name, email, password_hash, role_id }) => {
  const [result] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role_id, status) VALUES (?,?,?,?,?)',
    [full_name, email, password_hash, role_id, 'pending']
  );
  return result.insertId;
};

const saveRefreshToken = async (user_id, token, expires_at) => {
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?,?,?)',
    [user_id, token, expires_at]
  );
};

const findRefreshToken = async (token) => {
  const [rows] = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = ? AND revoked = FALSE AND expires_at > NOW()',
    [token]
  );
  return rows[0] || null;
};

const revokeRefreshToken = async (token) => {
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token = ?', [token]);
};

const revokeAllUserTokens = async (user_id) => {
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?', [user_id]);
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};
