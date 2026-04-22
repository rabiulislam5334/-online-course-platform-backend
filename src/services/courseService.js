// src/services/courseService.js
const repo = require('../repositories/courseRepository');

const getPublished         = (query)      => repo.getAllPublished(query);
const getAdminAll          = (query)      => repo.getAllForAdmin(query);
const getInstructorCourses = (userId)     => repo.getByInstructor(userId);
const getOne               = (id)         => repo.getById(id);
const remove               = (id)         => repo.deleteCourse(id);
const approveCourse        = (id)         => repo.updateStatus(id, 'published');
const unpublish            = (id)         => repo.updateStatus(id, 'unpublished');
const rejectCourse         = (id, remark) => repo.updateStatus(id, 'rejected', remark);
const submitForReview      = (id)         => repo.updateStatus(id, 'pending_review');

const create = async (body, file, user) => {
  const thumbnail_url = file ? file.path : null;
  return repo.create({ ...body, instructor_id: user.id, thumbnail_url });
};

const update = async (id, body, file) => {
  const fields = { ...body };
  if (file) fields.thumbnail_url = file.path;
  return repo.update(id, fields);
};

module.exports = {
  getPublished, getAdminAll, getInstructorCourses,
  getOne, create, update, remove,
  submitForReview, approveCourse, rejectCourse, unpublish
};