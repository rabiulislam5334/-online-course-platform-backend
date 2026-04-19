const { pool } = require('../config/db');
const repo = require('../repositories/quizRepository');
const courseRepo = require('../repositories/courseRepository');

const _verifyInstructor = async (quiz_id, user) => {
  const quiz = await repo.getById(quiz_id);
  if (!quiz) throw { statusCode: 404, message: 'Quiz not found' };
  const course = await courseRepo.getById(quiz.course_id);
  if (!user.is_super_admin && course.instructor_id !== user.id)
    throw { statusCode: 403, message: 'Not your quiz' };
  return { quiz, course };
};

const getByCourse = async (course_id, user) => {
  const quiz = await repo.getByCourse(course_id);
  if (!quiz) throw { statusCode: 404, message: 'No quiz for this course' };
  // students don't see correct answers
  if (user.role_name === 'Student') return repo.getByIdForStudent(quiz.id);
  return quiz;
};

const create = async (data, user) => {
  const course = await courseRepo.getById(data.course_id);
  if (!course) throw { statusCode: 404, message: 'Course not found' };
  if (!user.is_super_admin && course.instructor_id !== user.id)
    throw { statusCode: 403, message: 'Not your course' };
  const existing = await repo.getByCourse(data.course_id);
  if (existing) throw { statusCode: 409, message: 'Quiz already exists for this course' };
  return repo.create(data);
};

const update = async (id, data, user) => {
  await _verifyInstructor(id, user);
  return repo.update(id, data);
};

const addQuestion = async (quiz_id, data, user) => {
  await _verifyInstructor(quiz_id, user);
  return repo.addQuestion({ quiz_id, ...data });
};

const updateQuestion = async (qId, data, user) => {
  const [questions] = await pool.query(
    'SELECT qq.*, q.course_id FROM quiz_questions qq JOIN quizzes q ON qq.quiz_id = q.id WHERE qq.id = ?', [qId]
  );
  if (!questions[0]) throw { statusCode: 404, message: 'Question not found' };
  const course = await courseRepo.getById(questions[0].course_id);
  if (!user.is_super_admin && course.instructor_id !== user.id)
    throw { statusCode: 403, message: 'Not your quiz' };
  return repo.updateQuestion(qId, data);
};

const deleteQuestion = async (qId, user) => {
  const [questions] = await pool.query(
    'SELECT qq.*, q.course_id FROM quiz_questions qq JOIN quizzes q ON qq.quiz_id = q.id WHERE qq.id = ?', [qId]
  );
  if (!questions[0]) throw { statusCode: 404, message: 'Question not found' };
  const course = await courseRepo.getById(questions[0].course_id);
  if (!user.is_super_admin && course.instructor_id !== user.id)
    throw { statusCode: 403, message: 'Not your quiz' };
  await repo.deleteQuestion(qId);
};

const submitAttempt = async (quiz_id, answers, user) => {
  // answers: [{ question_id, selected_option }]
  const quiz = await repo.getById(quiz_id);
  if (!quiz) throw { statusCode: 404, message: 'Quiz not found' };

  // check enrollment
  const [[enroll]] = await pool.query(
    'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
    [user.id, quiz.course_id]
  );
  if (!enroll) throw { statusCode: 403, message: 'Not enrolled in this course' };

  // check attempt limit
  const attemptCount = await repo.countAttempts(quiz_id, user.id);
  if (attemptCount >= quiz.max_attempts)
    throw { statusCode: 400, message: `Max attempts (${quiz.max_attempts}) reached` };

  // grade
  const questions = quiz.questions;
  let correct = 0;
  const gradedAnswers = questions.map(q => {
    const userAnswer = answers.find(a => a.question_id === q.id);
    const selected = userAnswer?.selected_option || null;
    const isCorrect = selected === q.correct_option;
    if (isCorrect) correct++;
    return {
      question_id: q.id,
      question_text: q.question_text,
      selected_option: selected,
      correct_option: q.correct_option,
      is_correct: isCorrect,
    };
  });

  const score = questions.length > 0 ? (correct / questions.length) * 100 : 0;
  const is_passed = score >= quiz.pass_percentage;

  const attempt = await repo.saveAttempt({
    quiz_id,
    student_id: user.id,
    score: parseFloat(score.toFixed(2)),
    is_passed,
    answers_json: gradedAnswers,
  });

  // auto-issue certificate if passed
  if (is_passed) {
    await pool.query(
      `INSERT IGNORE INTO certificates (student_id, course_id, quiz_attempt_id, score)
       VALUES (?,?,?,?)`,
      [user.id, quiz.course_id, attempt.id, attempt.score]
    );
  }

  return {
    score: attempt.score,
    is_passed,
    pass_percentage: quiz.pass_percentage,
    correct_count: correct,
    total_questions: questions.length,
    graded_answers: gradedAnswers,
    certificate_issued: is_passed,
  };
};

const getAttemptsByQuiz = async (quiz_id, user) => {
  await _verifyInstructor(quiz_id, user);
  return repo.getAttemptsByQuiz(quiz_id);
};

const getMyAttempts = async (quiz_id, student_id) => {
  return repo.getStudentAttempts(quiz_id, student_id);
};

module.exports = { getByCourse, create, update, addQuestion, updateQuestion, deleteQuestion, submitAttempt, getAttemptsByQuiz, getMyAttempts };
