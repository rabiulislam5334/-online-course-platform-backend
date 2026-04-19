const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const auth   = require('../middlewares/auth');
const perm   = require('../middlewares/rbac');

// Admin dashboard
router.get('/dashboard', auth, perm('users','view'), ctrl.getDashboard);

// User list + detail
router.get('/',     auth, perm('users','view'),   ctrl.getAll);
router.get('/:id',  auth, perm('users','view'),   ctrl.getById);
router.put('/:id',  auth, perm('users','edit'),   ctrl.updateProfile);

// Status management
router.post('/:id/approve', auth, perm('users','edit'), ctrl.approveUser);
router.post('/:id/reject',  auth, perm('users','edit'), ctrl.rejectUser);
router.patch('/:id/status', auth, perm('users','edit'), ctrl.changeStatus);
router.patch('/:id/role',   auth, perm('users','edit'), ctrl.changeRole);

module.exports = router;
