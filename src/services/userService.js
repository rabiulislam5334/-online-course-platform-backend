const { pool } = require('../config/db');
const repo = require('../repositories/userRepository');

const getAll = async (query) => repo.getAllUsers(query);

const getById = async (id) => {
  const user = await repo.getUserById(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  return user;
};

const updateProfile = async (id, fields) => {
  const user = await repo.getUserById(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  await repo.updateUser(id, fields);
  return repo.getUserById(id);
};

const approveUser = async (id) => {
  const user = await repo.getUserById(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  if (user.status !== 'pending') throw { statusCode: 400, message: 'User is not pending' };
  await repo.updateUser(id, { status: 'active', rejection_remark: null });
  return repo.getUserById(id);
};

const rejectUser = async (id, remark) => {
  const user = await repo.getUserById(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  await repo.updateUser(id, { status: 'rejected', rejection_remark: remark || 'Not specified' });
  return repo.getUserById(id);
};

const changeStatus = async (id, status) => {
  const allowed = ['active', 'suspended'];
  if (!allowed.includes(status)) throw { statusCode: 400, message: 'Status must be active or suspended' };
  const user = await repo.getUserById(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  await repo.updateUser(id, { status });
  return repo.getUserById(id);
};

const changeRole = async (id, role_id) => {
  const [roles] = await pool.query('SELECT * FROM roles WHERE id = ?', [role_id]);
  if (!roles[0]) throw { statusCode: 400, message: 'Invalid role' };
  if (roles[0].is_super_admin) throw { statusCode: 403, message: 'Cannot assign Super Admin role' };
  await repo.updateUser(id, { role_id });
  return repo.getUserById(id);
};

const getDashboard = async () => repo.getAdminDashboard();

module.exports = { getAll, getById, updateProfile, approveUser, rejectUser, changeStatus, changeRole, getDashboard };
