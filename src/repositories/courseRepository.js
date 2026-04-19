const { pool } = require('../config/db');

const getAllPublished = async ({ page = 1, limit = 10, category, difficulty, pricing, search }) => {
  const offset = (page - 1) * limit;
  let where = "WHERE c.status = 'published'";
  const params = [];

  if (category) { where += ' AND c.category = ?'; params.push(category); }
  if (difficulty) { where += ' AND c.difficulty = ?'; params.push(difficulty); }
  if (pricing === 'free') { where += ' AND c.price = 0'; }
  if (pricing === 'paid') { where += ' AND c.price > 0'; }
  if (search) { where += ' AND (c.title LIKE ? OR c.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM courses c ${where}`, params
  );

  const [rows] = await pool.query(
    `SELECT c.*, u.full_name AS instructor_name,
            (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS enrollment_count
     FROM courses c JOIN users u ON c.instructor_id = u.id
     ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  );

  return { data: rows, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) };
};

const getAllForAdmin = async ({ page = 1, limit = 10, status, search }) => {
  const offset = (page - 1) * limit;
  let where = 'WHERE 1=1';
  const params = [];

  if (status) { where += ' AND c.status = ?'; params.push(status); }
  if (search) { where += ' AND c.title LIKE ?'; params.push(`%${search}%`); }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM courses c ${where}`, params
  );

  const [rows] = await pool.query(
    `SELECT c.*, u.full_name AS instructor_name FROM courses c
     JOIN users u ON c.instructor_id = u.id
     ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  );

  return { data: rows, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) };
};

const getByInstructor = async (instructor_id) => {
  const [rows] = await pool.query(
    `SELECT c.*,
       (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS enrollment_count,
       (SELECT AVG(qa.score) FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id WHERE q.course_id = c.id) AS avg_quiz_score
     FROM courses c WHERE c.instructor_id = ?
     ORDER BY c.created_at DESC`,
    [instructor_id]
  );
  return rows;
};

const getById = async (id) => {
  const [rows] = await pool.query(
    `SELECT c.*, u.full_name AS instructor_name
     FROM courses c JOIN users u ON c.instructor_id = u.id
     WHERE c.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ instructor_id, title, description, category, difficulty, price, thumbnail_url }) => {
  const [result] = await pool.query(
    `INSERT INTO courses (instructor_id, title, description, category, difficulty, price, thumbnail_url, status)
     VALUES (?,?,?,?,?,?,?,'draft')`,
    [instructor_id, title, description, category, difficulty || 'beginner', price || 0, thumbnail_url || null]
  );
  return getById(result.insertId);
};

const update = async (id, fields) => {
  const allowed = ['title', 'description', 'category', 'difficulty', 'price', 'thumbnail_url'];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) { updates.push(`${key} = ?`); values.push(fields[key]); }
  }
  if (!updates.length) return getById(id);
  values.push(id);
  await pool.query(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`, values);
  return getById(id);
};

const updateStatus = async (id, status, remark = null) => {
  await pool.query('UPDATE courses SET status = ?, admin_remark = ? WHERE id = ?', [status, remark, id]);
  return getById(id);
};

const deleteCourse = async (id) => {
  await pool.query('DELETE FROM courses WHERE id = ?', [id]);
};

module.exports = { getAllPublished, getAllForAdmin, getByInstructor, getById, create, update, updateStatus, deleteCourse };
