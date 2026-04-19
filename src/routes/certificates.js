const router = require('express').Router();
const ctrl   = require('../controllers/certificateController');
const auth   = require('../middlewares/auth');

router.get('/my',          auth, ctrl.getMyCerts);
router.get('/:id',         auth, ctrl.getById);
router.get('/:id/download',auth, ctrl.download);

module.exports = router;
