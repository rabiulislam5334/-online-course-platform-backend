// src/services/courseService.js
const courseRepo = require('../repositories/courseRepository');

const getPublished         = async (query)       => courseRepo.getAllPublished(query);
const getAdminAll          = async (query)       => courseRepo.getAllForAdmin(query);
const getInstructorCourses = async (userId)      => courseRepo.getByInstructor(userId);
const getOne               = async (id)          => courseRepo.getById(id);
const remove               = async (id)          => courseRepo.deleteCourse(id);
const approveCourse        = async (id)          => courseRepo.updateStatus(id, 'published');
const unpublish            = async (id)          => courseRepo.updateStatus(id, 'unpublished');
const rejectCourse         = async (id, remark)  => courseRepo.updateStatus(id, 'rejected', remark);
const submitForReview      = async (id)          => courseRepo.updateStatus(id, 'pending_review');

const create = async (body, file, user) => {
  const thumbnail_url = file ? file.path : null;
  return courseRepo.create({ ...body, instructor_id: user.id, thumbnail_url });
};

const update = async (id, body, file) => {
  const fields = { ...body };
  if (file) fields.thumbnail_url = file.path;
  return courseRepo.update(id, fields);
};

module.exports = {
  getPublished, getAdminAll, getInstructorCourses, getOne,
  create, update, remove, submitForReview, approveCourse,
  rejectCourse, unpublish
};