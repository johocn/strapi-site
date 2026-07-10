<template>
  <view class="page-container">
    <PageHeader title="数据分析看板" />

    <TenantSelector v-if="hasPermission('menu.tenant')" v-model="tenantId" @change="onFilterChange" />

    <view class="card">
      <view class="card-label">日期范围</view>
      <picker mode="selector" :range="dateRangeOptions" @change="onDateRangeChange" :value="dateRangeIndex">
        <view class="picker-value">{{ dateRangeOptions[dateRangeIndex] }}</view>
      </picker>
      <view v-if="dateRangeIndex === 3" class="custom-date-row">
        <picker mode="date" :value="customStartDate" @change="e => { customStartDate = e.detail.value; onFilterChange() }">
          <view class="picker-value">{{ customStartDate || '开始日期' }}</view>
        </picker>
        <text class="date-sep">至</text>
        <picker mode="date" :value="customEndDate" @change="e => { customEndDate = e.detail.value; onFilterChange() }">
          <view class="picker-value">{{ customEndDate || '结束日期' }}</view>
        </picker>
      </view>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <template v-else>
      <!-- 1. 概览卡片 -->
      <view class="section">
        <view class="section-title">概览</view>
        <view class="overview-grid">
          <view class="overview-card">
            <text class="overview-num">{{ formatNum(overview.pv) }}</text>
            <text class="overview-label">PV</text>
          </view>
          <view class="overview-card">
            <text class="overview-num">{{ formatNum(overview.uv) }}</text>
            <text class="overview-label">UV</text>
          </view>
          <view class="overview-card">
            <text class="overview-num">{{ formatNum(overview.clicks) }}</text>
            <text class="overview-label">点击量</text>
          </view>
          <view class="overview-card">
            <text class="overview-num">{{ formatPercent(overview.ctr) }}</text>
            <text class="overview-label">点击率</text>
          </view>
        </view>
        <view class="overview-grid">
          <view class="overview-card">
            <text class="overview-num">{{ formatDuration(overview.avgReadDuration) }}</text>
            <text class="overview-label">平均阅读时长</text>
          </view>
          <view class="overview-card">
            <text class="overview-num">{{ formatPercent(overview.avgScrollDepth) }}</text>
            <text class="overview-label">平均滚动深度</text>
          </view>
        </view>
      </view>

      <!-- 2. 文章排行 TOP 10 -->
      <view class="section">
        <view class="section-title">文章排行 TOP 10</view>
        <view class="rank-list">
          <view
            v-for="(item, idx) in articleRanking"
            :key="idx"
            class="rank-item"
            @click="goArticleDetail(item)"
          >
            <view class="rank-num" :class="{ top: idx < 3 }">{{ idx + 1 }}</view>
            <view class="rank-info">
              <view class="rank-title">{{ item.title }}</view>
              <view class="rank-meta">
                <text class="meta-text">PV: {{ formatNum(item.pv) }}</text>
                <text class="meta-text">UV: {{ formatNum(item.uv) }}</text>
                <text class="meta-text">点击率: {{ formatPercent(item.ctr) }}</text>
              </view>
            </view>
          </view>
          <view v-if="articleRanking.length === 0" class="empty-inline">
            <text class="empty-text">暂无数据</text>
          </view>
        </view>
      </view>

      <!-- 3. 设备分布 -->
      <view class="section">
        <view class="section-title">设备分布</view>
        <view class="bar-list">
          <view v-for="(item, idx) in deviceStats" :key="idx" class="bar-item">
            <view class="bar-header">
              <text class="bar-label">{{ item.device }}</text>
              <text class="bar-value">{{ formatNum(item.count) }} ({{ formatPercent(item.percentage) }})</text>
            </view>
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: getPercent(item.percentage, idx, deviceStats) + '%' }"></view>
            </view>
          </view>
          <view v-if="deviceStats.length === 0" class="empty-inline">
            <text class="empty-text">暂无数据</text>
          </view>
        </view>
      </view>

      <!-- 4. 地域分布 TOP 10 -->
      <view class="section">
        <view class="section-title">地域分布 TOP 10</view>
        <view class="bar-list">
          <view v-for="(item, idx) in regionStats" :key="idx" class="bar-item">
            <view class="bar-header">
              <text class="bar-label">{{ item.region || item.city || item.name || '未知' }}</text>
              <text class="bar-value">{{ formatNum(item.count || item.visits) }}</text>
            </view>
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: getPercent(item.percentage, idx, regionStats) + '%' }"></view>
            </view>
          </view>
          <view v-if="regionStats.length === 0" class="empty-inline">
            <text class="empty-text">暂无数据</text>
          </view>
        </view>
      </view>

      <!-- 5. 用户注册转化 -->
      <view class="section">
        <view class="section-title">用户注册转化</view>
        <view class="conversion-box">
          <view class="conversion-row">
            <text class="conv-label">访客数</text>
            <text class="conv-value">{{ formatNum(userStats.visitors) }}</text>
          </view>
          <view class="conversion-row">
            <text class="conv-label">注册数</text>
            <text class="conv-value">{{ formatNum(userStats.registrations) }}</text>
          </view>
          <view class="conversion-row">
            <text class="conv-label">转化率</text>
            <text class="conv-value highlight">{{ formatPercent(userStats.conversionRate) }}</text>
          </view>
          <view class="progress-bar" style="margin-top: 16rpx;">
            <view class="progress-fill" :style="{ width: formatPercentNum(userStats.conversionRate) + '%' }"></view>
          </view>
        </view>
      </view>

      <!-- 6. 广告位效果 -->
      <view class="section">
        <view class="section-title">广告位效果</view>
        <view class="ad-list">
          <view v-for="(item, idx) in adSlotStats" :key="idx" class="ad-card">
            <view class="ad-title">{{ item.name || item.adSlotName || '未命名' }}</view>
            <view class="ad-meta">
              <text class="meta-text">展示量: {{ formatNum(item.impressions || item.shows) }}</text>
              <text class="meta-text">点击量: {{ formatNum(item.clicks) }}</text>
              <text class="meta-text">点击率: {{ formatPercent(item.ctr) }}</text>
            </view>
          </view>
          <view v-if="adSlotStats.length === 0" class="empty-inline">
            <text class="empty-text">暂无数据</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { statsApi } from '../../../src/api/studio.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import TenantSelector from '../../../src/components/TenantSelector.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const loading = ref(false)
