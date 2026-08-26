import { get, post, put, del } from '../utils/request.js'
import { extractList, extractItem } from '../utils/format.js'

const V1 = '/zhao-point/v1'
// 注意：zhao-point 后端所有管理端（list/create/series/对账等）路由都注册在 /v1/admin/adm 段下，
// 必须带 /adm。此前缺 /adm 会 405（如系列新建）。与 resource.js 的 /adm 前缀对齐。
const ADMIN = `${V1}/admin/adm`

// 活动管理（list/create 走 /adm/activities；获取单项复用列表接口）

export function listActivities(params = {}) {
  return get(`${ADMIN}/activities`, params).then(extractList)
}

// 按 documentId 从列表接口取单项（后端 adminList 支持 documentIds 过滤，以此精准命中当前活动）
export async function getActivity(documentId, params = {}) {
  const res = await get(`${ADMIN}/activities`, { ...params, documentIds: documentId, page: 1, pageSize: 1 })
  const list = res?.list ?? res?.data ?? []
  return flattenItem(list[0] || null)
}

function flattenItem(item) {
  if (!item) return null
  if (item.attributes) return { ...item.attributes, id: item.id, documentId: item.documentId }
  return item
}

export function createActivity(data) {
  return post(`${ADMIN}/activities`, data).then(extractItem)
}

export function updateActivity(documentId, data) {
  return put(`${ADMIN}/activities/${documentId}`, data).then(extractItem)
}

export function deleteActivity(documentId) {
  return del(`${ADMIN}/activities/${documentId}`).then(extractItem)
}

// 归档 / 恢复（已结束活动→归档；已归档→恢复为已结束）
export function archiveActivity(documentId) {
  return post(`${ADMIN}/activities/${documentId}/archive`).then(extractItem)
}
export function unarchiveActivity(documentId) {
  return post(`${ADMIN}/activities/${documentId}/unarchive`).then(extractItem)
}

// 报名名单（active=已报名 / cancelled=已取消；attendedAt 有值=已到场）
export function getActivitySignups(documentId) {
  return get(`${ADMIN}/activities/${documentId}/signups`).then(extractList)
}

// 移出候补（仅 waiting 可移出；不改动名额）
export function cancelActivitySignup(documentId, signupId) {
  return post(`${ADMIN}/activities/${documentId}/signups/${signupId}/cancel`)
}

// 扫码核销到场（成功返回 {ok:true,...}；已签过返回 {ok:false,reason:'already_checked_in'}；未报名 400）
export function scanCheckin(documentId, data) {
  // 不走 extractItem，保留 ok/ reason 字段供页面区分结果类型
  return post(`${ADMIN}/activities/${documentId}/scan-checkin`, data)
}

// 到场记录
export function getActivityAttendance(documentId) {
  return get(`${ADMIN}/activities/${documentId}/attendance`).then(extractList)
}

// ===== 活动系列 =====

export function listSeries(params = {}) {
  return get(`${ADMIN}/series`, params).then(extractList)
}

export function getSeries(documentId) {
  return get(`${ADMIN}/series/${documentId}`).then(extractItem)
}

export function createSeries(data) {
  return post(`${ADMIN}/series`, data).then(extractItem)
}

export function updateSeries(documentId, data) {
  return put(`${ADMIN}/series/${documentId}`, data).then(extractItem)
}

export function deleteSeries(documentId) {
  return del(`${ADMIN}/series/${documentId}`).then(extractItem)
}

// 系列下全部场次（无 query 参数）
export function getSeriesActivities(documentId) {
  return get(`${ADMIN}/series/${documentId}/activities`).then(extractList)
}

// 复制场次，返回新建的一场
export function duplicateActivity(activityDocumentId) {
  return post(`${ADMIN}/activities/${activityDocumentId}/duplicate`).then(extractItem)
}

// 按排期规则批量生成 count 场草稿（count 走 query）
export function generateSeries(documentId, count) {
  return post(`${ADMIN}/series/${documentId}/generate?count=${count}`)
}

// 活动日历聚合（按月，管理端全状态；返回原始体 { data: { days: [{ date, activities }] } }）
export function getAdminActivityCalendar(month) {
  return get(`${ADMIN}/activities/calendar?month=${month}`)
}

// 裂变榜（分享奖励排行；start/end 时间范围可筛）
export function getShareLeaderboard(params = {}) {
  return get(`${ADMIN}/activity-share/leaderboard`, params)
}

// 评价看板（返回 { rows, summary, pagination }；?activityDId= 可筛活动；start/end 过滤未实现）
export function getActivityReviews(params = {}) {
  return get(`${ADMIN}/activity-reviews`, params)
}

// 评价隐藏/恢复（body:{hidden:boolean}；隐藏后 C 端公开列表不再展示）
export function setActivityReviewHidden(signupId, hidden) {
  return put(`${ADMIN}/activity-reviews/${signupId}/hidden`, { hidden })
}

// 活动效果总览（返回原始体 { data: { summary, rows }, meta }；?status=all|draft|signup_open|ongoing|ended）
export function getActivityOverview(params = {}) {
  return get(`${ADMIN}/activity-overview`, params)
}

// ===== 经营对账（活动台账快照）=====
// 对账路由与活动管理同属 /v1/admin/adm 段，LEDGER_ADMIN 即 ADMIN。
const LEDGER_ADMIN = '/zhao-point/v1/admin/adm'

// 台账列表（返回原始体 { data:[...], meta:{ pagination } }；?activityDocumentId=&page=&pageSize=）
export function getLedgers(params = {}) {
  return get(`${LEDGER_ADMIN}/ledgers`, params)
}

// 手动重归档（新增 source=manual 快照）
export function regenerateLedger(activityDocumentId) {
  return post(`${LEDGER_ADMIN}/activities/${activityDocumentId}/ledger`)
}

// 标记台账快照已结算/回退未结（body:{settleStatus:'settled'|'pending'}）
export function settleLedger(ledgerDocumentId, settleStatus) {
  return put(`${LEDGER_ADMIN}/ledgers/${ledgerDocumentId}/settle`, { settleStatus })
}

// ===== 活动宣传页客服留言 =====
// 列表（?activity=活动documentId&status=open|replied&page=&pageSize=），返回 { list, pagination }
export function listActivityMessages(params = {}) {
  return get(`${ADMIN}/activity-messages`, params).then(extractList)
}
// 回复（body:{reply}）
export function replyActivityMessage(messageDocumentId, reply) {
  return put(`${ADMIN}/activity-messages/${messageDocumentId}/reply`, { reply })
}