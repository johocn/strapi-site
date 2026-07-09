<template>
  <view class="page-container">
    <PageHeader title="客户评价管理">
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.review.create')">+ 新增评价</button>
    </PageHeader>

    <view class="search-section">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索评价者名称"
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
        <picker mode="selector" :range="typeOptions" @change="handleTypeChange">
          <view class="filter-item">
            <text>{{ typeOptions[typeIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="review-list">
      <view
        v-for="item in reviewList"
        :key="item.documentId"
        class="review-card"
        @click="goEdit(item.documentId)"
      >
        <view class="review-info">
          <view class="review-title">{{ item.authorName }}</view>
          <view class="review-meta">
            <text class="meta-item">⭐ {{ item.rating }}</text>
            <text class="meta-item" v-if="item.authorCompany">🏢 {{ item.authorCompany }}</text>
            <text class="meta-item" v-if="item.authorCountry">🌐 {{ item.authorCountry }}</text>
            <text class="meta-item">📝 {{ item.testimonialType }}</text>
          </view>
          <view class="review-content">{{ item.content ? item.content.substring(0, 60) : '' }}</view>
          <view class="review-footer">
            <view class="review-status" :class="item.status">{{ getStatusText(item.status) }}</view>
            <view class="review-date">{{ formatDate(item.createdAt) }}</view>
          </view>
        </view>
        <view class="review-actions">
          <view v-if="item.status === 'pending' && hasPermission('logistics.review.update')" class="action-btn approve" @click.stop="handleApprove(item)">通过</view>
          <view v-if="item.status === 'pending' && hasPermission('logistics.review.update')" class="action-btn reject" @click.stop="handleReject(item)">拒绝</view>
          <view v-if="hasPermission('logistics.review.update')" class="action-btn reply" @click.stop="handleReply(item)">回复</view>
          <view v-if="hasPermission('logistics.review.update')" class="action-btn edit" @click.stop="goEdit(item.documentId)">编辑</view>
          <view v-if="hasPermission('logistics.review.update')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-if="!loading && reviewList.length === 0" class="empty-state">
      <text class="empty-icon">💬</text>
      <text class="empty-text">暂无评价</text>
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.review.create')">立即添加</button>
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
import { reviewApi, logisticsActionApi } from '../../../src/api/logistics.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import { useUserStore } from '../../../src/store/user.js'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const searchKeyword = ref('')
const statusIndex = ref(0)
const statusOptions = ['全部状态', '待审核', '已通过', '已拒绝']
const statusReverseMap = { 1: 'pending', 2: 'approved', 3: 'rejected' }

const typeIndex = ref(0)
const typeOptions = ['全部类型', '文本', '视频', '案例']
const typeReverseMap = { 1: 'text', 2: 'video', 3: 'case_study' }

const reviewList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

const statusMap = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

function getStatusText(status) {
  return statusMap[status] || status
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
      params['filters[authorName][$contains]'] = searchKeyword.value
    }
    if (statusIndex.value > 0) {
      params['filters[status]'] = statusReverseMap[statusIndex.value]
    }
    if (typeIndex.value > 0) {
      params['filters[testimonialType]'] = typeReverseMap[typeIndex.value]
    }
    const { list, pagination: pg } = await reviewApi.list(params)
    reviewList.value = list
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

function handleTypeChange(e) {
  typeIndex.value = e.detail.value
  loadData(1)
}

function goCreate() {
  uni.navigateTo({ url: '/pages/logistics/review/edit' })
}

function goEdit(id) {
  uni.navigateTo({ url: `/pages/logistics/review/edit?documentId=${id}` })
}

async function handleDelete(item) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除评价「${item.authorName}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await reviewApi.delete(item.documentId)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadData(currentPage.value)
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

async function handleApprove(item) {
  uni.showModal({
    title: '确认通过',
    content: `确定通过「${item.authorName}」的评价吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await logisticsActionApi.reviewApprove(item.documentId)
          uni.showToast({ title: '已通过', icon: 'success' })
          loadData(currentPage.value)
        } catch (e) {
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
      }
    }
  })
}

async function handleReject(item) {
  uni.showModal({
    title: '拒绝评价',
    editable: true,
    placeholderText: '请输入拒绝原因',
    success: async (res) => {
      if (res.confirm) {
        try {
          await logisticsActionApi.reviewReject(item.documentId, res.content || '')
          uni.showToast({ title: '已拒绝', icon: 'success' })
          loadData(currentPage.value)
        } catch (e) {
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
      }
    }
  })
}

async function handleReply(item) {
  uni.showModal({
    title: '回复评价',
    editable: true,
    placeholderText: '请输入回复内容',
    success: async (res) => {
      if (res.confirm && res.content) {
        try {
          await logisticsActionApi.reviewReply(item.documentId, res.content)
          uni.showToast({ title: '已回复', icon: 'success' })
          loadData(currentPage.value)
        } catch (e) {
          uni.showToast({ title: '回复失败', icon: 'none' })
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
  margin-bottom: 20rpx;
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

.review-list { display: flex; flex-direction: column; gap: 20rpx; }
.review-card {
  background: #fff; border-radius: 12rpx; padding: 24rpx;
  display: flex; align-items: center;
}
.review-info { flex: 1; display: flex; flex-direction: column; }
.review-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.review-meta { flex: 1; }
.meta-item { font-size: 24rpx; color: #999; margin-right: 16rpx; }
.review-content {
  font-size: 26rpx; color: #666;
  margin-top: 12rpx; line-height: 1.5;
}
.review-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12rpx;
}
.review-status {
  padding: 4rpx 16rpx; border-radius: 4rpx;
  font-size: 22rpx; color: #fff;
}
.review-status.pending { background: #faad14; }
.review-status.approved { background: #07c160; }
.review-status.rejected { background: #ff4d4f; }
.review-date { font-size: 22rpx; color: #999; }

.review-actions { display: flex; flex-direction: column; gap: 12rpx; }
.action-btn {
  padding: 12rpx 24rpx; border-radius: 8rpx;
  font-size: 24rpx; text-align: center;
}
.action-btn.edit { background: #f5f5f5; color: #1989fa; }
.action-btn.delete { background: #fff0f0; color: #ff4d4f; }
.action-btn.approve { background: #e8f5e9; color: #07c160; }
.action-btn.reject { background: #fff0f0; color: #ff4d4f; }
.action-btn.reply { background: #e3f2fd; color: #1989fa; }

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
