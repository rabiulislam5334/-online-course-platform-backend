const { pool } = require('../config/db');

// ── Repository ──────────────────────────────────────────
const getByCourse = async (course_id, student_id = null) => {
  const [rows] = await pool.query(
    `SELECT l.*,
       ${student_id
         ? `EXISTS(SELECT 1 FROM lesson_completions WHERE student_id = ? AND lesson_id = l.id) AS is_completed`
         : 'FALSE AS is_completed'}
     FROM lessons l WHERE l.course_id = ? ORDER BY l.order_index ASC`,
    student_id ? [student_id, course_id] : [course_id]
  );
  return rows;
};

const getById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM lessons WHERE id = ?', [id]);
  return rows[0] || null;
};

const create = async ({ course_id, title, content, video_url, file_url, is_free_preview, order_index }) => {
  // auto order_index if not provided
  if (order_index === undefined) {
    const [[{ maxIdx }]] = await pool.query(
      'SELECT COALESCE(MAX(order_index),0) AS maxIdx FROM lessons WHERE course_id = ?', [course_id]
    );
    order_index = maxIdx + 1;
  }
  const [result] = await pool.query(
    `INSERT INTO lessons (course_id, title, content, video_url, file_url, is_free_preview, order_index)
     VALUES (?,?,?,?,?,?,?)`,
    [course_id, title, content || null, video_url || null, file_url || null, is_free_preview || false, order_index]
  );
  return getById(result.insertId);
};

const update = async (id, fields) => {
  const allowed = ['title', 'content', 'video_url', 'file_url', 'is_free_preview', 'order_index'];
  const updates = [];
  const values = [];
  for (const k of allowed) {
    if (fields[k] !== undefined) { updates.push(`${k} = ?`); values.push(fields[k]); }
  }
  if (!updates.length) return getById(id);
  values.push(id);
  await pool.query(`UPDATE lessons SET ${updates.join(', ')} WHERE id = ?`, values);
  return getById(id);
};

const reorder = async (orders) => {
  // orders: [{ id, order_index }]
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const { id, order_index } of orders) {
      await conn.query('UPDATE lessons SET order_index = ? WHERE id = ?', [order_index, id]);
    }
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
};

const deleteLesson = async (id) => {
  await pool.query('DELETE FROM lessons WHERE id = ?', [id]);
};

const markComplete = async (student_id, lesson_id) => {
  await pool.query(
    'INSERT IGNORE INTO lesson_completions (student_id, lesson_id) VALUES (?,?)',
    [student_id, lesson_id]
  );
  // recalculate enrollment progress
  const lesson = await getById(lesson_id);
  if (!lesson) return;
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM lessons WHERE course_id = ?', [lesson.course_id]
  );
  const [[{ done }]] = await pool.query(
    `SELECT COUNT(*) AS done FROM lesson_completions lc
     JOIN lessons l ON lc.lesson_id = l.id
     WHERE lc.student_id = ? AND l.course_id = ?`,
    [student_id, lesson.course_id]
  );
  const progress = total > 0 ? (done / total) * 100 : 0;
  await pool.query(
    'UPDATE enrollments SET progress_pct = ? WHERE student_id = ? AND course_id = ?',
    [progress.toFixed(2), student_id, lesson.course_id]
  );
};

// ── Service ──────────────────────────────────────────────
const { pool: _pool } = require('../config/db');

const lessonService = {
  async getByCourse(course_id, user) {
    const lessons = await getByCourse(course_id, user?.id);
    // students can only see free preview if not enrolled
    if (user && user.role_name === 'Student') {
      const [[enroll]] = await _pool.query(
        'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [user.id, course_id]
      );
      if (!enroll) return lessons.filter(l => l.is_free_preview);
    }
    return lessons;
  },

  async create(data, file, user) {
    // verify instructor owns the course
    const [[course]] = await _pool.query('SELECT * FROM courses WHERE id = ?', [data.course_id]);
    if (!course) throw { statusCode: 404, message: 'Course not found' };
    if (!user.is_super_admin && course.instructor_id !== user.id)
      throw { statusCode: 403, message: 'Not your course' };
    if (file) data.file_url = file.path; 
    return create(data);
  },

  async update(id, data, file, user) {
    const lesson = await getById(id);
    if (!lesson) throw { statusCode: 404, message: 'Lesson not found' };
    const [[course]] = await _pool.query('SELECT * FROM courses WHERE id = ?', [lesson.course_id]);
    if (!user.is_super_admin && course.instructor_id !== user.id)
      throw { statusCode: 403, message: 'Not your course' };
    if (file) data.file_url = file.path; 
    return update(id, data);
  },

  async reorder(orders) { return reorder(orders); },

  async delete(id, user) {
    const lesson = await getById(id);
    if (!lesson) throw { statusCode: 404, message: 'Lesson not found' };
    const [[course]] = await _pool.query('SELECT * FROM courses WHERE id = ?', [lesson.course_id]);
    if (!user.is_super_admin && course.instructor_id !== user.id)
      throw { statusCode: 403, message: 'Not your course' };
    await deleteLesson(id);
  },

  async markComplete(student_id, lesson_id) {
    const lesson = await getById(lesson_id);
    if (!lesson) throw { statusCode: 404, message: 'Lesson not found' };
    const [[enroll]] = await _pool.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [student_id, lesson.course_id]
    );
    if (!enroll) throw { statusCode: 403, message: 'Not enrolled in this course' };
    await markComplete(student_id, lesson_id);
  },
};

// ── Controller ──────────────────────────────────────────
const res_ = require('../utils/response');

const lessonController = {
  getByCourse: async (req, res, next) => {
    try { res_.success(res, await lessonService.getByCourse(req.params.courseId, req.user)); } catch(e){next(e);}
  },
  create: async (req, res, next) => {
    try { res_.created(res, await lessonService.create(req.body, req.file, req.user), 'Lesson created'); } catch(e){next(e);}
  },
  update: async (req, res, next) => {
    try { res_.success(res, await lessonService.update(req.params.id, req.body, req.file, req.user), 'Lesson updated'); } catch(e){next(e);}
  },
  reorder: async (req, res, next) => {
    try { await lessonService.reorder(req.body.orders); res_.success(res, null, 'Lessons reordered'); } catch(e){next(e);}
  },
  delete: async (req, res, next) => {
    try { await lessonService.delete(req.params.id, req.user); res_.success(res, null, 'Lesson deleted'); } catch(e){next(e);}
  },
  markComplete: async (req, res, next) => {
    try { await lessonService.markComplete(req.user.id, req.params.id); res_.success(res, null, 'Lesson marked complete'); } catch(e){next(e);}
  },
};

module.exports = { lessonController, lessonService };
