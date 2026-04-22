// const router  = require('express').Router();
// const ctrl    = require('../controllers/courseController');
// const auth    = require('../middlewares/auth');
// const perm    = require('../middlewares/rbac');
// const upload  = require('../config/multer');


// router.get('/', ctrl.getPublished);
// router.get('/admin/all', auth, perm('courses', 'view'), ctrl.getAdminAll);
// router.get('/my', auth, perm('courses', 'view'), ctrl.getMyCourses);


// router.get('/:id', auth, ctrl.getOne); 


// router.post('/', 
//   auth, perm('courses', 'create'), 
//   upload.single('thumbnail'), 
//   ctrl.create
// );

// router.patch('/:id', 
//   auth, perm('courses', 'edit'), 
//   upload.single('thumbnail'), 
//   ctrl.update
// );

// router.delete('/:id', auth, perm('courses', 'delete'), ctrl.remove);
// router.patch('/:id/submit',    auth, perm('courses', 'edit'), ctrl.submitForReview);
// router.patch('/:id/approve',   auth, perm('courses', 'edit'), ctrl.approveCourse);
// router.patch('/:id/reject',    auth, perm('courses', 'edit'), ctrl.rejectCourse);
// router.patch('/:id/unpublish', auth, perm('courses', 'edit'), ctrl.unpublish);

// module.exports = router;

// src/routes/courses.js

const router  = require('express').Router();
const ctrl    = require('../controllers/courseController');
const auth    = require('../middlewares/auth');
const perm    = require('../middlewares/rbac');
const upload  = require('../config/multer');

// ১. ভিউ রাউটস
router.get('/', ctrl.getPublished);
router.get('/admin/all', auth, perm('courses','view'), ctrl.getAdminAll);
router.get('/my', auth, perm('courses','view'), ctrl.getMyCourses);

// ২. ডিটেইলস
router.get('/:id', auth, ctrl.getOne); // স্পেস ছাড়া :id

// ৩. তৈরি ও আপডেট
router.post('/', auth, perm('courses','create'), upload.single('thumbnail'), ctrl.create);
router.patch('/:id', auth, perm('courses','edit'), upload.single('thumbnail'), ctrl.update);

// ৪. ডিলিট ও ওয়ার্কফ্লো (নিশ্চিত করুন :id এর মাঝে কোনো স্পেস নেই)
router.delete('/:id', auth, perm('courses', 'delete'), ctrl.remove);
router.patch('/:id/submit', auth, perm('courses','edit'), ctrl.submitForReview);
router.patch('/:id/approve', auth, perm('courses','edit'), ctrl.approveCourse);
router.patch('/:id/reject', auth, perm('courses','edit'), ctrl.rejectCourse);
router.patch('/:id/unpublish', auth, perm('courses','edit'), ctrl.unpublish);

module.exports = router;