const tenantId = ref('')

const dateRangeIndex = ref(0)
const dateRangeOptions = ['近7天', '近30天', '近90天', '自定义']
const customStartDate = ref('')
const customEndDate = ref('')

const overview = ref({})
const articleRanking = ref([])
const deviceStats = ref([])
const regionStats = ref([])
const userStats = ref({})
const adSlotStats = ref([])

const dateParams = computed(() => {
  const now = new Date()
  const end = new Date(now)
  let start = new Date(now)

  if (dateRangeIndex.value === 0) {
    start.setDate(start.getDate() - 7)
  } else if (dateRangeIndex.value === 1) {
    start.setDate(start.getDate() - 30)
  } else if (dateRangeIndex.value === 2) {
    start.setDate(start.getDate() - 90)
  } else {
    if (customStartDate.value && customEndDate.value) {
      return { startDate: customStartDate.value, endDate: customEndDate.value }
    }
    start.setDate(start.getDate() - 7)
  }

  return {
    startDate: formatDateStr(start),
    endDate: formatDateStr(end)
  }
})

function formatDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getStatsParams() {
  const params = { ...dateParams.value }
  if (tenantId.value) {
    params.tenantId = tenantId.value
  }
  return params
}

function formatNum(num) {
  if (num == null) return '0'
  return Number(num).toLocaleString('zh-CN')
}

function formatPercent(val) {
  if (val == null) return '0%'
  const num = Number(val)
  if (isNaN(num)) return '0%'
  if (num <= 1) return (num * 100).toFixed(2) + '%'
  return num.toFixed(2) + '%'
}

function formatPercentNum(val) {
  if (val == null) return 0
  const num = Number(val)
  if (isNaN(num)) return 0
  if (num <= 1) return num * 100
  return num
}

function formatDuration(seconds) {
  if (seconds == null) return '-'
  const num = Number(seconds)
  if (isNaN(num)) return '-'
  if (num < 60) return Math.round(num) + '秒'
  const min = Math.floor(num / 60)
  const sec = Math.round(num % 60)
  return `${min}分${sec}秒`
}

