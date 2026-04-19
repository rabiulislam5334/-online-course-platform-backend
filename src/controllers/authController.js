const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const authService = require('../services/authService');
const res_ = require('../utils/response');

const registerValidation = [
  body('full_name').trim().notEmpty().withMessage('Full name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
  body('role').isIn(['Instructor', 'Student']).withMessage('Role must be Instructor or Student'),
  validate,
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate,
];

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    res_.created(res, data, 'Registration submitted. Awaiting admin approval.');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res_.success(res, data, 'Login successful');
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res_.badRequest(res, 'Refresh token required');
    const tokens = await authService.refreshTokens(refreshToken);
    res_.success(res, tokens, 'Token refreshed');
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res_.success(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
};

module.exports = { register, registerValidation, login, loginValidation, refreshToken, logout };
