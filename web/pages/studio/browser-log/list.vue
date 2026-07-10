<template>
  <view class="page-container">
    <PageHeader title="浏览器日志" />

    <view class="search-section">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索城市/IP/会话 ID"
          @confirm="loadData"
          class="search-input"
        />
        <text class="search-icon">🔍</text>
      </view>
      <view class="filter-row">
        <picker mode="selector" :range="eventTypeLabelOptions" @change="handleEventTypeChange">
          <view class="filter-item">
            <text>{{ eventTypeLabelOptions[eventTypeIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
        <picker mode="selector" :range="deviceTypeLabelOptions" @change="handleDeviceTypeChange">
          <view class="filter-item">
            <text>{{ deviceTypeLabelOptions[deviceTypeIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
        <view class="filter-input-wrap">
          <input
            type="text"
            v-model="cityFilter"
            placeholder="城市筛选"
            @confirm="loadData(1)"
            class="filter-input"
          />
        </view>
      </view>
    </view>

    <view class="data-list">
      <view
        v-for="item in dataList"
        :key="item.documentId"
        class="data-card"
        @click="goDetail(item.documentId)"
      >
        <view class="data-info">
          <view class="data-title">{{ getEventTypeText(item.eventType) }}</view>
          <view class="data-meta">
            <text class="meta-item">🖥️ {{ item.platform || '-' }}</text>
            <text class="meta-item">📱 {{ getDeviceTypeText(item.deviceType) }}</text>
            <text class="meta-item">📍 {{ item.city || '-' }}</text>
          </view>
          <view class="data-footer">
            <view class="data-date">🕐 {{ formatTime(item.timestamp) }}</view>
          </view>
        </view>
        <view class="data-actions">
          <view class="action-btn detail" @click.stop="goDetail(item.documentId)">详情</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-if="!loading && dataList.length === 0" class="empty-state">
      <text class="empty-icon">🌐</text>
      <text class="empty-text">暂无日志</text>
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
import { browserLogApi } from '../../../src/api/studio.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const searchKeyword = ref('')
const eventTypeIndex = ref(0)
const deviceTypeIndex = ref(0)
const cityFilter = ref('')

const eventTypeEnumList = ['', 'page-view', 'ad-click', 'scroll', 'read-duration', 'user-register']
const eventTypeLabelOptions = ['全部事件', '页面浏览', '广告点击', '滚动', '阅读时长', '用户注册']

const deviceTypeEnumList = ['', 'desktop', 'mobile', 'tablet']
const deviceTypeLabelOptions = ['全部设备', '桌面', '移动', '平板']

const eventTypeMap = {
  'page-view': '页面浏览',
  'ad-click': '广告点击',
  'scroll': '滚动',
  'read-duration': '阅读时长',
  'user-register': '用户注册'
}

const deviceTypeMap = {
  desktop: '桌面',
  mobile: '移动',
  tablet: '平板'
}

function getEventTypeText(type) {
  return eventTypeMap[type] || type
}

function getDeviceTypeText(type) {
  return deviceTypeMap[type] || type
}

function formatTime(t) {
  return t ? formatDate(t) : '-'
}

const dataList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = {
      'pagination[page]': page,
      'pagination[pageSize]': 10,
      'populate': 'article,adSlot,user',
      'sort': 'timestamp:desc'
    }
    if (searchKeyword.value) {
      params['filters[$or][0][city][$contains]'] = searchKeyword.value
      params['filters[$or][1][ip][$contains]'] = searchKeyword.value
      params['filters[$or][2][sessionId][$contains]'] = searchKeyword.value
    }
    if (eventTypeIndex.value > 0) {
      params['filters[eventType]'] = eventTypeEnumList[eventTypeIndex.value]
    }
    if (deviceTypeIndex.value > 0) {
      params['filters[deviceType]'] = deviceTypeEnumList[deviceTypeIndex.value]
    }
    if (cityFilter.value) {
      params['filters[city][$contains]'] = cityFilter.value
    }
    const { list, pagination: pg } = await browserLogApi.list(params)
    dataList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function handleEventTypeChange(e) {
  eventTypeIndex.value = e.detail.value
  loadData(1)
}

function handleDeviceTypeChange(e) {
  deviceTypeIndex.value = e.detail.value
  loadData(1)
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/studio/browser-log/detail?documentId=${id}` })
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
  margin-bottom: 20rpx;
}

.search-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
}

.search-icon {
  font-size: 32rpx;
}

.filter-row {
  display: flex;
  gap: 20rpx;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.filter-input-wrap {
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 20rpx;
}

.filter-input {
  height: 56rpx;
  font-size: 26rpx;
  width: 200rpx;
}

.arrow {
  font-size: 20rpx;
  color: #999;
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

.action-btn.detail { background: #f5f5f5; color: #1989fa; }

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
