import { get, post, put, del } from '../utils/request.js'
import { extractList, extractItem } from '../utils/format.js'

const ADMIN = '/zhao-sso/v1/admin'

// ==================== SSO 仪表盘 ====================

export function getSsoDashboard() {
  return get(`${ADMIN}/dashboard`).then(extractItem)
}

export function getChannelReport() {
  return get(`${ADMIN}/channel-report`).then(extractItem)
}

// ==================== SSO 用户管理 ====================

export function getSsoUserList(params = {}) {
  return get(`${ADMIN}/users`, params).then(extractList)
}

export function getSsoUserDetail(id) {
  return get(`${ADMIN}/users/${id}`).then(extractItem)
}

export function updateSsoUser(id, data) {
  return put(`${ADMIN}/users/${id}`, { data }).then(extractItem)
}

// ==================== SSO 应用管理 ====================

export function getSsoAppList(params = {}) {
  return get(`${ADMIN}/apps`, params).then(extractList)
}

export function createSsoApp(data) {
  return post(`${ADMIN}/apps`, { data }).then(extractItem)
}

export function updateSsoApp(id, data) {
  return put(`${ADMIN}/apps/${id}`, { data }).then(extractItem)
}

// ==================== SSO 渠道同步管理 ====================

export function getSsoChannelList(params = {}) {
  return get(`${ADMIN}/channels`, params).then(extractList)
}

export function createSsoChannel(data) {
  return post(`${ADMIN}/channels`, { data }).then(extractItem)
}

export function updateSsoChannel(id, data) {
  return put(`${ADMIN}/channels/${id}`, { data }).then(extractItem)
}

// ==================== SSO 登录日志 ====================

export function getSsoLoginLogs(params = {}) {
  return get(`${ADMIN}/login-logs`, params).then(extractList)
}
