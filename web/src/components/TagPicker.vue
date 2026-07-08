<template>
  <view v-if="visible" class="tag-picker-overlay" @click="handleClose">
    <view class="tag-picker" @click.stop>
      <view class="picker-header">
        <text class="picker-title">选择标签</text>
        <text class="btn-close" @click="handleClose">×</text>
      </view>

      <view class="picker-body">
        <!-- 左侧：分组 -->
        <view class="group-sidebar">
          <view class="group-search">
            <input
              v-model="groupKeyword"
              class="group-search-input"
              placeholder="搜索分组"
            />
          </view>
          <scroll-view scroll-y class="group-list">
            <view
              class="group-item"
              :class="{ active: selectedGroupId === null }"
              @click="selectGroup(null, null)"
            >
              <text>全部</text>
            </view>
            <view
              v-for="g in filteredGroups"
              :key="g.documentId"
              class="group-item"
              :class="{ active: selectedGroupId === g.documentId }"
              @click="selectGroup(g.documentId, g)"
            >
              <text class="group-name">{{ g.name }}</text>
            </view>
            <view class="group-item add-group" @click="handleAddGroup">
              <text>+ 新建分组</text>
            </view>
          </scroll-view>
        </view>

        <!-- 右侧：标签列表 -->
        <view class="tag-area">
          <view class="tag-toolbar">
            <input
              v-model="tagKeyword"
              class="tag-search-input"
              placeholder="搜索标签"
              @input="onTagSearchInput"
            />
            <button class="btn-add-tag" @click="handleAddTag">+ 添加</button>
          </view>
          <scroll-view scroll-y class="tag-list" @scrolltolower="loadMoreTags">
            <view
              v-for="tag in tagList"
              :key="tag.documentId"
              class="tag-item"
              :class="{ selected: isTagSelected(tag) }"
              @click="toggleTag(tag)"
            >
              <text class="tag-name">{{ tag.name }}</text>
              <text v-if="tag.tagGroup?.name" class="tag-group-label">{{ tag.tagGroup.name }}</text>
              <text v-if="tag.isPublic" class="tag-badge public">公共</text>
              <text v-else class="tag-badge site">站点</text>
              <text v-if="isTagSelected(tag)" class="tag-check">✓</text>
            </view>
            <view v-if="loadingTags" class="loading-text">
              <text>加载中...</text>
            </view>
            <view v-if="!loadingTags && tagList.length === 0" class="empty-text">
              <text>暂无标签</text>
            </view>
          </scroll-view>
        </view>
      </view>

      <view class="picker-footer">
        <view class="selected-tags">
          <text class="selected-label">已选：</text>
          <view v-for="tag in internalSelected" :key="tag.documentId" class="selected-tag">
            <text>{{ tag.name }}</text>
            <text class="selected-remove" @click="toggleTag(tag)">×</text>
          </view>
          <text v-if="internalSelected.length === 0" class="selected-empty">未选择</text>
        </view>
        <button class="btn-confirm" @click="handleConfirm">确认</button>
      </view>

      <!-- 自定义确认弹窗 -->
      <view v-if="confirmVisible" class="confirm-overlay" @click.stop>
        <view class="confirm-dialog">
          <text class="confirm-msg">{{ confirmMessage }}</text>
          <view class="confirm-btns">
            <button class="confirm-btn cancel" @click="onConfirmCancel">取消</button>
            <button class="confirm-btn ok" @click="onConfirmOk">确定</button>
          </view>
        </view>
      </view>

      <!-- 新建分组弹窗 -->
      <view v-if="addGroupVisible" class="confirm-overlay" @click.stop>
        <view class="confirm-dialog">
          <text class="confirm-msg">新建分组</text>
          <input
            v-model="newGroupName"
            class="add-group-input"
            placeholder="请输入分组名称"
            @confirm="confirmAddGroup"
          />
          <view class="confirm-btns">
            <button class="confirm-btn cancel" @click="addGroupVisible = false">取消</button>
            <button class="confirm-btn ok" @click="confirmAddGroup">创建</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { getTagList, getTagGroupList, getTagGroupListBySite, createTag, createTagGroup } from '../api/tag.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  selected: { type: Array, default: () => [] },
  defaultGroupId: { type: String, default: null }, // 默认选中的分组
  defaultGroupName: { type: String, default: null }, // 默认分组名称（用于自动创建）
  mode: { type: String, default: 'all' }, // 'tag' | 'knowledge-point' | 'all'
  siteId: { type: String, default: null },
})

const emit = defineEmits(['select', 'update:visible'])

const groupList = ref([])
const groupKeyword = ref('')
const selectedGroupId = ref(null)
const selectedGroup = ref(null)

const tagList = ref([])
const tagKeyword = ref('')
const tagPagination = ref({ page: 1, pageSize: 20, total: 0, pageCount: 0 })
const loadingTags = ref(false)

