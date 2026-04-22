const repo = require('../repositories/courseRepository');

const getPublished = async (query) => repo.getAllPublished(query);
const getAdminAll = async (query) => repo.getAllForAdmin(query);
const getInstructorCourses = async (instructor_id) => repo.getByInstructor(instructor_id);

const getOne = async (id, user) => {
  const course = await repo.getById(id);
  if (!course) throw { statusCode: 404, message: 'Course not found' };

  // ১. ইউজার অবজেক্ট চেক করা (ইউজার লগইন না থাকলে এটি গেস্ট হিসেবে কাজ করবে)
  const isSuperAdmin = user && user.is_super_admin;
  const isOwner = user && course.instructor_id === user.id;

  // ২. যদি কোর্স পাবলিশ না থাকে, তবে শুধুমাত্র এডমিন বা কোর্স মালিক দেখতে পারবে
  if (course.status !== 'published') {
    if (!isSuperAdmin && !isOwner) {
      throw { statusCode: 403, message: 'Course not available' };
    }
  }
  
  return course;
};

const create = async (data, file, user) => {
  if (!user) throw { statusCode: 401, message: 'Unauthorized' };
  const thumbnail_url = file ? file.path: null;
  return repo.create({ ...data, instructor_id: user.id, thumbnail_url });
};

const update = async (id, data, file, user) => {
  const course = await repo.getById(id);
  if (!course) throw { statusCode: 404, message: 'Course not found' };
  
  // নিরাপদ চেক: user অবজেক্ট আছে কি না
  const isSuperAdmin = user && user.is_super_admin;
  const isOwner = user && course.instructor_id === user.id;

  if (!isSuperAdmin && !isOwner)
    throw { statusCode: 403, message: 'Not your course' };

  const fields = { ...data };
  if (file) fields.thumbnail_url = file.path;
  return repo.update(id, fields);
};

// ... বাকি ফাংশনগুলো আগের মতোই থাকবে, তবে প্রতিটিতে (user && user.id) এমন চেক রাখা ভালো।

module.exports = { 
  getPublished, 
  getAdminAll, 
  getInstructorCourses, 
  getOne, 
  create, 
  update, 
  remove: async (id, user) => {
    const course = await repo.getById(id);
    if (!course) throw { statusCode: 404, message: 'Course not found' };
    if (!(user && user.is_super_admin) && course.instructor_id !== user?.id)
      throw { statusCode: 403, message: 'Not your course' };
    await repo.deleteCourse(id);
  }, 
  submitForReview, 
  approveCourse, 
  rejectCourse, 
  unpublish 
};
