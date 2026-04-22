// src/services/courseService.js

const courseRepo = require('../repositories/courseRepository');

const getPublished = async (query) => {
  return await courseRepo.findPublished(query);
};

const getAdminAll = async (query) => {
  return await courseRepo.findAll(query);
};

const getInstructorCourses = async (userId) => {
  return await courseRepo.findByInstructor(userId);
};

const getOne = async (id, user) => {
  return await courseRepo.findById(id, user);
};

const create = async (body, file, user) => {
  return await courseRepo.create(body, file, user);
};

const update = async (id, body, file, user) => {
  return await courseRepo.update(id, body, file, user);
};

const remove = async (id, user) => {
  return await courseRepo.remove(id, user);
};

const submitForReview = async (id, user) => {
  return await courseRepo.updateStatus(id, 'pending', user);
};

const approveCourse = async (id) => {
  return await courseRepo.updateStatus(id, 'published');
};

const rejectCourse = async (id, remark) => {
  return await courseRepo.updateStatus(id, 'rejected', null, remark);
};

const unpublish = async (id) => {
  return await courseRepo.updateStatus(id, 'draft');
};

module.exports = {
  getPublished,
  getAdminAll,
  getInstructorCourses,
  getOne,
  create,
  update,
  remove,
  submitForReview,
  approveCourse,
  rejectCourse,
  unpublish
};