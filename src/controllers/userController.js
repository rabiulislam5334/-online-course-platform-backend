const userService = require('../services/userService');
const res_ = require('../utils/response');

const getDashboard = async (req, res, next) => {
  try { res_.success(res, await userService.getDashboard()); } catch (e) { next(e); }
};

const getAll = async (req, res, next) => {
  try { res_.success(res, await userService.getAll(req.query)); } catch (e) { next(e); }
};

const getById = async (req, res, next) => {
  try { res_.success(res, await userService.getById(req.params.id)); } catch (e) { next(e); }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await userService.updateProfile(req.params.id, req.body);
    res_.success(res, data, 'User updated');
  } catch (e) { next(e); }
};

const approveUser = async (req, res, next) => {
  try {
    const data = await userService.approveUser(req.params.id);
    res_.success(res, data, 'User approved');
  } catch (e) { next(e); }
};

const rejectUser = async (req, res, next) => {
  try {
    const { remark } = req.body;
    const data = await userService.rejectUser(req.params.id, remark);
    res_.success(res, data, 'User rejected');
  } catch (e) { next(e); }
};

const changeStatus = async (req, res, next) => {
  try {
    const data = await userService.changeStatus(req.params.id, req.body.status);
    res_.success(res, data, 'Status updated');
  } catch (e) { next(e); }
};

const changeRole = async (req, res, next) => {
  try {
    const data = await userService.changeRole(req.params.id, req.body.role_id);
    res_.success(res, data, 'Role updated');
  } catch (e) { next(e); }
};

module.exports = { getDashboard, getAll, getById, updateProfile, approveUser, rejectUser, changeStatus, changeRole };