const internalSelected = ref([])

const confirmVisible = ref(false)
const confirmMessage = ref('')
let confirmResolve = null

const addGroupVisible = ref(false)
const newGroupName = ref('')

function showConfirm(msg) {
  return new Promise(resolve => {
    confirmMessage.value = msg
    confirmVisible.value = true
    confirmResolve = resolve
  })
}

function onConfirmOk() {
  confirmVisible.value = false
  if (confirmResolve) confirmResolve(true)
  confirmResolve = null
}

function onConfirmCancel() {
  confirmVisible.value = false
  if (confirmResolve) confirmResolve(false)
  confirmResolve = null
}

function handleAddGroup() {
  newGroupName.value = ''
  addGroupVisible.value = true
}

async function confirmAddGroup() {
  const name = newGroupName.value.trim()
  if (!name) {
    uni.showToast({ title: '请输入分组名称', icon: 'none' })
    return
  }
  try {
    const group = await createTagGroup({ name })
    addGroupVisible.value = false
    await loadGroups()
    if (group?.documentId) {
      selectGroup(group.documentId, group)
    }
    uni.showToast({ title: '创建成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '创建失败', icon: 'none' })
  }
}

const filteredGroups = computed(() => {
  if (!groupKeyword.value) return groupList.value
  const kw = groupKeyword.value.toLowerCase()
  return groupList.value.filter(g => g.name.toLowerCase().includes(kw))
})

watch(() => props.visible, async (val) => {
  if (val) {
    internalSelected.value = [...props.selected]
    await loadGroups()
    // 如果有默认分组名且不存在，则创建
    if (props.defaultGroupName && !groupList.value.find(g => g.name === props.defaultGroupName)) {
      try {
        const newGroup = await createTagGroup({ name: props.defaultGroupName })
        if (newGroup?.documentId) {
          await loadGroups()
          props.defaultGroupId = newGroup.documentId
        }
      } catch (e) {
        console.error('创建默认分组失败:', e)
      }
    }
    // 设置默认分组
    if (props.defaultGroupId) {
      const group = groupList.value.find(g => g.documentId === props.defaultGroupId)
      if (group) {
        selectGroup(props.defaultGroupId, group)
        return
      }
    }
    // 如果有默认分组名称，尝试匹配
    if (props.defaultGroupName) {
      const group = groupList.value.find(g => g.name === props.defaultGroupName)
      if (group) {
        selectGroup(group.documentId, group)
        return
      }
    }
    resetAndLoadTags()
  }
})

async function loadGroups() {
  try {
    const result = props.siteId
      ? await getTagGroupListBySite(props.siteId, { pageSize: 200 })
      : await getTagGroupList({ pageSize: 200 })
    // 按 mode 过滤分组
    let groups = result.list || []
    if (props.mode === 'tag') {
      groups = groups.filter(g => g.slug !== 'knowledge-point')
    } else if (props.mode === 'knowledge-point') {
      groups = groups.filter(g => g.slug === 'knowledge-point')
    }
    groupList.value = groups
  } catch (e) {
    /* ignore */
  }
}

function selectGroup(documentId, group) {
  selectedGroupId.value = documentId
  selectedGroup.value = group
  resetAndLoadTags()
}

function resetAndLoadTags() {
  tagPagination.value.page = 1
  tagList.value = []
  loadTags()
}

let searchTimer = null
function onTagSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    resetAndLoadTags()
  }, 300)
}

async function loadTags(append = false) {
  loadingTags.value = true
  try {
    const params = {
      page: tagPagination.value.page,
      pageSize: tagPagination.value.pageSize,
    }
    if (props.siteId) {
      params.siteId = props.siteId
    }
    if (selectedGroupId.value) {
      params['filters[tagGroup][documentId][$eq]'] = selectedGroupId.value
    } else if (tagKeyword.value) {
      // 搜索全部标签时不过滤分组
    }
    if (tagKeyword.value) {
      params['filters[name][$containsi]'] = tagKeyword.value
    }
    const result = await getTagList(params)
    if (append) {
      tagList.value.push(...(result.list || []))
    } else {
      tagList.value = result.list || []
    }
    tagPagination.value = result.pagination || {}
  } catch (e) {
    /* ignore */
  } finally {
    loadingTags.value = false
  }
}

function loadMoreTags() {
  if (tagPagination.value.page < tagPagination.value.pageCount) {
    tagPagination.value.page++
    loadTags(true)
  }
}

function isTagSelected(tag) {
  return internalSelected.value.some(t => t.documentId === tag.documentId)
}

function toggleTag(tag) {
  const idx = internalSelected.value.findIndex(t => t.documentId === tag.documentId)
  if (idx > -1) {
    internalSelected.value.splice(idx, 1)
  } else {
    internalSelected.value.push(tag)
  }
}

