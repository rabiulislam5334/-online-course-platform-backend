const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const repo = require('../repositories/authRepository');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshExpiry,
} = require('../utils/jwt');

const getRoleIdByName = async (roleName) => {
  const [rows] = await pool.query('SELECT id FROM roles WHERE name = ?', [roleName]);
  if (!rows[0]) throw { statusCode: 400, message: `Role '${roleName}' not found` };
  return rows[0].id;
};

const register = async ({ full_name, email, password, role }) => {
  const existing = await repo.findUserByEmail(email);
  if (existing) throw { statusCode: 409, message: 'Email already registered' };

  if (!['Instructor', 'Student'].includes(role)) {
    throw { statusCode: 400, message: 'Role must be Instructor or Student' };
  }

  const role_id = await getRoleIdByName(role);
  const password_hash = await bcrypt.hash(password, 10);
  const id = await repo.createUser({ full_name, email, password_hash, role_id });

  return { id, full_name, email, role, status: 'pending' };
};

const login = async ({ email, password }) => {
  const user = await repo.findUserByEmail(email);
  if (!user) throw { statusCode: 401, message: 'Invalid email or password' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { statusCode: 401, message: 'Invalid email or password' };

  if (user.status === 'pending') throw { statusCode: 403, message: 'Account pending admin approval' };
  if (user.status === 'rejected') throw { statusCode: 403, message: `Account rejected: ${user.rejection_remark || 'Contact admin'}` };
  if (user.status === 'suspended') throw { statusCode: 403, message: 'Account suspended. Contact admin.' };

  const payload = {
    id: user.id,
    email: user.email,
    role_id: user.role_id,
    role_name: user.role_name,
    is_super_admin: user.is_super_admin,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await repo.saveRefreshToken(user.id, refreshToken, getRefreshExpiry());

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role_name,
      status: user.status,
    },
  };
};

const refreshTokens = async (token) => {
  const stored = await repo.findRefreshToken(token);
  if (!stored) throw { statusCode: 401, message: 'Invalid or expired refresh token' };

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw { statusCode: 401, message: 'Invalid refresh token' };
  }

  await repo.revokeRefreshToken(token);

  const user = await repo.findUserById(decoded.id);
  if (!user) throw { statusCode: 401, message: 'User not found' };

  const payload = {
    id: user.id,
    email: user.email,
    role_id: user.role_id,
    role_name: user.role_name,
    is_super_admin: user.is_super_admin,
  };

  const newAccess = generateAccessToken(payload);
  const newRefresh = generateRefreshToken(payload);
  await repo.saveRefreshToken(user.id, newRefresh, getRefreshExpiry());

  return { accessToken: newAccess, refreshToken: newRefresh };
};

const logout = async (token) => {
  if (token) await repo.revokeRefreshToken(token);
};

module.exports = { register, login, refreshTokens, logout };
