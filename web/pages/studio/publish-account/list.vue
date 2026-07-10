<template>
  <view class="page-container">
    <PageHeader title="发布账号">
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('studio.publish-account.create')">+ 新增</button>
    </PageHeader>

    <view class="search-section">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索账号名称"
          @confirm="loadData"
          class="search-input"
        />
        <text class="search-icon">🔍</text>
      </view>
    </view>

    <view class="data-list">
      <view
        v-for="item in dataList"
        :key="item.documentId"
        class="data-card"
        @click="goEdit(item.documentId)"
      >
        <view class="data-info">
          <view class="data-title">{{ item.name }}</view>
          <view class="data-meta">
            <text class="meta-item">📦 平台：{{ getPlatformName(item.platform) }}</text>
          </view>
          <view class="data-footer">
            <view class="data-status" :class="item.isActive ? 'active' : 'inactive'">{{ item.isActive ? '启用' : '停用' }}</view>
            <text class="data-date">{{ item.lastPublishedAt || '' }}</text>
          </view>
        </view>
        <view class="data-actions">
          <view v-if="hasPermission('studio.publish-account.update')" class="action-btn edit" @click.stop="goEdit(item.documentId)">编辑</view>
          <view v-if="hasPermission('studio.publish-account.update')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-if="!loading && dataList.length === 0" class="empty-state">
      <text class="empty-icon">🔑</text>
      <text class="empty-text">暂无发布账号</text>
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
import { publishAccountApi } from '../../../src/api/studio.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const searchKeyword = ref('')

const dataList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

function getPlatformName(platform) {
  if (!platform) return '未绑定'
  if (typeof platform === 'string') return platform
  return platform.name || platform.documentId || '未命名'
}

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = {
      'pagination[page]': page,
      'pagination[pageSize]': 10,
      'populate': '*'
    }
    if (searchKeyword.value) {
      params['filters[name][$contains]'] = searchKeyword.value
    }
    const { list, pagination: pg } = await publishAccountApi.list(params)
    dataList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goCreate() {
  uni.navigateTo({ url: '/pages/studio/publish-account/edit' })
}

function goEdit(id) {
  uni.navigateTo({ url: `/pages/studio/publish-account/edit?documentId=${id}` })
}

async function handleDelete(item) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除账号「${item.name}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await publishAccountApi.delete(item.documentId)
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

const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

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

.btn-primary {
  background: #ff0000;
  color: #ffffff;
  padding: 16rpx 32rpx;
  font-size: 30rpx;
  border-radius: 8rpx;
  border: none;
  line-height: 1.2;
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
  flex: 1;
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
.data-status.inactive { background: #999; }

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

.action-btn.edit { background: #f5f5f5; color: #1989fa; }
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
