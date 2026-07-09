import { get, post, put, del } from '../utils/request.js'
import { extractList, extractItem } from '../utils/format.js'

const ADMIN_BASE = '/zhao-logistics/v1/admin'

// 通用 CT 工厂
const createContentApi = (resource) => ({
  list: (params = {}) => get(`${ADMIN_BASE}/${resource}`, params).then(extractList),
  detail: (documentId) => get(`${ADMIN_BASE}/${resource}/${documentId}`).then(extractItem),
  create: (data) => post(`${ADMIN_BASE}/${resource}`, { data }).then(extractItem),
  update: (documentId, data) => put(`${ADMIN_BASE}/${resource}/${documentId}`, { data }).then(extractItem),
  delete: (documentId) => del(`${ADMIN_BASE}/${resource}/${documentId}`).then(extractItem),
})

// 16 个 CT 的 CRUD
export const quoteRequestApi = createContentApi('quote-requests')
export const quoteFieldRuleApi = createContentApi('quote-field-rules')
export const quotePriceRuleApi = createContentApi('quote-price-rules')
export const quotePriceFormulaApi = createContentApi('quote-price-formulas')
export const trackingShipmentApi = createContentApi('tracking-shipments')
export const trackingNodeApi = createContentApi('tracking-nodes')
export const trackingProviderApi = createContentApi('tracking-providers')
export const contactMatrixApi = createContentApi('contact-matrices')
export const reviewApi = createContentApi('reviews')
export const subscriptionApi = createContentApi('subscriptions')
export const landingPageApi = createContentApi('landing-pages')
export const conversionFunnelApi = createContentApi('conversion-funnels')
export const conversionEventApi = createContentApi('conversion-events')
export const intentOrderApi = createContentApi('intent-orders')
export const referralApi = createContentApi('referrals')
export const customerProfileApi = createContentApi('customer-profiles')

// 自定义操作端点
export const logisticsActionApi = {
  reviewApprove: (id) => post(`${ADMIN_BASE}/reviews/${id}/approve`).then(extractItem),
  reviewReject: (id, reason) => post(`${ADMIN_BASE}/reviews/${id}/reject`, { data: { reason } }).then(extractItem),
  reviewReply: (id, content) => post(`${ADMIN_BASE}/reviews/${id}/reply`, { data: { content } }).then(extractItem),
  orderConvert: (id) => post(`${ADMIN_BASE}/intent-orders/${id}/convert`).then(extractItem),
  profileMerge: (sourceId, targetId) => post(`${ADMIN_BASE}/customer-profiles/merge`, { data: { sourceId, targetId } }).then(extractItem),
  funnelStats: (params) => get(`${ADMIN_BASE}/funnels/stats`, params).then(extractItem),
  referralStats: (params) => get(`${ADMIN_BASE}/referrals/stats`, params).then(extractItem),
}
