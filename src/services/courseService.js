const router  = require('express').Router();
const ctrl    = require('../controllers/courseController');
const auth    = require('../middlewares/auth');
const perm    = require('../middlewares/rbac');
const upload  = require('../config/multer');

// ১. পাবলিক এবং এডমিন ভিউ
router.get('/', ctrl.getPublished);
// অ্যাডমিন সব কোর্স দেখবে
router.get('/admin/all', auth, perm('courses','view'), ctrl.getAdminAll);
// ইন্সট্রাক্টর তার নিজের কোর্স দেখবে
router.get('/my', auth, perm('courses','view'), ctrl.getMyCourses);

// ২. কোর্স ডিটেইলস
router.get('/:id', auth, ctrl.getOne); 

// ৩. কোর্স তৈরি
router.post('/',
  auth, perm('courses','create'),
  upload.single('thumbnail'),
  ctrl.create
);

// ৪. কোর্স আপডেট
router.patch('/:id',
  auth, perm('courses','edit'),
  upload.single('thumbnail'),
  ctrl.update
);

// ৫. কোর্স ডিলিট (/: id থেকে স্পেস সরানো হয়েছে)
router.delete('/:id', auth, perm('courses', 'delete'), ctrl.remove);

// ৬. ওয়ার্কফ্লো রাউটস (/: id থেকে স্পেস সরানো হয়েছে)
router.patch('/:id/submit',    auth, perm('courses','edit'),   ctrl.submitForReview);
router.patch('/:id/approve',   auth, perm('courses','edit'),   ctrl.approveCourse);
router.patch('/:id/reject',    auth, perm('courses','edit'),   ctrl.rejectCourse);
router.patch('/:id/unpublish', auth, perm('courses','edit'),   ctrl.unpublish);

module.exports = router;
