<template>
  <view class="page-container">
    <PageHeader title="浏览器日志详情" />

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <scroll-view scroll-y v-else class="detail-scroll">
      <view class="detail-section">
        <view class="section-title">事件信息</view>
        <view class="detail-row">
          <text class="detail-label">事件类型</text>
          <text class="detail-value">{{ getEventTypeText(detail.eventType) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">时间戳</text>
          <text class="detail-value">{{ formatTime(detail.timestamp) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">会话 ID</text>
          <text class="detail-value">{{ detail.sessionId || '-' }}</text>
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
          <text class="detail-label">阅读时长</text>
          <text class="detail-value">{{ detail.readDuration ?? 0 }}s</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">滚动深度</text>
          <text class="detail-value">{{ detail.scrollDepth ?? 0 }}%</text>
        </view>
      </view>

      <view class="detail-section">
        <view class="section-title">用户信息</view>
        <view class="detail-row">
          <text class="detail-label">用户 ID</text>
          <text class="detail-value">{{ detail.userId || '-' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">是否注册</text>
          <text class="detail-value">{{ detail.isRegistered ? '是' : '否' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">注册时间</text>
          <text class="detail-value">{{ formatTime(detail.registeredAt) }}</text>
        </view>
      </view>

      <view class="detail-section">
        <view class="section-title">设备与环境</view>
        <view class="detail-row">
          <text class="detail-label">平台</text>
          <text class="detail-value">{{ detail.platform || '-' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">设备类型</text>
          <text class="detail-value">{{ getDeviceTypeText(detail.deviceType) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">浏览器</text>
          <text class="detail-value">{{ detail.browser || '-' }} {{ detail.browserVersion || '' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">操作系统</text>
          <text class="detail-value">{{ detail.os || '-' }} {{ detail.osVersion || '' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">屏幕分辨率</text>
          <text class="detail-value">{{ detail.screenWidth || '-' }} × {{ detail.screenHeight || '-' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">语言</text>
          <text class="detail-value">{{ detail.language || '-' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">User-Agent</text>
          <text class="detail-value">{{ detail.userAgent || '-' }}</text>
        </view>
      </view>

      <view class="detail-section">
        <view class="section-title">地理位置</view>
        <view class="detail-row">
          <text class="detail-label">IP</text>
          <text class="detail-value">{{ detail.ip || '-' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">国家</text>
          <text class="detail-value">{{ detail.country || '-' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">城市</text>
          <text class="detail-value">{{ detail.city || '-' }}</text>
        </view>
      </view>

      <view class="detail-section">
        <view class="section-title">来源信息</view>
        <view class="detail-row">
          <text class="detail-label">来源</text>
          <text class="detail-value">{{ detail.referrer || '-' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">来源域名</text>
          <text class="detail-value">{{ detail.referrerDomain || '-' }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">创建时间</text>
          <text class="detail-value">{{ formatTime(detail.createdAt) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { browserLogApi } from '../../../src/api/studio.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const documentId = ref('')
const detail = ref({})
const loading = ref(false)

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
  return eventTypeMap[type] || type || '-'
}

function getDeviceTypeText(type) {
  return deviceTypeMap[type] || type || '-'
}

function formatTime(t) {
  return t ? formatDate(t) : '-'
}

async function loadDetail() {
  if (!documentId.value) return
  loading.value = true
  try {
    const item = await browserLogApi.detail(documentId.value)
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

.loading {
  display: flex;
  justify-content: center;
  padding: 100rpx 0;
  font-size: 28rpx;
  color: #999;
}
</style>
