<template>
  <view class="page-container">
    <PageHeader title="通知订阅">
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.subscription.create')">+ 新增订阅</button>
    </PageHeader>

    <view class="search-section">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索订阅目标（邮箱/手机号/账号）"
          @confirm="loadData(1)"
          class="search-input"
        />
        <text class="search-icon">🔍</text>
      </view>
      <view class="filter-row">
        <picker mode="selector" :range="typeOptions" @change="handleTypeChange">
          <view class="filter-item">
            <text>{{ typeOptions[typeIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
        <picker mode="selector" :range="channelOptions" @change="handleChannelChange">
          <view class="filter-item">
            <text>{{ channelOptions[channelIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="sub-list">
      <view
        v-for="item in subList"
        :key="item.documentId"
        class="sub-card"
        @click="goEdit(item.documentId)"
      >
        <view class="sub-info">
          <view class="sub-title">{{ item.channelTarget }}</view>
          <view class="sub-meta">
            <text class="meta-item">📨 {{ subscriberTypeText(item.subscriberType) }}</text>
            <text class="meta-item">📱 {{ channelText(item.channel) }}</text>
            <text class="meta-item">⏱ {{ frequencyText(item.frequency) }}</text>
            <text class="meta-item" v-if="item.language">🌐 {{ item.language }}</text>
          </view>
          <view class="sub-footer">
            <view class="sub-status" :class="{ active: item.isActive, inactive: !item.isActive }">
              {{ item.isActive ? '订阅中' : '已取消' }}
            </view>
            <view class="sub-date">订阅：{{ formatDate(item.subscribedAt) }}</view>
          </view>
        </view>
        <view class="sub-actions">
          <view v-if="hasPermission('logistics.subscription.update')" class="action-btn edit" @click.stop="goEdit(item.documentId)">编辑</view>
          <view v-if="hasPermission('logistics.subscription.update')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>

    <view v-if="!loading && subList.length === 0" class="empty-state">
      <text class="empty-icon">🔔</text>
      <text class="empty-text">暂无订阅</text>
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.subscription.create')">立即添加</button>
    </view>

    <view class="pagination" v-if="pagination.total > (pagination.pageSize || 10)">
      <view class="pagination-btn" @click="prevPage" :class="{ disabled: currentPage === 1 }">上一页</view>
      <text class="pagination-info">{{ currentPage }} / {{ totalPages }}</text>
      <view class="pagination-btn" @click="nextPage" :class="{ disabled: currentPage >= totalPages }">下一页</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { subscriptionApi } from '../../../src/api/logistics.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import { useUserStore } from '../../../src/store/user.js'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const searchKeyword = ref('')
const typeIndex = ref(0)
const typeOptions = ['全部类型', '物流更新', '报价回复', '促销', '资讯']
const typeValues = ['', 'tracking_update', 'quote_reply', 'promotion', 'newsletter']

const channelIndex = ref(0)
const channelOptions = ['全部渠道', '邮件', 'Line', 'Kakao', 'Zalo', '微信', '短信']
const channelValues = ['', 'email', 'line', 'kakao', 'zalo', 'wechat', 'sms']

const subList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

function subscriberTypeText(v) {
  const i = typeValues.indexOf(v)
  return i > 0 ? typeOptions[i] : v || '-'
}
function channelText(v) {
  const i = channelValues.indexOf(v)
  return i > 0 ? channelOptions[i] : v || '-'
}
function frequencyText(v) {
  const m = { realtime: '实时', daily: '每日', weekly: '每周' }
  return m[v] || v || '-'
}

const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = {
      'pagination[page]': page,
      'pagination[pageSize]': 10
    }
    if (searchKeyword.value) {
      params['filters[channelTarget][$contains]'] = searchKeyword.value
    }
    if (typeIndex.value > 0) {
      params['filters[subscriberType]'] = typeValues[typeIndex.value]
    }
    if (channelIndex.value > 0) {
      params['filters[channel]'] = channelValues[channelIndex.value]
    }
    const { list, pagination: pg } = await subscriptionApi.list(params)
    subList.value = list
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
function handleChannelChange(e) {
  channelIndex.value = e.detail.value
  loadData(1)
}

function goCreate() {
  uni.navigateTo({ url: '/pages/logistics/subscription/edit' })
}
function goEdit(id) {
  uni.navigateTo({ url: `/pages/logistics/subscription/edit?documentId=${id}` })
}

async function handleDelete(item) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除订阅「${item.channelTarget}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await subscriptionApi.delete(item.documentId)
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
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx; box-sizing: border-box; }

.btn-primary {
  background: #ff0000; color: #ffffff;
  padding: 16rpx 32rpx; font-size: 30rpx;
  border-radius: 8rpx; border: none; line-height: 1.2;
}

.search-section {
  background: #fff; padding: 20rpx;
  border-radius: 12rpx; margin-bottom: 20rpx;
}
.search-box {
  display: flex; align-items: center;
  background: #f5f5f5; border-radius: 8rpx;
  padding: 0 20rpx; margin-bottom: 20rpx;
}
.search-input { flex: 1; height: 72rpx; font-size: 28rpx; }
.search-icon { font-size: 32rpx; }

.filter-row { display: flex; gap: 20rpx; align-items: center; }
.filter-item {
  display: flex; align-items: center; gap: 8rpx;
  padding: 12rpx 24rpx; background: #f5f5f5;
  border-radius: 8rpx; font-size: 26rpx;
}
.arrow { font-size: 20rpx; color: #999; }

.sub-list { display: flex; flex-direction: column; gap: 20rpx; }
.sub-card {
  background: #fff; border-radius: 12rpx; padding: 24rpx;
  display: flex; align-items: center;
}
.sub-info { flex: 1; display: flex; flex-direction: column; }
.sub-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.sub-meta { flex: 1; }
.meta-item { font-size: 24rpx; color: #999; margin-right: 16rpx; }
.sub-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12rpx;
}
.sub-status {
  padding: 4rpx 16rpx; border-radius: 4rpx;
  font-size: 22rpx; color: #fff;
}
.sub-status.active { background: #07c160; }
.sub-status.inactive { background: #999; }
.sub-date { font-size: 22rpx; color: #999; }

.sub-actions { display: flex; flex-direction: column; gap: 12rpx; }
.action-btn {
  padding: 12rpx 24rpx; border-radius: 8rpx;
  font-size: 24rpx; text-align: center;
}
.action-btn.edit { background: #f5f5f5; color: #1989fa; }
.action-btn.delete { background: #fff0f0; color: #ff4d4f; }

.loading, .empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 100rpx 0;
}
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-bottom: 20rpx; }

.pagination {
  display: flex; justify-content: center; align-items: center;
  gap: 40rpx; padding: 40rpx 0;
}
.pagination-btn {
  padding: 16rpx 32rpx; background: #fff;
  border-radius: 8rpx; font-size: 28rpx;
}
.pagination-btn.disabled { color: #999; background: #f5f5f5; }
.pagination-info { font-size: 28rpx; color: #666; }
</style>
