import { get, post, put, del } from '../utils/request.js'
import { extractList, extractItem } from '../utils/format.js'

const V1 = '/zhao-tag/v1'
const ADMIN = `${V1}/admin`

// ==================== 标签管理 ====================

export function getTagList(params = {}) {
  return get(`${ADMIN}/tags`, params).then(extractList)
}

export function getTagListBySite(siteId, params = {}) {
  return get(`${ADMIN}/tags`, { ...params, siteId }).then(extractList)
}

export function getPublicTagListAdmin(params = {}) {
  return get(`${ADMIN}/tags`, { ...params, isPublic: true }).then(extractList)
}

export function getTagGroupListBySite(siteId, params = {}) {
  return get(`${ADMIN}/tag-groups`, { ...params, siteId }).then(extractList)
}

export function getTagDetail(documentId) {
  return get(`${ADMIN}/tags/${documentId}`).then(extractItem)
}

export function createTag(data) {
  return post(`${ADMIN}/tags`, { data }).then(extractItem)
}

export function updateTag(documentId, data) {
  return put(`${ADMIN}/tags/${documentId}`, { data }).then(extractItem)
}

export function deleteTag(documentId) {
  return del(`${ADMIN}/tags/${documentId}`).then(extractItem)
}

// ==================== 标签分组管理 ====================

export function getTagGroupList(params = {}) {
  return get(`${ADMIN}/tag-groups`, params).then(extractList)
}

export function getTagGroupDetail(documentId) {
  return get(`${ADMIN}/tag-groups/${documentId}`).then(extractItem)
}

export function createTagGroup(data) {
  return post(`${ADMIN}/tag-groups`, { data }).then(extractItem)
}

export function updateTagGroup(documentId, data) {
  return put(`${ADMIN}/tag-groups/${documentId}`, { data }).then(extractItem)
}

export function deleteTagGroup(documentId) {
  return del(`${ADMIN}/tag-groups/${documentId}`).then(extractItem)
}

// ==================== 分类预设管理 ====================

export function getCategoryPresetList(params = {}) {
  return get(`${ADMIN}/category-presets`, params).then(extractList)
}

export function getCategoryPresetDetail(documentId) {
  return get(`${ADMIN}/category-presets/${documentId}`).then(extractItem)
}

export function createCategoryPreset(data) {
  return post(`${ADMIN}/category-presets`, { data }).then(extractItem)
}

export function updateCategoryPreset(documentId, data) {
  return put(`${ADMIN}/category-presets/${documentId}`, { data }).then(extractItem)
}

export function deleteCategoryPreset(documentId) {
  return del(`${ADMIN}/category-presets/${documentId}`).then(extractItem)
}

// ==================== 公开接口 ====================

export function getPublicTagList(params = {}) {
  return get(`${V1}/tags`, params).then(extractList)
}

export function getPublicTagDetail(documentId) {
  return get(`${V1}/tags/${documentId}`).then(extractItem)
}

export function getPublicTagGroupList(params = {}) {
  return get(`${V1}/tag-groups`, params).then(extractList)
}

// 全局检索：按标签查所有关联内容
export function searchByTag(tagId, targetType) {
  const params = targetType ? { targetType } : {}
  return get(`${V1}/search`, { tagId, ...params }).then(extractItem)
}

// 按分类推荐标签
export function suggestByCategory(categoryName, categoryType) {
  return get(`${V1}/suggest`, { categoryName, categoryType }).then(extractItem)
}

