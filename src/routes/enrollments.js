const router = require('express').Router();
const { enrollController: ctrl } = require('../controllers/enrollmentController');
const auth = require('../middlewares/auth');
const perm = require('../middlewares/rbac');

router.post('/',                          auth, perm('enrollments','create'), ctrl.enroll);
router.get('/my',                         auth, perm('enrollments','view'),   ctrl.getMyEnrollments);
router.get('/course/:courseId',           auth, perm('enrollments','view'),   ctrl.getCourseEnrollments);
router.get('/course/:courseId/progress',  auth, perm('enrollments','view'),   ctrl.getProgress);

module.exports = router;
