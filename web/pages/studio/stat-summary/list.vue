<template>
  <view class="page-container">
    <PageHeader title="统计汇总" />

    <view class="search-section">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索日期 (YYYY-MM-DD)"
          @confirm="loadData"
          class="search-input"
        />
        <text class="search-icon">🔍</text>
      </view>
      <view class="filter-row">
        <picker mode="selector" :range="summaryTypeLabelOptions" @change="handleTypeChange">
          <view class="filter-item">
            <text>{{ summaryTypeLabelOptions[typeIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
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
          <view class="data-title">{{ item.date }} · {{ getSummaryTypeText(item.summaryType) }}</view>
          <view class="data-meta">
            <text class="meta-item">👁️ PV {{ item.pv || 0 }}</text>
            <text class="meta-item">👤 UV {{ item.uv || 0 }}</text>
            <text class="meta-item">🖱️ 点击 {{ item.clickCount || 0 }}</text>
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
      <text class="empty-icon">📊</text>
      <text class="empty-text">暂无统计数据</text>
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
import { statSummaryApi } from '../../../src/api/studio.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const searchKeyword = ref('')
const typeIndex = ref(0)

const summaryTypeEnumList = ['', 'article-daily', 'ad-slot-daily', 'global-daily', 'device-daily', 'region-daily']
const summaryTypeLabelOptions = ['全部类型', '文章日统计', '广告位日统计', '全局日统计', '设备日统计', '地区日统计']

const summaryTypeMap = {
  'article-daily': '文章日统计',
  'ad-slot-daily': '广告位日统计',
  'global-daily': '全局日统计',
  'device-daily': '设备日统计',
  'region-daily': '地区日统计'
}

function getSummaryTypeText(type) {
  return summaryTypeMap[type] || type
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
      'populate': 'article,adSlot'
    }
    if (searchKeyword.value) {
      params['filters[date][$contains]'] = searchKeyword.value
    }
    if (typeIndex.value > 0) {
      params['filters[summaryType]'] = summaryTypeEnumList[typeIndex.value]
    }
    const { list, pagination: pg } = await statSummaryApi.list(params)
    dataList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function handleTypeChange(e) {
  typeIndex.value = e.detail.value
  loadData(1)
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/studio/stat-summary/detail?documentId=${id}` })
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
