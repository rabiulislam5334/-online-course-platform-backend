const router = require('express').Router();
const ctrl   = require('../controllers/roleController');
const auth   = require('../middlewares/auth');
const perm   = require('../middlewares/rbac');

router.get('/',                    auth, perm('users','view'),   ctrl.getAll);
router.post('/',                   auth, perm('users','create'), ctrl.create);
router.put('/:id',                 auth, perm('users','edit'),   ctrl.update);
router.delete('/:id',              auth, perm('users','delete'), ctrl.remove);
router.put('/:id/permissions',     auth, perm('users','edit'),   ctrl.updatePermissions);

module.exports = router;