function getPercent(percentage, idx, list) {
  if (percentage != null) return formatPercentNum(percentage)
  if (!list || list.length === 0) return 0
  const total = list.reduce((sum, item) => sum + (item.count || item.visits || 0), 0)
  if (total === 0) return 0
  return ((list[idx].count || list[idx].visits || 0) / total * 100).toFixed(1)
}

function normalizeDevices(data) {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  return Object.entries(data).map(([device, value]) => ({
    device: device.charAt(0).toUpperCase() + device.slice(1),
    count: typeof value === 'object' ? value.count : value,
    percentage: typeof value === 'object' ? value.percentage : null
  }))
}

function onDateRangeChange(e) {
  dateRangeIndex.value = e.detail.value
  if (e.detail.value !== 3) {
    onFilterChange()
  }
}

function onFilterChange() {
  loadAllStats()
}

async function loadAllStats() {
  loading.value = true
  const params = getStatsParams()

  const results = await Promise.allSettled([
    statsApi.overview(params),
    statsApi.articles(params),
    statsApi.devices(params),
    statsApi.regions(params),
    statsApi.users(params),
    statsApi.adSlots(params)
  ])

  if (results[0].status === 'fulfilled') {
    overview.value = results[0].value || {}
  } else {
    overview.value = {}
  }

  if (results[1].status === 'fulfilled') {
    const val = results[1].value
    articleRanking.value = Array.isArray(val) ? val.slice(0, 10) : (val?.list || val?.articles || [])
  } else {
    articleRanking.value = []
  }

  if (results[2].status === 'fulfilled') {
    deviceStats.value = normalizeDevices(results[2].value)
  } else {
    deviceStats.value = []
  }

  if (results[3].status === 'fulfilled') {
    const val = results[3].value
    regionStats.value = Array.isArray(val) ? val.slice(0, 10) : (val?.list || val?.regions || [])
  } else {
    regionStats.value = []
  }

  if (results[4].status === 'fulfilled') {
    userStats.value = results[4].value || {}
  } else {
    userStats.value = {}
  }

  if (results[5].status === 'fulfilled') {
    const val = results[5].value
    adSlotStats.value = Array.isArray(val) ? val : (val?.list || val?.adSlots || [])
  } else {
    adSlotStats.value = []
  }

  loading.value = false
}

function goArticleDetail(item) {
  const id = item.documentId || item.articleId || item.id
  if (id) {
    uni.navigateTo({ url: `/pages/studio/article-draft/edit?documentId=${id}` })
  }
}

onLoad(() => {
  loadAllStats()
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

.card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.card-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.picker-value {
  font-size: 28rpx;
  color: #333;
  padding: 16rpx 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
}

.custom-date-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
}
.date-sep {
  font-size: 28rpx;
  color: #666;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 100rpx 0;
  font-size: 28rpx;
  color: #999;
}

.section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-left: 16rpx;
  border-left: 6rpx solid #1989fa;
}

.overview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.overview-card {
  flex: 1;
  min-width: 30%;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 24rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.overview-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #1989fa;
}
.overview-label {
  font-size: 24rpx;
  color: #999;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.rank-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.rank-item:last-child {
  border-bottom: none;
}
.rank-num {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #f0f0f0;
  color: #999;
  font-size: 26rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rank-num.top {
  background: #ff0000;
  color: #fff;
}
.rank-info {
  flex: 1;
}
.rank-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}
.rank-meta {
  display: flex;
  gap: 20rpx;
}
.meta-text {
  font-size: 24rpx;
  color: #999;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.bar-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.bar-header {
  display: flex;
  justify-content: space-between;
}
.bar-label {
  font-size: 26rpx;
  color: #333;
}
.bar-value {
  font-size: 24rpx;
  color: #999;
}
.progress-bar {
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1989fa, #36cfc9);
  border-radius: 8rpx;
  transition: width 0.3s;
}

.conversion-box {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.conversion-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
}
.conv-label {
  font-size: 28rpx;
  color: #666;
}
.conv-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}
.conv-value.highlight {
  color: #ff0000;
}

.ad-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.ad-card {
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 20rpx;
}
.ad-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}
.ad-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.empty-inline {
  padding: 40rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
