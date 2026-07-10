<template>
  <view class="page-container">
    <PageHeader title="邀请记录" />

    <view class="search-section">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索 channel_code / app_code"
          @confirm="loadData"
          class="search-input"
        />
        <text class="search-icon">🔍</text>
      </view>
    </view>

    <view class="data-list">
      <view v-for="item in dataList" :key="item.documentId" class="data-card">
        <view class="data-info">
          <view class="data-title">邀请码: {{ relDoc(item.invite_code) }}</view>
          <view class="data-meta">
            <text class="meta-item">用户: {{ relDoc(item.user) }}</text>
            <text class="meta-item">渠道: {{ item.channel_code || '-' }}</text>
            <text class="meta-item">应用: {{ item.app_code || '-' }}</text>
          </view>
          <view class="data-footer">
            <view class="data-status active">已使用</view>
            <view class="data-date">使用时间: {{ fmtDateTime(item.used_at) }}</view>
          </view>
        </view>
        <view class="data-actions">
          <view v-if="hasPermission('sso.invite-usage.delete')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-if="!loading && dataList.length === 0" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无邀请记录</text>
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
import { ssoInviteUsageApi } from '../../../src/api/sso.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const searchKeyword = ref('')
const dataList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

function relDoc(rel) {
  if (!rel) return '-'
  if (typeof rel === 'object') return rel.documentId || rel.id || '-'
  return rel
}

function fmtDateTime(dt) {
  if (!dt) return '-'
  return String(dt).replace('T', ' ').substring(0, 19)
}

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = {
      'pagination[page]': page,
      'pagination[pageSize]': 10
    }
    if (searchKeyword.value) {
      params['filters[$or][0][channel_code][$contains]'] = searchKeyword.value
      params['filters[$or][1][app_code][$contains]'] = searchKeyword.value
    }
    const { list, pagination: pg } = await ssoInviteUsageApi.list(params)
    dataList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function handleDelete(item) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该邀请记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await ssoInviteUsageApi.delete(item.documentId)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadData(currentPage.value)
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
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

onShow(() => {
  loadData(1)
})
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

.search-section {
  background: #fff;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 20rpx;
}

.search-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
}

.search-icon {
  font-size: 32rpx;
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.data-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
}

.data-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.data-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.data-meta {
  margin-bottom: 8rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #999;
  margin-right: 16rpx;
}

.data-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
}

.data-status {
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
  color: #fff;
}

.data-status.active { background: #07c160; }

.data-date {
  font-size: 22rpx;
  color: #999;
}

.data-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  text-align: center;
}

.action-btn.delete { background: #fff0f0; color: #ff4d4f; }

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
  margin-bottom: 20rpx;
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
