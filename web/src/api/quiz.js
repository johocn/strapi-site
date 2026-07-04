import { get, post, put, del } from '../utils/request.js'
import { extractList, extractItem } from '../utils/format.js'

const V1 = '/zhao-quiz/v1'
const MY = `${V1}/my`
const ADMIN = `${V1}/admin`

export function getQuestionList(params = {}) {
  return get(`${ADMIN}/quizzes`, params).then(extractList)
}

export function getQuestionDetail(documentId) {
  return get(`${ADMIN}/quizzes/${documentId}`).then(extractItem)
}

export function createQuestion(data) {
  return post(`${ADMIN}/quizzes`, data).then(extractItem)
}

export function updateQuestion(documentId, data) {
  return put(`${ADMIN}/quizzes/${documentId}`, data).then(extractItem)
}

export function deleteQuestion(documentId) {
  return del(`${ADMIN}/quizzes/${documentId}`).then(extractItem)
}

export function getExamList(params = {}) {
  return get(`${ADMIN}/quiz-exams`, params).then(extractList)
}

export function getExamDetail(documentId) {
  return get(`${ADMIN}/quiz-exams/${documentId}`).then(extractItem)
}

export function createExam(data) {
  return post(`${ADMIN}/quiz-exams`, { data }).then(extractItem)
}

export function updateExam(documentId, data) {
  return put(`${ADMIN}/quiz-exams/${documentId}`, { data }).then(extractItem)
}

export function deleteExam(documentId) {
  return del(`${ADMIN}/quiz-exams/${documentId}`).then(extractItem)
}

export function getExamQuestions(documentId) {
  return get(`${ADMIN}/quiz-exams/${documentId}/questions`).then(extractList)
}

export function submitAnswer(data) {
  return post(`${MY}/quiz-records/submit`, data).then(extractItem)
}

export function getMyQuizRecords(params = {}) {
  return get(`${MY}/quiz-records`, params).then(extractList)
}

export function startExam(data) {
  return post(`${MY}/quiz-exam-attempts/start`, data).then(extractItem)
}

export function submitExam(documentId, data) {
  return post(`${MY}/quiz-exam-attempts/${documentId}/submit`, data).then(extractItem)
}

export function getMyExamAttempts(params = {}) {
  return get(`${MY}/exam-attempts`, params).then(extractList)
}

export function downloadQuizTemplate() {
  return get(`${ADMIN}/quiz-batches/template/download`)
}

export function getQuizRecordList(params = {}) {
  return get(`${ADMIN}/quiz-records`, params).then(extractList)
}

export function getQuizRecordDetail(documentId) {
  return get(`${ADMIN}/quiz-records/${documentId}`).then(extractItem)
}

export function gradeQuizRecord(documentId, data) {
  return put(`${ADMIN}/quiz-records/${documentId}/grade`, { data }).then(extractItem)
}

export function getPendingGrading(params = {}) {
  return get(`${ADMIN}/quiz-records/pending-grading`, params).then(extractList)
}

export function getExamAttemptList(params = {}) {
  return get(`${ADMIN}/quiz-exam-attempts`, params).then(extractList)
}

export function getExamAttemptDetail(documentId) {
  return get(`${ADMIN}/quiz-exam-attempts/${documentId}`).then(extractItem)
}

export function createQuizBatch(data) {
  return post(`${ADMIN}/quiz-batches`, { data }).then(extractItem)
}

export function importQuizBatch(documentId) {
  return post(`${ADMIN}/quiz-batches/${documentId}/import`).then(extractItem)
}

export function getQuizBatchList(params = {}) {
  return get(`${ADMIN}/quiz-batches`, params).then(extractList)
}

export function getQuizBatchDetail(documentId) {
  return get(`${ADMIN}/quiz-batches/${documentId}`).then(extractItem)
}

export function updateQuizBatch(documentId, data) {
  return put(`${ADMIN}/quiz-batches/${documentId}`, { data }).then(extractItem)
}

export function deleteQuizBatch(documentId) {
  return del(`${ADMIN}/quiz-batches/${documentId}`).then(extractItem)
}
