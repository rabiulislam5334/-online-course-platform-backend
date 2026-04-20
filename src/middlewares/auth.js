const { verifyAccessToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return unauthorized(res, 'Access token required');

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, email, role_id, role_name, status }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Access token expired');
    return unauthorized(res, 'Invalid access token');
  }
};

module.exports = authenticate;
