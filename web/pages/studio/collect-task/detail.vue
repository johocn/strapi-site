<template>
  <view class="page-container">
    <PageHeader title="采集任务详情" />

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <scroll-view scroll-y v-else class="detail-scroll">
      <view class="detail-section">
        <view class="section-title">基本信息</view>
        <view class="detail-row">
          <text class="detail-label">来源</text>
          <text class="detail-value">{{ detail.source?.name || '-' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">状态</text>
          <view class="data-status" :class="detail.status">{{ getStatusText(detail.status) }}</view>
        </view>
        <view class="detail-row">
          <text class="detail-label">重试次数</text>
          <text class="detail-value">{{ detail.retryCount ?? 0 }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">创建时间</text>
          <text class="detail-value">{{ formatTime(detail.createdAt) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">更新时间</text>
          <text class="detail-value">{{ formatTime(detail.updatedAt) }}</text>
        </view>
      </view>

      <view class="detail-section" v-if="detail.error">
        <view class="section-title">错误信息</view>
        <view class="error-box">
          <text class="error-text">{{ detail.error }}</text>
        </view>
      </view>

      <view class="detail-section">
        <view class="section-title">标题列表</view>
        <view class="json-box">
          <text class="json-text">{{ formatJson(detail.titles) }}</text>
        </view>
      </view>

      <view class="detail-section">
        <view class="section-title">已选标题</view>
        <view class="json-box">
          <text class="json-text">{{ formatJson(detail.selectedTitles) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { collectTaskApi } from '../../../src/api/studio.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const documentId = ref('')
const detail = ref({})
const loading = ref(false)

const statusMap = {
  pending: '待处理',
  fetching_titles: '获取标题中',
  waiting_selection: '等待选择',
  fetching_content: '获取内容中',
  completed: '已完成',
  failed: '失败'
}

function getStatusText(status) {
  return statusMap[status] || status || '-'
}

function formatTime(t) {
  return t ? formatDate(t) : '-'
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
    const item = await collectTaskApi.detail(documentId.value)
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

.data-status {
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
  color: #fff;
}

.data-status.pending { background: #999; }
.data-status.fetching_titles { background: #1989fa; }
.data-status.waiting_selection { background: #faad14; }
.data-status.fetching_content { background: #722ed1; }
.data-status.completed { background: #07c160; }
.data-status.failed { background: #ff4d4f; }

.error-box {
  background: #fff0f0;
  border-radius: 8rpx;
  padding: 20rpx;
}

.error-text {
  font-size: 26rpx;
  color: #ff4d4f;
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
