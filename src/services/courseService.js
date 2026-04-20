const repo = require('../repositories/courseRepository');

const getPublished = async (query) => repo.getAllPublished(query);

const getAdminAll = async (query) => repo.getAllForAdmin(query);

const getInstructorCourses = async (instructor_id) => repo.getByInstructor(instructor_id);

const getOne = async (id, user) => {
  const course = await repo.getById(id);
  if (!course) throw { statusCode: 404, message: 'Course not found' };

  // non-admin, non-owner cannot see unpublished
  if (
    course.status !== 'published' &&
    !user.is_super_admin &&
    course.instructor_id !== user.id
  ) {
    throw { statusCode: 403, message: 'Course not available' };
  }
  return course;
};

const create = async (data, file, user) => {
  const thumbnail_url = file ? file.path : null;
  return repo.create({ ...data, instructor_id: user.id, thumbnail_url });
};

const update = async (id, data, file, user) => {
  const course = await repo.getById(id);
  if (!course) throw { statusCode: 404, message: 'Course not found' };
  if (!user.is_super_admin && course.instructor_id !== user.id)
    throw { statusCode: 403, message: 'Not your course' };

  const fields = { ...data };
if (file) fields.thumbnail_url = file.path;
  return repo.update(id, fields);
};

const remove = async (id, user) => {
  const course = await repo.getById(id);
  if (!course) throw { statusCode: 404, message: 'Course not found' };
  if (!user.is_super_admin && course.instructor_id !== user.id)
    throw { statusCode: 403, message: 'Not your course' };
  await repo.deleteCourse(id);
};

const submitForReview = async (id, user) => {
  const course = await repo.getById(id);
  if (!course) throw { statusCode: 404, message: 'Course not found' };
  if (course.instructor_id !== user.id) throw { statusCode: 403, message: 'Not your course' };
  if (course.status !== 'draft') throw { statusCode: 400, message: 'Only draft courses can be submitted' };
  return repo.updateStatus(id, 'pending_review');
};

const approveCourse = async (id) => {
  const course = await repo.getById(id);
  if (!course) throw { statusCode: 404, message: 'Course not found' };
  if (course.status !== 'pending_review') throw { statusCode: 400, message: 'Course not pending review' };
  return repo.updateStatus(id, 'published');
};

const rejectCourse = async (id, remark) => {
  const course = await repo.getById(id);
  if (!course) throw { statusCode: 404, message: 'Course not found' };
  return repo.updateStatus(id, 'rejected', remark);
};

const unpublish = async (id) => {
  const course = await repo.getById(id);
  if (!course) throw { statusCode: 404, message: 'Course not found' };
  return repo.updateStatus(id, 'unpublished');
};

module.exports = { getPublished, getAdminAll, getInstructorCourses, getOne, create, update, remove, submitForReview, approveCourse, rejectCourse, unpublish };
