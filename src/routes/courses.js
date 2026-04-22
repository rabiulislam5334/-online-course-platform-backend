const router  = require('express').Router();
const ctrl    = require('../controllers/courseController');
const auth    = require('../middlewares/auth');
const perm    = require('../middlewares/rbac');
const upload  = require('../config/multer');

// ১. পাবলিক এবং এডমিন ভিউ
router.get('/', ctrl.getPublished);
router.get('/admin/all', auth, perm('courses','view'), ctrl.getAdminAll);
router.get('/my',        auth, perm('courses','view'), ctrl.getMyCourses);

// ২. কোর্স ডিটেইলস (এডিট পেজের ডাটা পাওয়ার জন্য এখানে auth যোগ করা হয়েছে)
router.get('/:id', auth, ctrl.getOne); 

// ৩. কোর্স আপডেট (PATCH ব্যবহার করা হয়েছে ফ্রন্টএন্ডের সাথে মিল রাখতে)
router.patch('/:id',
  auth, perm('courses','edit'),
  upload.single('thumbnail'),
  ctrl.update
);

// ৪. কোর্স তৈরি
router.post('/',
  auth, perm('courses','create'),
  upload.single('thumbnail'),
  ctrl.create
);

router.delete('/: id', auth, perm('courses', 'delete'), ctrl.remove);

// ৫. ওয়ার্কফ্লো রাউটস
router.patch('/: id/submit',    auth, perm('courses','edit'),   ctrl.submitForReview);
router.patch('/: id/approve',   auth, perm('courses','edit'),   ctrl.approveCourse);
router.patch('/: id/reject',    auth, perm('courses','edit'),   ctrl.rejectCourse);
router.patch('/: id/unpublish', auth, perm('courses','edit'),   ctrl.unpublish);

module.exports = router;
