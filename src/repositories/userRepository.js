const { pool } = require('../config/db');

const getAllUsers = async ({ page = 1, limit = 10, role, status, search }) => {
  const offset = (page - 1) * limit;
  let where = 'WHERE 1=1';
  const params = [];

  if (role) { where += ' AND r.name = ?'; params.push(role); }
  if (status) { where += ' AND u.status = ?'; params.push(status); }
  if (search) { where += ' AND (u.full_name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM users u JOIN roles r ON u.role_id = r.id ${where}`,
    params
  );
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.status, u.created_at, r.name AS role
     FROM users u JOIN roles r ON u.role_id = r.id
     ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );

  return { data: rows, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) };
};

const getUserById = async (id) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.status, u.rejection_remark, u.created_at,
            r.id AS role_id, r.name AS role
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const updateUser = async (id, fields) => {
  const allowed = ['full_name', 'email', 'status', 'role_id', 'rejection_remark'];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }
  if (!updates.length) return;
  values.push(id);
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
};

const getPendingCount = async () => {
  const [rows] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE status = 'pending'");
  return rows[0].count;
};

const getAdminDashboard = async () => {
  const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
  const [[{ totalCourses }]] = await pool.query('SELECT COUNT(*) AS totalCourses FROM courses');
  const [[{ totalEnrollments }]] = await pool.query('SELECT COUNT(*) AS totalEnrollments FROM enrollments');
  const [[{ totalAttempts }]] = await pool.query('SELECT COUNT(*) AS totalAttempts FROM quiz_attempts');
  const [[{ pendingApprovals }]] = await pool.query("SELECT COUNT(*) AS pendingApprovals FROM users WHERE status = 'pending'");

  const [recentUsers] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.status, r.name AS role, u.created_at
     FROM users u JOIN roles r ON u.role_id = r.id
     ORDER BY u.created_at DESC LIMIT 5`
  );
  const [recentCourses] = await pool.query(
    `SELECT c.id, c.title, c.status, u.full_name AS instructor, c.created_at
     FROM courses c JOIN users u ON c.instructor_id = u.id
     ORDER BY c.created_at DESC LIMIT 5`
  );

  return { totalUsers, totalCourses, totalEnrollments, totalAttempts, pendingApprovals, recentUsers, recentCourses };
};

module.exports = { getAllUsers, getUserById, updateUser, getPendingCount, getAdminDashboard };
