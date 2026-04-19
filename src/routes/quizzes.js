const router = require('express').Router();
const ctrl   = require('../controllers/quizController');
const auth   = require('../middlewares/auth');
const perm   = require('../middlewares/rbac');

router.get('/course/:courseId',      auth, perm('quizzes','view'),   ctrl.getByCourse);
router.post('/',                     auth, perm('quizzes','create'), ctrl.create);
router.put('/:id',                   auth, perm('quizzes','edit'),   ctrl.update);

// Questions
router.post('/:id/questions',        auth, perm('quizzes','create'), ctrl.addQuestion);
router.put('/questions/:qId',        auth, perm('quizzes','edit'),   ctrl.updateQuestion);
router.delete('/questions/:qId',     auth, perm('quizzes','delete'), ctrl.deleteQuestion);

// Attempts
router.post('/:id/attempt',          auth, perm('quizzes','create'), ctrl.submitAttempt);
router.get('/:id/attempts',          auth, perm('quizzes','view'),   ctrl.getAttempts);
router.get('/:id/my-attempts',       auth,                           ctrl.getMyAttempts);

module.exports = router;
