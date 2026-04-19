// ===== roleRepository.js =====
const { pool } = require('../config/db');

const getAllRoles = async () => {
  const [roles] = await pool.query('SELECT * FROM roles ORDER BY created_at DESC');
  for (const role of roles) {
    const [perms] = await pool.query(
      'SELECT * FROM role_permissions WHERE role_id = ?', [role.id]
    );
    role.permissions = perms;
  }
  return roles;
};

const getRoleById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
  if (!rows[0]) return null;
  const [perms] = await pool.query('SELECT * FROM role_permissions WHERE role_id = ?', [id]);
  rows[0].permissions = perms;
  return rows[0];
};

const createRole = async (name) => {
  const [res] = await pool.query('INSERT INTO roles (name) VALUES (?)', [name]);
  const modules = ['courses','lessons','quizzes','users','enrollments','reports'];
  for (const module of modules) {
    await pool.query(
      'INSERT INTO role_permissions (role_id, module) VALUES (?,?)',
      [res.insertId, module]
    );
  }
  return getRoleById(res.insertId);
};

const updateRole = async (id, name) => {
  await pool.query('UPDATE roles SET name = ? WHERE id = ?', [name, id]);
  return getRoleById(id);
};

const deleteRole = async (id) => {
  const [users] = await pool.query('SELECT id FROM users WHERE role_id = ?', [id]);
  if (users.length) throw { statusCode: 400, message: 'Cannot delete role assigned to users' };
  await pool.query('DELETE FROM roles WHERE id = ?', [id]);
};

const updatePermissions = async (role_id, permissions) => {
  // permissions: [{ module, can_view, can_create, can_edit, can_delete }]
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const p of permissions) {
      await conn.query(
        `INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           can_view=VALUES(can_view), can_create=VALUES(can_create),
           can_edit=VALUES(can_edit), can_delete=VALUES(can_delete)`,
        [role_id, p.module, p.can_view||false, p.can_create||false, p.can_edit||false, p.can_delete||false]
      );
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  return getRoleById(role_id);
};

module.exports = { getAllRoles, getRoleById, createRole, updateRole, deleteRole, updatePermissions };
