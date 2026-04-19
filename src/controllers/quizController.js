const quizService = require('../services/quizService');
const res_ = require('../utils/response');

const getByCourse     = async (req,res,next) => { try { res_.success(res, await quizService.getByCourse(req.params.courseId, req.user)); } catch(e){next(e);} };
const create          = async (req,res,next) => { try { res_.created(res, await quizService.create(req.body, req.user), 'Quiz created'); } catch(e){next(e);} };
const update          = async (req,res,next) => { try { res_.success(res, await quizService.update(req.params.id, req.body, req.user), 'Quiz updated'); } catch(e){next(e);} };
const addQuestion     = async (req,res,next) => { try { res_.created(res, await quizService.addQuestion(req.params.id, req.body, req.user), 'Question added'); } catch(e){next(e);} };
const updateQuestion  = async (req,res,next) => { try { res_.success(res, await quizService.updateQuestion(req.params.qId, req.body, req.user), 'Question updated'); } catch(e){next(e);} };
const deleteQuestion  = async (req,res,next) => { try { await quizService.deleteQuestion(req.params.qId, req.user); res_.success(res, null, 'Question deleted'); } catch(e){next(e);} };
const submitAttempt   = async (req,res,next) => { try { res_.success(res, await quizService.submitAttempt(req.params.id, req.body.answers, req.user), 'Quiz submitted'); } catch(e){next(e);} };
const getAttempts     = async (req,res,next) => { try { res_.success(res, await quizService.getAttemptsByQuiz(req.params.id, req.user)); } catch(e){next(e);} };
const getMyAttempts   = async (req,res,next) => { try { res_.success(res, await quizService.getMyAttempts(req.params.id, req.user.id)); } catch(e){next(e);} };

module.exports = { getByCourse, create, update, addQuestion, updateQuestion, deleteQuestion, submitAttempt, getAttempts, getMyAttempts };
