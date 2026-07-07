<template>
  <view class="page-container">
    <PageHeader title="线索管理" />

    <view class="filter-section">
      <picker mode="selector" :range="statusOptions" @change="handleStatusChange">
        <view class="filter-item">
          <text>{{ statusOptions[statusIndex] }}</text>
          <text class="arrow">▼</text>
        </view>
      </picker>
    </view>

    <view class="lead-list">
      <view v-for="item in leadList" :key="item.documentId" class="lead-card">
        <view class="lead-main">
          <view class="lead-row">
            <text class="lead-name">{{ item.name || '未填写' }}</text>
            <text class="lead-status" :class="item.status">{{ getStatusText(item.status) }}</text>
          </view>
          <view class="lead-row">
            <text class="lead-phone">📞 {{ item.phone || '-' }}</text>
            <text class="lead-type">🏷️ {{ item.type || '-' }}</text>
          </view>
          <view class="lead-message" v-if="item.message">💬 {{ item.message }}</view>
          <view class="lead-date">⏰ {{ formatDate(item.createdAt) }}</view>
        </view>
        <view class="lead-actions">
          <view v-if="item.status !== 'contacted' && item.status !== 'converted'" class="action-btn contact" @click="handleUpdateStatus(item, 'contacted')">标记已联系</view>
          <view v-if="item.status !== 'converted'" class="action-btn convert" @click="handleUpdateStatus(item, 'converted')">标记已转化</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-if="!loading && leadList.length === 0" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无线索</text>
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
import { leadApi } from '../../../src/api/website.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const statusIndex = ref(0)
const statusOptions = ['全部状态', '新线索', '已联系', '已转化']

const statusMap = {
  new: '新线索',
  contacted: '已联系',
  converted: '已转化',
}

const statusReverseMap = { 1: 'new', 2: 'contacted', 3: 'converted' }

const leadList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

function getStatusText(status) {
  return statusMap[status] || status || '新线索'
}

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = {
      'pagination[page]': page,
      'pagination[pageSize]': 10,
    }
    if (statusIndex.value > 0) {
      params['filters[status]'] = statusReverseMap[statusIndex.value]
    }
    const { list, pagination: pg } = await leadApi.list(params)
    leadList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function handleStatusChange(e) {
  statusIndex.value = e.detail.value
  loadData(1)
}

async function handleUpdateStatus(item, status) {
  const label = statusMap[status]
  uni.showModal({
    title: '确认操作',
    content: `确定要将该线索标记为「${label}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await leadApi.update(item.documentId, { status })
          uni.showToast({ title: '已更新', icon: 'success' })
          loadData(currentPage.value)
        } catch (e) {
          uni.showToast({ title: '更新失败', icon: 'none' })
        }
      }
    }
  })
}

function prevPage() {
  if (currentPage.value > 1) loadData(currentPage.value - 1)
}

function nextPage() {
  if (currentPage.value < totalPages.value) loadData(currentPage.value + 1)
}

const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

onShow(() => loadData(1))
</script>

<style scoped>
page {
  background: #f5f5f5;
}
.page-container {
  min-height: 100vh;
  padding: 20rpx;
  box-sizing: border-box;
}

.filter-section {
  background: #fff;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.filter-item {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.arrow {
  font-size: 20rpx;
  color: #999;
}

.lead-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.lead-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  display: flex;
  align-items: stretch;
}

.lead-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.lead-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lead-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.lead-status {
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
  color: #fff;
  background: #999;
}

.lead-status.new { background: #1989fa; }
.lead-status.contacted { background: #faad14; }
.lead-status.converted { background: #07c160; }

.lead-phone, .lead-type {
  font-size: 26rpx;
  color: #666;
}

.lead-message {
  font-size: 26rpx;
  color: #666;
  background: #f9f9f9;
  padding: 12rpx;
  border-radius: 8rpx;
}

.lead-date {
  font-size: 22rpx;
  color: #999;
}

.lead-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  justify-content: center;
  margin-left: 16rpx;
}

.action-btn {
  padding: 12rpx 20rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  text-align: center;
  white-space: nowrap;
}

.action-btn.contact { background: #fff3e0; color: #faad14; }
.action-btn.convert { background: #e8f5e9; color: #07c160; }

.loading, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40rpx;
  padding: 40rpx 0;
}

.pagination-btn {
  padding: 16rpx 32rpx;
  background: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.pagination-btn.disabled {
  color: #999;
  background: #f5f5f5;
}

.pagination-info {
  font-size: 28rpx;
  color: #666;
}
</style>
