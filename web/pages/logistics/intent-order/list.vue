<template>
  <view class="page-container">
    <PageHeader title="意向订单">
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.intent-order.create')">+ 新增</button>
    </PageHeader>

    <view class="search-section">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索订单号 / 客户名"
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
      </view>
    </view>

    <view class="order-list">
      <view
        v-for="item in orderList"
        :key="item.documentId"
        class="order-card"
        @click="goEdit(item.documentId)"
      >
        <view class="order-info">
          <view class="order-title">{{ item.orderNo }}</view>
          <view class="order-meta">
            <text class="meta-item">👤 {{ item.customerName }}</text>
            <text class="meta-item" v-if="item.customerType">🏷 {{ customerTypeText(item.customerType) }}</text>
            <text class="meta-item" v-if="item.plannedShipDate">📅 {{ item.plannedShipDate }}</text>
          </view>
          <view class="order-footer">
            <view class="order-status" :class="item.status">{{ statusText(item.status) }}</view>
            <view class="order-date">{{ formatDate(item.createdAt) }}</view>
          </view>
        </view>
        <view class="order-actions">
          <view v-if="item.status !== 'delivered' && item.status !== 'cancelled' && hasPermission('logistics.intent-order.update')" class="action-btn convert" @click.stop="handleConvert(item)">转为正式</view>
          <view v-if="hasPermission('logistics.intent-order.update')" class="action-btn edit" @click.stop="goEdit(item.documentId)">编辑</view>
          <view v-if="hasPermission('logistics.intent-order.update')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>

    <view v-if="!loading && orderList.length === 0" class="empty-state">
      <text class="empty-icon">📦</text>
      <text class="empty-text">暂无意向订单</text>
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.intent-order.create')">立即添加</button>
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
import { intentOrderApi, logisticsActionApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const searchKeyword = ref('')
const statusIndex = ref(0)
const statusOptions = ['全部状态', '意向', '已确认', '运输中', '已交付', '已取消']
const statusValues = ['', 'intent', 'confirmed', 'shipping', 'delivered', 'cancelled']

const orderList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

const statusMap = {
  intent: '意向',
  confirmed: '已确认',
  shipping: '运输中',
  delivered: '已交付',
  cancelled: '已取消'
}
function statusText(v) { return statusMap[v] || v || '-' }

const customerTypeMap = { individual: '个人', business: '企业', fba_seller: 'FBA 卖家' }
function customerTypeText(v) { return customerTypeMap[v] || v || '-' }

const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = {
      'pagination[page]': page,
      'pagination[pageSize]': 10
    }
    if (searchKeyword.value) {
      params['filters[orderNo][$contains]'] = searchKeyword.value
    }
    if (statusIndex.value > 0) {
      params['filters[status]'] = statusValues[statusIndex.value]
    }
    const { list, pagination: pg } = await intentOrderApi.list(params)
    orderList.value = list
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

function goCreate() {
  uni.navigateTo({ url: '/pages/logistics/intent-order/edit' })
}
function goEdit(id) {
  uni.navigateTo({ url: `/pages/logistics/intent-order/edit?documentId=${id}` })
}

async function handleDelete(item) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除意向订单「${item.orderNo}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await intentOrderApi.delete(item.documentId)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadData(currentPage.value)
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

async function handleConvert(item) {
  uni.showModal({
    title: '转为正式订单',
    content: `确定将意向订单「${item.orderNo}」转为正式订单吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await logisticsActionApi.orderConvert(item.documentId)
          uni.showToast({ title: '已转正式订单', icon: 'success' })
          loadData(currentPage.value)
        } catch (e) {
          uni.showToast({ title: '操作失败', icon: 'none' })
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

.order-list { display: flex; flex-direction: column; gap: 20rpx; }
.order-card {
  background: #fff; border-radius: 12rpx; padding: 24rpx;
  display: flex; align-items: center;
}
.order-info { flex: 1; display: flex; flex-direction: column; }
.order-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.order-meta { flex: 1; }
.meta-item { font-size: 24rpx; color: #999; margin-right: 16rpx; }
.order-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12rpx;
}
.order-status {
  padding: 4rpx 16rpx; border-radius: 4rpx;
  font-size: 22rpx; color: #fff;
}
.order-status.intent { background: #faad14; }
.order-status.confirmed { background: #1989fa; }
.order-status.shipping { background: #722ed1; }
.order-status.delivered { background: #07c160; }
.order-status.cancelled { background: #999; }
.order-date { font-size: 22rpx; color: #999; }

.order-actions { display: flex; flex-direction: column; gap: 12rpx; }
.action-btn {
  padding: 12rpx 24rpx; border-radius: 8rpx;
  font-size: 24rpx; text-align: center;
}
.action-btn.edit { background: #f5f5f5; color: #1989fa; }
.action-btn.delete { background: #fff0f0; color: #ff4d4f; }
.action-btn.convert { background: #e8f5e9; color: #07c160; }

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
