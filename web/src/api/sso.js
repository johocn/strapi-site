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

// ==================== SSO Token 管理 ====================

export const ssoTokenApi = {
  list: (params = {}) => get(`${ADMIN}/tokens`, params).then(extractList),
  detail: (id) => get(`${ADMIN}/tokens/${id}`).then(extractItem),
  delete: (id) => del(`${ADMIN}/tokens/${id}`).then(extractItem),
}

// ==================== SSO 授权码管理 ====================

export const ssoAuthCodeApi = {
  list: (params = {}) => get(`${ADMIN}/auth-codes`, params).then(extractList),
  detail: (id) => get(`${ADMIN}/auth-codes/${id}`).then(extractItem),
  delete: (id) => del(`${ADMIN}/auth-codes/${id}`).then(extractItem),
}

// ==================== SSO 三方绑定 ====================

export const ssoBindingApi = {
  list: (params = {}) => get(`${ADMIN}/bindings`, params).then(extractList),
  detail: (id) => get(`${ADMIN}/bindings/${id}`).then(extractItem),
  create: (data) => post(`${ADMIN}/bindings`, { data }).then(extractItem),
  update: (id, data) => put(`${ADMIN}/bindings/${id}`, { data }).then(extractItem),
  delete: (id) => del(`${ADMIN}/bindings/${id}`).then(extractItem),
}

// ==================== SSO OAuth 配置 ====================

export const ssoOauthConfigApi = {
  list: (params = {}) => get(`${ADMIN}/oauth-configs`, params).then(extractList),
  detail: (id) => get(`${ADMIN}/oauth-configs/${id}`).then(extractItem),
  create: (data) => post(`${ADMIN}/oauth-configs`, { data }).then(extractItem),
  update: (id, data) => put(`${ADMIN}/oauth-configs/${id}`, { data }).then(extractItem),
  delete: (id) => del(`${ADMIN}/oauth-configs/${id}`).then(extractItem),
}

// ==================== SSO 用户应用角色 ====================

export const ssoUserRoleApi = {
  list: (params = {}) => get(`${ADMIN}/user-app-roles`, params).then(extractList),
  detail: (id) => get(`${ADMIN}/user-app-roles/${id}`).then(extractItem),
  create: (data) => post(`${ADMIN}/user-app-roles`, { data }).then(extractItem),
  update: (id, data) => put(`${ADMIN}/user-app-roles/${id}`, { data }).then(extractItem),
  delete: (id) => del(`${ADMIN}/user-app-roles/${id}`).then(extractItem),
}

// ==================== SSO 邀请码 ====================

export const ssoInviteCodeApi = {
  list: (params = {}) => get(`${ADMIN}/invite-codes`, params).then(extractList),
  create: (data) => post(`${ADMIN}/invite-codes`, { data }).then(extractItem),
  delete: (id) => del(`${ADMIN}/invite-codes/${id}`).then(extractItem),
  validate: (id) => post(`${ADMIN}/invite-codes/${id}/validate`).then(extractItem),
}

// ==================== SSO 邀请记录 ====================

export const ssoInviteUsageApi = {
  list: (params = {}) => get(`${ADMIN}/invite-usages`, params).then(extractList),
  delete: (id) => del(`${ADMIN}/invite-usages/${id}`).then(extractItem),
}

// ==================== SSO 推荐关系 ====================

export const ssoReferralApi = {
  list: (params = {}) => get(`${ADMIN}/referral-relations`, params).then(extractList),
  delete: (id) => del(`${ADMIN}/referral-relations/${id}`).then(extractItem),
}

// ==================== SSO 短信验证码 ====================

export const ssoSmsCodeApi = {
  list: (params = {}) => get(`${ADMIN}/sms-codes`, params).then(extractList),
  delete: (id) => del(`${ADMIN}/sms-codes/${id}`).then(extractItem),
}
