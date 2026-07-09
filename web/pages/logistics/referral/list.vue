<template>
  <view class="page-container">
    <PageHeader title="推荐奖励">
      <button class="btn-secondary" @click="handleStats" v-if="hasPermission('logistics.referral.read')">查看统计</button>
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.referral.create')">+ 新增</button>
    </PageHeader>

    <view class="search-section">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索推荐码 / 推荐人"
          @confirm="loadData(1)"
          class="search-input"
        />
        <text class="search-icon">🔍</text>
      </view>
      <view class="filter-row">
        <picker mode="selector" :range="statusOptions" @change="handleStatusChange">
          <view class="filter-item">
            <text>{{ statusOptions[statusIndex] }}</text>
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

    <view class="ref-list">
      <view
        v-for="item in refList"
        :key="item.documentId"
        class="ref-card"
        @click="goEdit(item.documentId)"
      >
        <view class="ref-info">
          <view class="ref-title">{{ item.referralCode }}</view>
          <view class="ref-meta">
            <text class="meta-item">👤 {{ item.referrerName }}</text>
            <text class="meta-item">🎯 {{ item.refereeName }}</text>
            <text class="meta-item">📣 {{ channelText(item.referralChannel) }}</text>
            <text class="meta-item">🎁 {{ rewardTypeText(item.rewardType) }}</text>
          </view>
          <view class="ref-footer">
            <view class="ref-status" :class="item.status">{{ statusText(item.status) }}</view>
            <view class="ref-date">{{ formatDate(item.createdAt) }}</view>
          </view>
        </view>
        <view class="ref-actions">
          <view v-if="hasPermission('logistics.referral.update')" class="action-btn edit" @click.stop="goEdit(item.documentId)">编辑</view>
          <view v-if="hasPermission('logistics.referral.update')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>

    <view v-if="!loading && refList.length === 0" class="empty-state">
      <text class="empty-icon">🎁</text>
      <text class="empty-text">暂无推荐</text>
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.referral.create')">立即添加</button>
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
import { referralApi, logisticsActionApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const searchKeyword = ref('')
const statusIndex = ref(0)
const statusOptions = ['全部状态', '待处理', '已联系', '已合格', '已转化', '已奖励', '无效']
const statusValues = ['', 'pending', 'contacted', 'qualified', 'converted', 'rewarded', 'invalid']
const statusMap = { pending: '待处理', contacted: '已联系', qualified: '已合格', converted: '已转化', rewarded: '已奖励', invalid: '无效' }
function statusText(v) { return statusMap[v] || v || '-' }

const channelIndex = ref(0)
const channelOptions = ['全部渠道', '朋友', '社群', '展会', '合作伙伴', '其他']
const channelValues = ['', 'friend', 'community', 'exhibition', 'partner', 'other']
function channelText(v) {
  const i = channelValues.indexOf(v)
  return i > 0 ? channelOptions[i] : v || '-'
}

const rewardTypeMap = { points: '积分', cash: '现金', discount: '折扣', gift: '礼品' }
function rewardTypeText(v) { return rewardTypeMap[v] || v || '-' }

const refList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = {
      'pagination[page]': page,
      'pagination[pageSize]': 10
    }
    if (searchKeyword.value) {
      params['filters[referralCode][$contains]'] = searchKeyword.value
    }
    if (statusIndex.value > 0) {
      params['filters[status]'] = statusValues[statusIndex.value]
    }
    if (channelIndex.value > 0) {
      params['filters[referralChannel]'] = channelValues[channelIndex.value]
    }
    const { list, pagination: pg } = await referralApi.list(params)
    refList.value = list
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
function handleChannelChange(e) {
  channelIndex.value = e.detail.value
  loadData(1)
}

function goCreate() {
  uni.navigateTo({ url: '/pages/logistics/referral/edit' })
}
function goEdit(id) {
  uni.navigateTo({ url: `/pages/logistics/referral/edit?documentId=${id}` })
}

async function handleDelete(item) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除推荐「${item.referralCode}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await referralApi.delete(item.documentId)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadData(currentPage.value)
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

async function handleStats() {
  try {
    const stats = await logisticsActionApi.referralStats({})
    const lines = []
    if (stats && typeof stats === 'object') {
      Object.keys(stats).forEach(k => {
        lines.push(`${k}: ${stats[k]}`)
      })
    }
    uni.showModal({
      title: '推荐统计',
      content: lines.length ? lines.join('\n') : '暂无统计数据',
      showCancel: false
    })
  } catch (e) {
    uni.showToast({ title: '统计加载失败', icon: 'none' })
  }
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
  margin-left: 12rpx;
}
.btn-secondary {
  background: #f5f5f5; color: #333;
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

.ref-list { display: flex; flex-direction: column; gap: 20rpx; }
.ref-card {
  background: #fff; border-radius: 12rpx; padding: 24rpx;
  display: flex; align-items: center;
}
.ref-info { flex: 1; display: flex; flex-direction: column; }
.ref-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.ref-meta { flex: 1; }
.meta-item { font-size: 24rpx; color: #999; margin-right: 16rpx; }
.ref-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12rpx;
}
.ref-status {
  padding: 4rpx 16rpx; border-radius: 4rpx;
  font-size: 22rpx; color: #fff;
}
.ref-status.pending { background: #faad14; }
.ref-status.contacted { background: #1989fa; }
.ref-status.qualified { background: #722ed1; }
.ref-status.converted { background: #07c160; }
.ref-status.rewarded { background: #13c2c2; }
.ref-status.invalid { background: #999; }
.ref-date { font-size: 22rpx; color: #999; }

.ref-actions { display: flex; flex-direction: column; gap: 12rpx; }
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
