const courseService = require('../services/courseService');
const res_ = require('../utils/response');

const getPublished  = async (req, res, next) => { try { res_.success(res, await courseService.getPublished(req.query)); } catch(e){next(e);} };
const getAdminAll   = async (req, res, next) => { try { res_.success(res, await courseService.getAdminAll(req.query)); } catch(e){next(e);} };
const getMyCourses  = async (req, res, next) => { try { res_.success(res, await courseService.getInstructorCourses(req.user.id)); } catch(e){next(e);} };
const getOne        = async (req, res, next) => { try { res_.success(res, await courseService.getOne(req.params.id, req.user)); } catch(e){next(e);} };

const create = async (req, res, next) => {
  try {
    const data = await courseService.create(req.body, req.file, req.user);
    res_.created(res, data, 'Course created');
  } catch(e){next(e);}
};

const update = async (req, res, next) => {
  try {
    const data = await courseService.update(req.params.id, req.body, req.file, req.user);
    res_.success(res, data, 'Course updated');
  } catch(e){next(e);}
};

const remove = async (req, res, next) => {
  try {
    await courseService.remove(req.params.id, req.user);
    res_.success(res, null, 'Course deleted');
  } catch(e){next(e);}
};

const submitForReview = async (req, res, next) => {
  try {
    const data = await courseService.submitForReview(req.params.id, req.user);
    res_.success(res, data, 'Course submitted for review');
  } catch(e){next(e);}
};

const approveCourse = async (req, res, next) => {
  try {
    const data = await courseService.approveCourse(req.params.id);
    res_.success(res, data, 'Course approved and published');
  } catch(e){next(e);}
};

const rejectCourse = async (req, res, next) => {
  try {
    const data = await courseService.rejectCourse(req.params.id, req.body.remark);
    res_.success(res, data, 'Course rejected');
  } catch(e){next(e);}
};

const unpublish = async (req, res, next) => {
  try {
    const data = await courseService.unpublish(req.params.id);
    res_.success(res, data, 'Course unpublished');
  } catch(e){next(e);}
};

module.exports = { 
  getPublished, 
  getAdminAll, 
  getMyCourses, // রাউট ফাইলের ctrl.getMyCourses এর সাথে মিল থাকতে হবে
  getOne, 
  create, 
  update, 
  remove, 
  submitForReview, 
  approveCourse, 
  rejectCourse, 
  unpublish 
};
