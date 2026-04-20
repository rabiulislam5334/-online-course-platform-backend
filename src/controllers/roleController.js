const roleRepo = require('../repositories/roleRepository');
const res_ = require('../utils/response');

const getAll = async (req, res, next) => {
  try { res_.success(res, await roleRepo.getAllRoles()); } catch(e){next(e);}
};

const create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res_.badRequest(res, 'Role name required');
    res_.created(res, await roleRepo.createRole(name), 'Role created');
  } catch(e){next(e);}
};

const update = async (req, res, next) => {
  try {
    const role = await roleRepo.getRoleById(req.params.id);
    if (!role) return res_.notFound(res, 'Role not found');
    if (role.is_super_admin) return res_.forbidden(res, 'Cannot modify Super Admin role');
    res_.success(res, await roleRepo.updateRole(req.params.id, req.body.name), 'Role updated');
  } catch(e){next(e);}
};

const remove = async (req, res, next) => {
  try {
    const role = await roleRepo.getRoleById(req.params.id);
    if (!role) return res_.notFound(res, 'Role not found');
    if (role.is_super_admin) return res_.forbidden(res, 'Cannot delete Super Admin role');
    await roleRepo.deleteRole(req.params.id);
    res_.success(res, null, 'Role deleted');
  } catch(e){next(e);}
};

const updatePermissions = async (req, res, next) => {
  try {
    const role = await roleRepo.getRoleById(req.params.id);
    if (!role) return res_.notFound(res, 'Role not found');
    if (role.is_super_admin) return res_.forbidden(res, 'Cannot modify Super Admin permissions');
    const data = await roleRepo.updatePermissions(req.params.id, req.body.permissions);
    res_.success(res, data, 'Permissions updated');
  } catch(e){next(e);}
};

module.exports = { getAll, create, update, remove, updatePermissions };
