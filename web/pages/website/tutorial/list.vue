<template>
  <view class="page-container">
    <PageHeader title="教程指南">
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('tutorial.create')">+ 新增教程</button>
    </PageHeader>

    <view class="search-section">
      <view class="search-box">
        <input type="text" v-model="searchKeyword" placeholder="搜索教程标题" @confirm="loadData(1)" class="search-input" />
        <text class="search-icon">🔍</text>
      </view>
      <view class="filter-row">
        <picker mode="selector" :range="statusOptions" @change="handleStatusChange">
          <view class="filter-item"><text>{{ statusOptions[statusIndex] }}</text><text class="arrow">▼</text></view>
        </picker>
        <picker mode="selector" :range="tagGroupOptions" @change="handleTagGroupChange">
          <view class="filter-item"><text>{{ tagGroupOptions[tagGroupIndex] }}</text><text class="arrow">▼</text></view>
        </picker>
      </view>
    </view>

    <view class="item-list">
      <view v-for="item in itemList" :key="item.documentId" class="item-card" @click="goEdit(item.documentId)">
        <view class="item-info">
          <view class="item-title">{{ item.title }}</view>
          <view class="item-meta">
            <text class="meta-item" v-if="item.difficulty">📊 {{ getDifficultyText(item.difficulty) }}</text>
            <text class="meta-item" v-if="item.estimatedTime">⏱️ {{ item.estimatedTime }}</text>
          </view>
          <view class="item-footer">
            <view class="item-status" :class="item.status">{{ getStatusText(item.status) }}</view>
            <view class="item-date">{{ formatDate(item.publishedAt || item.createdAt) }}</view>
          </view>
        </view>
        <view class="item-actions">
          <view v-if="item.status === 'draft' && hasPermission('tutorial.publish')" class="action-btn publish" @click.stop="handlePublish(item)">发布</view>
          <view v-if="item.status === 'published' && hasPermission('tutorial.publish')" class="action-btn unpublish" @click.stop="handleArchive(item)">下架</view>
          <view v-if="hasPermission('tutorial.update')" class="action-btn edit" @click.stop="goEdit(item.documentId)">编辑</view>
          <view v-if="hasPermission('tutorial.update')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>
    <view v-if="!loading && itemList.length === 0" class="empty-state">
      <text class="empty-icon">📚</text>
      <text class="empty-text">暂无教程</text>
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('tutorial.create')">立即添加</button>
    </view>

    <view class="pagination" v-if="pagination.total > pagination.pageSize">
      <view class="pagination-btn" @click="prevPage" :class="{ disabled: currentPage === 1 }">上一页</view>
      <text class="pagination-info">{{ currentPage }} / {{ totalPages }}</text>
      <view class="pagination-btn" @click="nextPage" :class="{ disabled: currentPage >= totalPages }">下一页</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { tutorialApi } from '../../../src/api/website.js'
import { getTagGroupList } from '../../../src/api/tag.js'
import { useUserStore } from '../../../src/store/user.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const searchKeyword = ref('')
const statusIndex = ref(0)
const statusOptions = ['全部状态', '草稿', '已发布', '已下架']
const statusReverseMap = { 1: 'draft', 2: 'published', 3: 'archived' }
const statusMap = { draft: '草稿', published: '已发布', archived: '已下架' }
const difficultyMap = { beginner: '入门', intermediate: '进阶', advanced: '高级' }

const tagGroupList = ref([])
const tagGroupIndex = ref(0)
const tagGroupOptions = computed(() => ['全部分组', ...tagGroupList.value.map(g => g.name)])

const itemList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)
const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

function getStatusText(status) { return statusMap[status] || status }
function getDifficultyText(d) { return difficultyMap[d] || d }

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = { 'pagination[page]': page, 'pagination[pageSize]': 10 }
    if (searchKeyword.value) params['filters[title][$contains]'] = searchKeyword.value
    if (statusIndex.value > 0) params['filters[status]'] = statusReverseMap[statusIndex.value]
    if (tagGroupIndex.value > 0) {
      const group = tagGroupList.value[tagGroupIndex.value - 1]
      if (group?.slug) params.tagGroup = group.slug
    }
    const { list, pagination: pg } = await tutorialApi.list(params)
    itemList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
  finally { loading.value = false }
}

function handleStatusChange(e) { statusIndex.value = e.detail.value; loadData(1) }
function handleTagGroupChange(e) { tagGroupIndex.value = e.detail.value; loadData(1) }

