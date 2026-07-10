import { get, post, put, del } from '../utils/request.js'
import { extractItem, extractList } from '../utils/format.js'

// 管理端配置路由（走 content-api 前缀 /api/zhao-common/v1/admin）
const ADMIN_CONFIG = '/zhao-common/v1/admin/config'

// 站点配置
export function getSiteConfig() {
  return get(`${ADMIN_CONFIG}/site`).then(extractItem)
}
export function updateSiteConfig(data) {
  return put(`${ADMIN_CONFIG}/site`, { data }).then(extractItem)
}

// 三方配置
export function getThirdPartyConfigs() {
  return get(`${ADMIN_CONFIG}/third`).then(extractList)
}
export function getThirdPartyConfig(id) {
  return get(`${ADMIN_CONFIG}/third/${id}`).then(extractItem)
}
export function createThirdPartyConfig(data) {
  return post(`${ADMIN_CONFIG}/third`, { data }).then(extractItem)
}
export function updateThirdPartyConfig(id, data) {
  return put(`${ADMIN_CONFIG}/third/${id}`, { data }).then(extractItem)
}
export function deleteThirdPartyConfig(id) {
  return del(`${ADMIN_CONFIG}/third/${id}`).then(extractItem)
}

// 积分配置
export function getPointsConfig() {
  return get(`${ADMIN_CONFIG}/points`).then(extractItem)
}
export function updatePointsConfig(data) {
  return put(`${ADMIN_CONFIG}/points`, { data }).then(extractItem)
}

// OSS配置
export function getOssConfig() {
  return get(`${ADMIN_CONFIG}/oss`).then(extractItem)
}
export function updateOssConfig(data) {
  return put(`${ADMIN_CONFIG}/oss`, { data }).then(extractItem)
}

// 公开配置（无需认证，走content-api）
export function getPublicConfig(params = {}) {
  return get('/zhao-common/v1/public/config', params).then(extractItem)
}
