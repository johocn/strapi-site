<template>
  <view class="page-container">
    <PageHeader title="统计汇总详情" />

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <scroll-view scroll-y v-else class="detail-scroll">
      <view class="detail-section">
        <view class="section-title">基本信息</view>
        <view class="detail-row">
          <text class="detail-label">日期</text>
          <text class="detail-value">{{ detail.date || '-' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">统计类型</text>
          <text class="detail-value">{{ getSummaryTypeText(detail.summaryType) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">文章</text>
          <text class="detail-value">{{ detail.article?.title || '-' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">广告位</text>
          <text class="detail-value">{{ detail.adSlot?.name || '-' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">创建时间</text>
          <text class="detail-value">{{ formatTime(detail.createdAt) }}</text>
        </view>
      </view>

      <view class="detail-section">
        <view class="section-title">核心指标</view>
        <view class="detail-row">
          <text class="detail-label">PV</text>
          <text class="detail-value">{{ detail.pv ?? 0 }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">UV</text>
          <text class="detail-value">{{ detail.uv ?? 0 }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">点击数</text>
          <text class="detail-value">{{ detail.clickCount ?? 0 }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">点击率</text>
          <text class="detail-value">{{ formatPercent(detail.clickRate) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">平均阅读时长</text>
          <text class="detail-value">{{ formatDuration(detail.avgReadDuration) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">平均滚动深度</text>
          <text class="detail-value">{{ formatPercent(detail.avgScrollDepth) }}</text>
        </view>
      </view>

      <view class="detail-section">
        <view class="section-title">设备统计</view>
        <view class="json-box">
          <text class="json-text">{{ formatJson(detail.deviceStats) }}</text>
        </view>
      </view>

      <view class="detail-section">
        <view class="section-title">地区统计</view>
        <view class="json-box">
          <text class="json-text">{{ formatJson(detail.regionStats) }}</text>
        </view>
      </view>

      <view class="detail-section">
        <view class="section-title">来源统计</view>
        <view class="json-box">
          <text class="json-text">{{ formatJson(detail.referrerStats) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { statSummaryApi } from '../../../src/api/studio.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const documentId = ref('')
const detail = ref({})
const loading = ref(false)

const summaryTypeMap = {
  'article-daily': '文章日统计',
  'ad-slot-daily': '广告位日统计',
  'global-daily': '全局日统计',
  'device-daily': '设备日统计',
  'region-daily': '地区日统计'
}

function getSummaryTypeText(type) {
  return summaryTypeMap[type] || type || '-'
}

function formatTime(t) {
  return t ? formatDate(t) : '-'
}

function formatPercent(v) {
  if (v === undefined || v === null) return '-'
  return (Number(v) * 100).toFixed(2) + '%'
}

function formatDuration(v) {
  if (v === undefined || v === null) return '-'
  return Number(v).toFixed(2) + 's'
}

function formatJson(data) {
  if (!data) return '-'
  if (typeof data === 'string') return data
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

async function loadDetail() {
  if (!documentId.value) return
  loading.value = true
  try {
    const item = await statSummaryApi.detail(documentId.value)
    detail.value = item || {}
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  if (options?.documentId) {
    documentId.value = options.documentId
    loadDetail()
  }
})
</script>

<style scoped>
page {
  background: #f5f5f5;
}
.page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.detail-scroll {
  flex: 1;
  padding: 20rpx;
  box-sizing: border-box;
}

.detail-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  padding-left: 8rpx;
  border-left: 6rpx solid #ff0000;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 28rpx;
  color: #666;
  flex-shrink: 0;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 20rpx;
  word-break: break-all;
}

.json-box {
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 20rpx;
}

.json-text {
  font-size: 24rpx;
  color: #333;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 100rpx 0;
  font-size: 28rpx;
  color: #999;
}
</style>