async function handleAddTag() {
  const name = tagKeyword.value.trim()
  if (!name) {
    uni.showToast({ title: '请输入标签名称', icon: 'none' })
    return
  }

  // 检查是否已存在同名标签
  const existing = tagList.value.find(t => t.name === name)
  if (existing) {
    uni.showToast({ title: '标签已存在', icon: 'none' })
    if (!isTagSelected(existing)) toggleTag(existing)
    return
  }

  // 未选择分组时提示
  if (!selectedGroupId.value) {
    const confirmed = await showConfirm('未选择分组信息，标签将加入到"未定义"分组中，是否继续？')
    if (!confirmed) return
  }

  try {
    const data = { name }
    if (selectedGroupId.value) {
      data.tagGroup = { documentId: selectedGroupId.value }
    }
    const newTag = await createTag(data)
    if (newTag) {
      uni.showToast({ title: '添加成功', icon: 'success' })
      tagKeyword.value = ''
      resetAndLoadTags()
      if (!isTagSelected(newTag)) {
        internalSelected.value.push(newTag)
      }
    }
  } catch (e) {
    uni.showToast({ title: '添加失败', icon: 'none' })
  }
}

function handleConfirm() {
  emit('select', [...internalSelected.value])
  handleClose()
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<style scoped>
.tag-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-picker {
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  background: #fff;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #eee;
}

.picker-title {
  font-size: 32rpx;
  font-weight: bold;
}

.btn-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

.picker-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 左侧分组 */
.group-sidebar {
  width: 220rpx;
  border-right: 1rpx solid #eee;
  display: flex;
  flex-direction: column;
}

.group-search {
  padding: 12rpx;
  border-bottom: 1rpx solid #eee;
}

.group-search-input {
  width: 100%;
  height: 56rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 12rpx;
  font-size: 24rpx;
  box-sizing: border-box;
}

.group-list {
  flex: 1;
  padding: 8rpx;
  overflow-y: auto;
}

.group-item {
  padding: 14rpx 12rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333;
  margin-bottom: 4rpx;
}

.group-item.active {
  background: #667eea;
  color: #fff;
}

.group-item.add-group {
  color: #667eea;
  border: 1rpx dashed #667eea;
  text-align: center;
  margin-top: 8rpx;
}

.group-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧标签 */
.tag-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tag-toolbar {
  display: flex;
  gap: 12rpx;
  padding: 12rpx 16rpx;
  border-bottom: 1rpx solid #eee;
  align-items: center;
}

.tag-search-input {
  flex: 1;
  height: 56rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 12rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}

.btn-add-tag {
  background: #667eea;
  color: #fff;
  border: none;
  padding: 0 20rpx;
  height: 56rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  white-space: nowrap;
  line-height: 56rpx;
}

.tag-list {
  flex: 1;
  padding: 12rpx 16rpx;
  max-height: 400px;
  overflow-y: auto;
}

.tag-item {
  display: flex;
  align-items: center;
  padding: 16rpx 12rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  gap: 12rpx;
}

.tag-item.selected {
  background: #e3f2fd;
}

.tag-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-group-label {
  font-size: 22rpx;
  color: #999;
  background: #f5f5f5;
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
}

.tag-check {
  color: #667eea;
  font-weight: bold;
}

.loading-text, .empty-text {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 26rpx;
}

/* 底部 */
.picker-footer {
  border-top: 1rpx solid #eee;
  padding: 16rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.selected-tags {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  align-items: center;
}

.selected-label {
  font-size: 26rpx;
  color: #666;
  flex-shrink: 0;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 4rpx 12rpx;
  background: #e3f2fd;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: #1989fa;
}

.selected-remove {
  font-size: 24rpx;
  color: #999;
  margin-left: 4rpx;
}

.selected-empty {
  font-size: 24rpx;
  color: #ccc;
}

.btn-confirm {
  background: #667eea;
  color: #fff;
  border: none;
  padding: 0 32rpx;
  height: 64rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  white-space: nowrap;
  flex-shrink: 0;
}

.confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.confirm-dialog {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  width: 70%;
  max-width: 500rpx;
}

.confirm-msg {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 32rpx;
  text-align: center;
}

.confirm-btns {
  display: flex;
  gap: 20rpx;
  justify-content: center;
}

.confirm-btn {
  padding: 0 40rpx;
  height: 64rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
}

.confirm-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.confirm-btn.ok {
  background: #667eea;
  color: #fff;
}

.add-group-input {
  width: 100%;
  height: 64rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 16rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  margin-bottom: 24rpx;
}

.tag-badge {
  font-size: 18rpx;
  padding: 1rpx 8rpx;
  border-radius: 4rpx;
}
.tag-badge.public { background: #fff3e0; color: #faad14; }
.tag-badge.site { background: #e8f5e9; color: #07c160; }
</style>
