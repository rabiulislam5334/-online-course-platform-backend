const { pool } = require('../config/db');
const res_ = require('../utils/response');

// ── Repository ──────────────────────────────────────────
const enroll = async (student_id, course_id) => {
  await pool.query(
    'INSERT INTO enrollments (student_id, course_id) VALUES (?,?)',
    [student_id, course_id]
  );
};

const getMyEnrollments = async (student_id) => {
  const [rows] = await pool.query(
    `SELECT e.*, c.title, c.thumbnail_url, c.category, c.difficulty,
            u.full_name AS instructor_name, e.progress_pct,
            (SELECT id FROM quizzes WHERE course_id = c.id LIMIT 1) AS quiz_id
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     JOIN users u ON c.instructor_id = u.id
     WHERE e.student_id = ?
     ORDER BY e.enrolled_at DESC`,
    [student_id]
  );
  return rows;
};

const getCourseEnrollments = async (course_id) => {
  const [rows] = await pool.query(
    `SELECT e.*, u.full_name, u.email
     FROM enrollments e JOIN users u ON e.student_id = u.id
     WHERE e.course_id = ?
     ORDER BY e.enrolled_at DESC`,
    [course_id]
  );
  return rows;
};

const getProgress = async (student_id, course_id) => {
  const [[enrollment]] = await pool.query(
    'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
    [student_id, course_id]
  );
  if (!enrollment) return null;

  const [lessons] = await pool.query(
    `SELECT l.id, l.title, l.order_index, l.is_free_preview,
            EXISTS(SELECT 1 FROM lesson_completions WHERE student_id = ? AND lesson_id = l.id) AS is_completed
     FROM lessons l WHERE l.course_id = ? ORDER BY l.order_index`,
    [student_id, course_id]
  );

  return { ...enrollment, lessons };
};

// ── Service ──────────────────────────────────────────────
const enrollService = {
  async enroll(student_id, course_id) {
    const [[course]] = await pool.query(
      "SELECT * FROM courses WHERE id = ? AND status = 'published'", [course_id]
    );
    if (!course) throw { statusCode: 404, message: 'Course not found or not published' };

    const [[existing]] = await pool.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [student_id, course_id]
    );
    if (existing) throw { statusCode: 409, message: 'Already enrolled' };

    await enroll(student_id, course_id);
    return { message: 'Enrolled successfully' };
  },

  async getMyEnrollments(student_id) {
    return getMyEnrollments(student_id);
  },

  async getCourseEnrollments(course_id, user) {
    const [[course]] = await pool.query('SELECT * FROM courses WHERE id = ?', [course_id]);
    if (!course) throw { statusCode: 404, message: 'Course not found' };
    if (!user.is_super_admin && course.instructor_id !== user.id)
      throw { statusCode: 403, message: 'Not your course' };
    return getCourseEnrollments(course_id);
  },

  async getProgress(student_id, course_id) {
    const prog = await getProgress(student_id, course_id);
    if (!prog) throw { statusCode: 403, message: 'Not enrolled in this course' };
    return prog;
  },
};

// ── Controller ──────────────────────────────────────────
const enrollController = {
  enroll: async (req, res, next) => {
    try {
      const data = await enrollService.enroll(req.user.id, req.body.course_id);
      res_.created(res, data, 'Enrolled successfully');
    } catch(e) { next(e); }
  },
  getMyEnrollments: async (req, res, next) => {
    try { res_.success(res, await enrollService.getMyEnrollments(req.user.id)); } catch(e){next(e);}
  },
  getCourseEnrollments: async (req, res, next) => {
    try { res_.success(res, await enrollService.getCourseEnrollments(req.params.courseId, req.user)); } catch(e){next(e);}
  },
  getProgress: async (req, res, next) => {
    try { res_.success(res, await enrollService.getProgress(req.user.id, req.params.courseId)); } catch(e){next(e);}
  },
};

module.exports = { enrollController, enrollService };
