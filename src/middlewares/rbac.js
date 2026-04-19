const { pool } = require('../config/db');
const { forbidden } = require('../utils/response');

/**
 * checkPermission('courses', 'create')
 * Checks role_permissions table for the logged-in user's role
 */
const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      const roleId = req.user.role_id;

      // Super admin always passes
      const [roleRows] = await pool.query(
        'SELECT is_super_admin FROM roles WHERE id = ?',
        [roleId]
      );
      if (roleRows[0]?.is_super_admin) return next();

      const colMap = {
        view: 'can_view',
        create: 'can_create',
        edit: 'can_edit',
        delete: 'can_delete',
      };

      const col = colMap[action];
      if (!col) return forbidden(res, 'Invalid permission action');

      const [rows] = await pool.query(
        `SELECT ${col} FROM role_permissions WHERE role_id = ? AND module = ?`,
        [roleId, module]
      );

      if (!rows[0] || !rows[0][col]) {
        return forbidden(res, `You don't have permission to ${action} ${module}`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = checkPermission;
