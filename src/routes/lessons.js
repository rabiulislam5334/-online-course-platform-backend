const router = require('express').Router();
const { lessonController: ctrl } = require('../controllers/lessonController');
const auth    = require('../middlewares/auth');
const perm    = require('../middlewares/rbac');
const { uploadThumbnail, uploadLessonFile } = require('../config/multer');

router.get('/course/:courseId',  auth, perm('lessons','view'),   ctrl.getByCourse);
router.post('/',
  auth, perm('lessons','create'),
  uploadLessonFile.single('file'),
  ctrl.create
);
router.put('/:id',
  auth, perm('lessons','edit'),
  uploadLessonFile.single('file'),
  ctrl.update
);
router.patch('/reorder',         auth, perm('lessons','edit'),   ctrl.reorder);
router.delete('/:id',            auth, perm('lessons','delete'), ctrl.delete);
router.post('/:id/complete',     auth,                           ctrl.markComplete);

module.exports = router;