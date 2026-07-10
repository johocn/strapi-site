import { get, post, put, del } from '../utils/request.js'
import { extractList, extractItem } from '../utils/format.js'

const ADMIN_BASE = '/zhao-studio/v1/admin'

const createContentApi = (resource) => ({
  list: (params = {}) => get(`${ADMIN_BASE}/${resource}`, params).then(extractList),
  detail: (documentId) => get(`${ADMIN_BASE}/${resource}/${documentId}`).then(extractItem),
  create: (data) => post(`${ADMIN_BASE}/${resource}`, { data }).then(extractItem),
  update: (documentId, data) => put(`${ADMIN_BASE}/${resource}/${documentId}`, { data }).then(extractItem),
  delete: (documentId) => del(`${ADMIN_BASE}/${resource}/${documentId}`).then(extractItem),
})

// 10 个 CT 的 CRUD
export const articleDraftApi = createContentApi('articles')
export const knowledgeIndexApi = createContentApi('knowledge-indices')
export const collectSourceApi = createContentApi('sources')
export const collectTaskApi = createContentApi('tasks')
export const publishPlatformApi = createContentApi('platforms')
export const publishAccountApi = createContentApi('accounts')
export const publishRecordApi = createContentApi('records')
export const statSummaryApi = createContentApi('stat-summaries')
export const browserLogApi = createContentApi('browser-logs')
export const adSlotApi = createContentApi('ad-slots')

// 采集工作流
export const collectActionApi = {
  createTask: (sourceId) => post(`${ADMIN_BASE}/tasks`, { data: { sourceId } }).then(extractItem),
  getTask: (taskId) => get(`${ADMIN_BASE}/tasks/${taskId}`).then(extractItem),
  fetchSelectedContent: (taskId, selectedTitles) => post(`${ADMIN_BASE}/tasks/${taskId}/content`, { data: { selectedTitles } }).then(extractItem),
  confirmImport: (taskId, contents, scope, tenantId) => post(`${ADMIN_BASE}/tasks/${taskId}/confirm`, { data: { contents, scope, tenantId } }).then(extractItem),
}

// 发布工作流
export const publishActionApi = {
  publishArticle: (articleId, accountIds) => post(`${ADMIN_BASE}/articles/${articleId}/publish`, { data: { accountIds } }).then(extractItem),
  retryPublish: (recordId) => post(`${ADMIN_BASE}/records/${recordId}/retry`).then(extractItem),
  syncStatus: (articleId) => post(`${ADMIN_BASE}/articles/${articleId}/sync`).then(extractItem),
}

// AI 能力
export const aiActionApi = {
  getConfig: () => get(`${ADMIN_BASE}/ai/config`).then(extractItem),
  updateConfig: (config) => post(`${ADMIN_BASE}/ai/config`, { data: config }).then(extractItem),
  testAi: () => post(`${ADMIN_BASE}/ai/test`).then(extractItem),
  generateSummary: (articleId) => post(`${ADMIN_BASE}/ai/articles/${articleId}/summary`).then(extractItem),
  optimizeTitle: (articleId) => post(`${ADMIN_BASE}/ai/articles/${articleId}/title`).then(extractItem),
  rewrite: (articleId) => post(`${ADMIN_BASE}/ai/articles/${articleId}/rewrite`).then(extractItem),
  convert: (articleId) => post(`${ADMIN_BASE}/ai/articles/${articleId}/convert`).then(extractItem),
  chat: (message) => post(`${ADMIN_BASE}/ai/chat`, { data: { message } }).then(extractItem),
}

// 统计查询（6 维度）
export const statsApi = {
  overview: (params) => get(`${ADMIN_BASE}/stats/overview`, params).then(extractItem),
  articles: (params) => get(`${ADMIN_BASE}/stats/articles`, params).then(extractItem),
  adSlots: (params) => get(`${ADMIN_BASE}/stats/ad-slots`, params).then(extractItem),
  devices: (params) => get(`${ADMIN_BASE}/stats/devices`, params).then(extractItem),
  regions: (params) => get(`${ADMIN_BASE}/stats/regions`, params).then(extractItem),
  users: (params) => get(`${ADMIN_BASE}/stats/users`, params).then(extractItem),
}
