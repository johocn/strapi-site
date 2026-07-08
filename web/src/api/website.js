import { get, post, put, del } from '../utils/request.js'
import { extractList, extractItem } from '../utils/format.js'

const ADMIN_BASE = '/zhao-website/v1/admin'

// ==================== 文章管理 ====================
export const articleApi = {
  list: (params = {}) => get(`${ADMIN_BASE}/articles`, params).then(extractList),
  detail: (documentId) => get(`${ADMIN_BASE}/articles/${documentId}`).then(extractItem),
  create: (data) => post(`${ADMIN_BASE}/articles`, { data }).then(extractItem),
  update: (documentId, data) => put(`${ADMIN_BASE}/articles/${documentId}`, { data }).then(extractItem),
  delete: (documentId) => del(`${ADMIN_BASE}/articles/${documentId}`).then(extractItem),
  publish: (documentId) => post(`${ADMIN_BASE}/articles/${documentId}/publish`).then(extractItem),
  archive: (documentId) => post(`${ADMIN_BASE}/articles/${documentId}/archive`).then(extractItem),
  batch: (action, documentIds) => post(`${ADMIN_BASE}/articles/batch`, { action, documentIds }).then(extractItem),
}

// ==================== 线索管理 ====================
export const leadApi = {
  list: (params = {}) => get(`${ADMIN_BASE}/leads`, params).then(extractList),
  detail: (documentId) => get(`${ADMIN_BASE}/leads/${documentId}`).then(extractItem),
  update: (documentId, data) => put(`${ADMIN_BASE}/leads/${documentId}`, { data }).then(extractItem),
  delete: (documentId) => del(`${ADMIN_BASE}/leads/${documentId}`).then(extractItem),
}

// ==================== Studio Bridge（一键发布） ====================
export const studioBridgeApi = {
  publishFromStudio: (data) => post(`${ADMIN_BASE}/studio-bridge/publish`, data).then(extractItem),
}

// ==================== 统计 ====================
export const statsApi = {
  overview: () => get(`${ADMIN_BASE}/stats/overview`).then(extractItem),
  leads: (days = 30) => get(`${ADMIN_BASE}/stats/leads`, { days }).then(extractItem),
  search: (days = 30) => get(`${ADMIN_BASE}/stats/search`, { days }).then(extractItem),
}

// ==================== SEO 配置 ====================
export const seoConfigApi = {
  get: () => get(`${ADMIN_BASE}/seo-config`).then(res => extractItem(res) || {}),
  save: (data) => {
    const existing = data.documentId
    return existing
      ? put(`${ADMIN_BASE}/seo-config/${existing}`, { data }).then(extractItem)
      : post(`${ADMIN_BASE}/seo-config`, { data }).then(extractItem)
  },
}

// ==================== 知识图谱（后端路径为 /kg） ====================
export const knowledgeGraphApi = {
  listEntities: (params = {}) => get(`${ADMIN_BASE}/kg/entities`, params).then(extractList),
  createEntity: (data) => post(`${ADMIN_BASE}/kg/entities`, { data }).then(extractItem),
  updateEntity: (documentId, data) => put(`${ADMIN_BASE}/kg/entities/${documentId}`, { data }).then(extractItem),
  deleteEntity: (documentId) => del(`${ADMIN_BASE}/kg/entities/${documentId}`).then(extractItem),
  listRelations: (params = {}) => get(`${ADMIN_BASE}/kg/relations`, params).then(extractList),
  addRelation: (data) => post(`${ADMIN_BASE}/kg/relations`, { data }).then(extractItem),
  deleteRelation: (documentId) => del(`${ADMIN_BASE}/kg/relations/${documentId}`).then(extractItem),
  exportGraph: () => get(`${ADMIN_BASE}/kg/export`).then(extractItem),
}

// ==================== 第一真值（后端路径为 /first-truths） ====================
export const firstTruthApi = {
  list: (params = {}) => get(`${ADMIN_BASE}/first-truths`, params).then(extractList),
  detail: (documentId) => get(`${ADMIN_BASE}/first-truths/${documentId}`).then(extractItem),
  create: (data) => post(`${ADMIN_BASE}/first-truths`, { data }).then(extractItem),
  update: (documentId, data) => put(`${ADMIN_BASE}/first-truths/${documentId}`, { data }).then(extractItem),
  delete: (documentId) => del(`${ADMIN_BASE}/first-truths/${documentId}`).then(extractItem),
  verify: (documentId) => post(`${ADMIN_BASE}/first-truths/${documentId}/verify`).then(extractItem),
  conflicts: () => get(`${ADMIN_BASE}/first-truths/conflicts`).then(extractList),
}

// ==================== 通用内容 CT API ====================
// product/case/faq/tutorial/compliance/download 复用
export const createContentApi = (resource) => ({
  list: (params = {}) => get(`${ADMIN_BASE}/${resource}`, params).then(extractList),
  detail: (documentId) => get(`${ADMIN_BASE}/${resource}/${documentId}`).then(extractItem),
  create: (data) => post(`${ADMIN_BASE}/${resource}`, { data }).then(extractItem),
  update: (documentId, data) => put(`${ADMIN_BASE}/${resource}/${documentId}`, { data }).then(extractItem),
  delete: (documentId) => del(`${ADMIN_BASE}/${resource}/${documentId}`).then(extractItem),
  publish: (documentId) => post(`${ADMIN_BASE}/${resource}/${documentId}/publish`).then(extractItem),
  archive: (documentId) => post(`${ADMIN_BASE}/${resource}/${documentId}/archive`).then(extractItem),
})

export const productApi = createContentApi('products')
export const caseApi = createContentApi('cases')
export const faqApi = createContentApi('faqs')
export const tutorialApi = createContentApi('tutorials')
export const complianceApi = createContentApi('compliance')
export const downloadApi = createContentApi('downloads')

// ==================== 品牌信息（单例） ====================
export const brandInfoApi = {
  get: () => get(`${ADMIN_BASE}/brand-info`).then(res => extractList(res)).then(list => list[0] || null),
  save: (data) => {
    const existing = data.documentId
    return existing
      ? put(`${ADMIN_BASE}/brand-info/${existing}`, { data }).then(extractItem)
      : post(`${ADMIN_BASE}/brand-info`, { data }).then(extractItem)
  },
}

// ==================== 文章分类 ====================
export const articleCategoryApi = createContentApi('article-categories')

// ==================== AI 摘要 ====================
export const aiSummaryApi = {
  list: (params = {}) => get(`${ADMIN_BASE}/ai-summaries`, params).then(extractList),
  detail: (documentId) => get(`${ADMIN_BASE}/ai-summaries/${documentId}`).then(extractItem),
  create: (data) => post(`${ADMIN_BASE}/ai-summaries`, { data }).then(extractItem),
  update: (documentId, data) => put(`${ADMIN_BASE}/ai-summaries/${documentId}`, { data }).then(extractItem),
  delete: (documentId) => del(`${ADMIN_BASE}/ai-summaries/${documentId}`).then(extractItem),
  regenerate: (documentId) => post(`${ADMIN_BASE}/ai-summaries/${documentId}/regenerate`).then(extractItem),
}

// ==================== 只读日志 ====================
export const visitLogApi = {
  list: (params = {}) => get(`${ADMIN_BASE}/visit-logs`, params).then(extractList),
}
export const interactionApi = {
  list: (params = {}) => get(`${ADMIN_BASE}/interactions`, params).then(extractList),
}
export const searchLogApi = {
  list: (params = {}) => get(`${ADMIN_BASE}/search-logs`, params).then(extractList),
}
