import request, { get, post, put, del } from '../utils/request.js'
import { extractList, extractItem } from '../utils/format.js'

const V1 = '/zhao-channel/v1'
const MY = `${V1}/my`
const ADMIN = `${V1}/admin`

// ==================== 管理端接口 ====================

export function getAdminChannelList(params = {}) {
  return get(`${ADMIN}/channels`, params).then(extractList)
}

export function getAdminChannelDetail(id) {
  return get(`${ADMIN}/channels/${id}`).then(res => {
    const item = extractItem(res)
    return item
  })
}

export function createChannel(data) {
  return post(`${ADMIN}/channels`, data).then(extractItem)
}

export function updateChannel(id, data) {
  return put(`${ADMIN}/channels/${id}`, data).then(extractItem)
}

export function deleteChannel(id) {
  return del(`${ADMIN}/channels/${id}`).then(extractItem)
}

export function getChannelChildren(id) {
  return get(`${ADMIN}/channels/${id}/children`).then(extractItem)
}

export function getChannelHierarchy(id) {
  return get(`${ADMIN}/channels/${id}/hierarchy`).then(extractItem)
}

export function getTierTree(parentTier) {
  return get(`${ADMIN}/channels/tier-tree/${parentTier}`).then(extractItem)
}

// 渠道统计
export function getAdminChannelStats(id) {
  return get(`${ADMIN}/channels/${id}`).then(res => extractItem(res))
}

// 渠道成员管理
export function getChannelMembers(params = {}) {
  return get(`${ADMIN}/channel-members`, params).then(extractList)
}

export function getChannelMemberDetail(id) {
  return get(`${ADMIN}/channel-members/${id}`).then(extractItem)
}

export function addChannelMember(data) {
  return post(`${ADMIN}/channel-members`, data).then(extractItem)
}

export function updateChannelMember(id, data) {
  return put(`${ADMIN}/channel-members/${id}`, data).then(extractItem)
}

export function removeChannelMember(id) {
  return del(`${ADMIN}/channel-members/${id}`).then(extractItem)
}

// 渠道权限管理
export function checkChannelPermission(data) {
  return post(`${ADMIN}/channel-permissions/check`, data).then(extractItem)
}

export function getUserChannels(userId) {
  return get(`${ADMIN}/channel-permissions/user/${userId}`).then(extractItem)
}

export function batchGrantChannels(data) {
  return post(`${ADMIN}/channel-permissions/batch-grant`, data).then(extractItem)
}

// 用户渠道关联管理（user-channels）
export function getUserChannelList(params = {}) {
  return get(`${ADMIN}/user-channels`, params).then(extractList)
}

export function getUserChannelDetail(id) {
  return get(`${ADMIN}/user-channels/${id}`).then(extractItem)
}

export function assignUserChannel(data) {
  return post(`${ADMIN}/user-channels`, data).then(extractItem)
}

export function revokeUserChannel(id) {
  return del(`${ADMIN}/user-channels/${id}`).then(extractItem)
}

// 邀请码管理
export function getInviteList(params = {}) {
  return get(`${ADMIN}/user-invites`, params).then(extractList)
}

export function getInviteDetail(id) {
  return get(`${ADMIN}/user-invites/${id}`).then(extractItem)
}

export function createInvite(data) {
  return post(`${ADMIN}/user-invites`, data).then(extractItem)
}

export function useInvite(data) {
  return post(`${ADMIN}/user-invites/use`, data).then(extractItem)
}

export function updateInvite(id, data) {
  return put(`${ADMIN}/user-invites/${id}`, data).then(extractItem)
}

export function deleteInvite(id) {
  return del(`${ADMIN}/user-invites/${id}`).then(extractItem)
}

// 渠道仪表盘
export function getChannelDashboard() {
  return get(`${ADMIN}/dashboard`).then(extractItem)
}

// ==================== 用户端接口 ====================

export function getChannelList(params = {}) {
  return get(`${MY}/channels`, params).then(extractList)
}

export function getChannelDetail(id) {
  return get(`${V1}/channel/${id}`).then(extractItem)
}

export function getRootChannels(params = {}) {
  return get(`${MY}/channels`, params).then(extractList)
}

export function registerChannel(data) {
  return post(`${MY}/channel/register`, data).then(extractItem)
}

export function validateChannel(data) {
  return post(`${MY}/channel/validate`, data).then(extractItem)
}

export function verifyInvitationCode(code) {
  return post(`${V1}/channel/validate/public`, { code }).then(extractItem)
}

export function getMyAccessibleChannels() {
  return get(`${MY}/channels/accessible`).then(extractItem)
}

export function getMySubChannels() {
  return get(`${MY}/channels/accessible`).then(extractList)
}

export function inviteSubChannel(data) {
  return post(`${MY}/channel/register`, data).then(extractItem)
}

export function getChannelNetwork(id) {
  return get(`${V1}/channel/${id}/network`).then(extractItem)
}

export function getChannelStats(id) {
  return get(`${V1}/channel/${id}/stats`).then(extractItem)
}

export function getPublicChannel(id) {
  return get(`${V1}/channel/public/${id}`).then(extractItem)
}

export function validatePublicChannel(data) {
  return post(`${V1}/channel/validate/public`, data).then(extractItem)
}

export function registerPublicChannel(data) {
  return post(`${V1}/channel/register/public`, data).then(extractItem)
}

export function getInviteChain(userId) {
  return get(`${MY}/invite/chain`, { userId }).then(extractList)
}

export function getInviteDownstream(userId) {
  return get(`${MY}/invite/downstream`, { userId }).then(extractList)
}

export function getInviteStats(userId) {
  return get(`${MY}/invite/stats`, { userId }).then(extractItem)
}

// 通过渠道邀请码加入渠道
export function joinChannelByInvite(inviteCode) {
  return post(`${V1}/channel-invite/join`, { inviteCode }).then(extractItem)
}
