const { pool } = require('../config/db');

const getByCourse = async (course_id) => {
  const [rows] = await pool.query('SELECT * FROM quizzes WHERE course_id = ?', [course_id]);
  if (!rows[0]) return null;
  const quiz = rows[0];
  const [questions] = await pool.query(
    'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC', [quiz.id]
  );
  quiz.questions = questions;
  return quiz;
};

const getById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM quizzes WHERE id = ?', [id]);
  if (!rows[0]) return null;
  const quiz = rows[0];
  const [questions] = await pool.query(
    'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC', [id]
  );
  quiz.questions = questions;
  return quiz;
};

// quiz without correct answers (for students taking quiz)
const getByIdForStudent = async (id) => {
  const [rows] = await pool.query('SELECT * FROM quizzes WHERE id = ?', [id]);
  if (!rows[0]) return null;
  const quiz = rows[0];
  const [questions] = await pool.query(
    'SELECT id, quiz_id, question_text, option_a, option_b, option_c, option_d FROM quiz_questions WHERE quiz_id = ?',
    [id]
  );
  quiz.questions = questions;
  return quiz;
};

const create = async ({ course_id, title, time_limit_min, pass_percentage, max_attempts }) => {
  const [result] = await pool.query(
    `INSERT INTO quizzes (course_id, title, time_limit_min, pass_percentage, max_attempts)
     VALUES (?,?,?,?,?)`,
    [course_id, title, time_limit_min || 30, pass_percentage || 60, max_attempts || 3]
  );
  return getById(result.insertId);
};

const update = async (id, fields) => {
  const allowed = ['title', 'time_limit_min', 'pass_percentage', 'max_attempts'];
  const updates = [];
  const values = [];
  for (const k of allowed) {
    if (fields[k] !== undefined) { updates.push(`${k} = ?`); values.push(fields[k]); }
  }
  if (updates.length) {
    values.push(id);
    await pool.query(`UPDATE quizzes SET ${updates.join(', ')} WHERE id = ?`, values);
  }
  return getById(id);
};

const addQuestion = async ({ quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option }) => {
  const [result] = await pool.query(
    `INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
     VALUES (?,?,?,?,?,?,?)`,
    [quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option]
  );
  const [rows] = await pool.query('SELECT * FROM quiz_questions WHERE id = ?', [result.insertId]);
  return rows[0];
};

const updateQuestion = async (qId, fields) => {
  const allowed = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option'];
  const updates = [];
  const values = [];
  for (const k of allowed) {
    if (fields[k] !== undefined) { updates.push(`${k} = ?`); values.push(fields[k]); }
  }
  if (!updates.length) return;
  values.push(qId);
  await pool.query(`UPDATE quiz_questions SET ${updates.join(', ')} WHERE id = ?`, values);
  const [rows] = await pool.query('SELECT * FROM quiz_questions WHERE id = ?', [qId]);
  return rows[0];
};

const deleteQuestion = async (qId) => {
  await pool.query('DELETE FROM quiz_questions WHERE id = ?', [qId]);
};

const countAttempts = async (quiz_id, student_id) => {
  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) AS count FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?',
    [quiz_id, student_id]
  );
  return count;
};

const saveAttempt = async ({ quiz_id, student_id, score, is_passed, answers_json }) => {
  const [result] = await pool.query(
    `INSERT INTO quiz_attempts (quiz_id, student_id, score, is_passed, answers_json)
     VALUES (?,?,?,?,?)`,
    [quiz_id, student_id, score, is_passed, JSON.stringify(answers_json)]
  );
  const [rows] = await pool.query('SELECT * FROM quiz_attempts WHERE id = ?', [result.insertId]);
  return rows[0];
};

const getAttemptsByQuiz = async (quiz_id) => {
  const [rows] = await pool.query(
    `SELECT qa.*, u.full_name AS student_name, u.email AS student_email
     FROM quiz_attempts qa JOIN users u ON qa.student_id = u.id
     WHERE qa.quiz_id = ? ORDER BY qa.attempted_at DESC`,
    [quiz_id]
  );
  return rows;
};

const getStudentAttempts = async (quiz_id, student_id) => {
  const [rows] = await pool.query(
    'SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? ORDER BY attempted_at DESC',
    [quiz_id, student_id]
  );
  return rows;
};

module.exports = {
  getByCourse, getById, getByIdForStudent, create, update,
  addQuestion, updateQuestion, deleteQuestion,
  countAttempts, saveAttempt, getAttemptsByQuiz, getStudentAttempts,
};