async function loadTagGroups() {
  try {
    const { list } = await getTagGroupList({ pageSize: 100 })
    tagGroupList.value = list
  } catch (e) { /* ignore */ }
}

function goCreate() { uni.navigateTo({ url: '/pages/website/tutorial/edit' }) }
function goEdit(id) { uni.navigateTo({ url: `/pages/website/tutorial/edit?documentId=${id}` }) }

async function handleDelete(item) {
  uni.showModal({ title: '确认删除', content: `确定要删除教程「${item.title}」吗？`, success: async (res) => {
    if (res.confirm) { try { await tutorialApi.delete(item.documentId); uni.showToast({ title: '删除成功', icon: 'success' }); loadData(currentPage.value) } catch (e) { uni.showToast({ title: '删除失败', icon: 'none' }) } }
  }})
}
async function handlePublish(item) {
  uni.showModal({ title: '确认发布', content: `确定要发布教程「${item.title}」吗？`, success: async (res) => {
    if (res.confirm) { try { await tutorialApi.publish(item.documentId); uni.showToast({ title: '发布成功', icon: 'success' }); loadData(currentPage.value) } catch (e) { uni.showToast({ title: '发布失败', icon: 'none' }) } }
  }})
}
async function handleArchive(item) {
  uni.showModal({ title: '确认下架', content: `确定要下架教程「${item.title}」吗？`, success: async (res) => {
    if (res.confirm) { try { await tutorialApi.archive(item.documentId); uni.showToast({ title: '已下架', icon: 'success' }); loadData(currentPage.value) } catch (e) { uni.showToast({ title: '下架失败', icon: 'none' }) } }
  }})
}

function prevPage() { if (currentPage.value > 1) loadData(currentPage.value - 1) }
function nextPage() { if (currentPage.value < totalPages.value) loadData(currentPage.value + 1) }
onShow(() => {
  loadTagGroups()
  loadData(1)
})
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx; box-sizing: border-box; }
.btn-primary { background: #ff0000; color: #ffffff; padding: 16rpx 32rpx; font-size: 30rpx; border-radius: 8rpx; border: none; line-height: 1.2; }
.search-section { background: #fff; padding: 20rpx; border-radius: 12rpx; margin-bottom: 20rpx; }
.search-box { display: flex; align-items: center; background: #f5f5f5; border-radius: 8rpx; padding: 0 20rpx; margin-bottom: 20rpx; }
.search-input { flex: 1; height: 72rpx; font-size: 28rpx; }
.search-icon { font-size: 32rpx; }
.filter-row { display: flex; gap: 20rpx; align-items: center; }
.filter-item { display: flex; align-items: center; gap: 8rpx; padding: 12rpx 24rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 26rpx; }
.arrow { font-size: 20rpx; color: #999; }
.item-list { display: flex; flex-direction: column; gap: 20rpx; }
.item-card { background: #fff; border-radius: 12rpx; padding: 24rpx; display: flex; align-items: center; }
.item-info { flex: 1; display: flex; flex-direction: column; }
.item-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.item-meta { flex: 1; }
.meta-item { font-size: 24rpx; color: #999; margin-right: 16rpx; }
.item-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.item-status { padding: 4rpx 16rpx; border-radius: 4rpx; font-size: 22rpx; color: #fff; }
.item-status.draft { background: #999; } .item-status.published { background: #07c160; } .item-status.archived { background: #666; }
.item-date { font-size: 22rpx; color: #999; }
.item-actions { display: flex; flex-direction: column; gap: 12rpx; }
.action-btn { padding: 12rpx 24rpx; border-radius: 8rpx; font-size: 24rpx; text-align: center; }
.action-btn.edit { background: #f5f5f5; color: #1989fa; } .action-btn.delete { background: #fff0f0; color: #ff4d4f; }
.action-btn.publish { background: #e8f5e9; color: #07c160; } .action-btn.unpublish { background: #fff3e0; color: #faad14; }
.loading, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; } .empty-text { font-size: 28rpx; color: #999; margin-bottom: 20rpx; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 40rpx; padding: 40rpx 0; }
.pagination-btn { padding: 16rpx 32rpx; background: #fff; border-radius: 8rpx; font-size: 28rpx; }
.pagination-btn.disabled { color: #999; background: #f5f5f5; } .pagination-info { font-size: 28rpx; color: #666; }
</style>
