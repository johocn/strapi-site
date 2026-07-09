<template>
  <view class="page-container">
    <PageHeader title="营销落地页">
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.landing-page.create')">+ 新建落地页</button>
    </PageHeader>

    <view class="search-section">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索落地页标题"
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
        <picker mode="selector" :range="goalOptions" @change="handleGoalChange">
          <view class="filter-item">
            <text>{{ goalOptions[goalIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="lp-list">
      <view
        v-for="item in lpList"
        :key="item.documentId"
        class="lp-card"
        @click="goEdit(item.documentId)"
      >
        <view class="lp-info">
          <view class="lp-title">{{ item.title }}</view>
          <view class="lp-meta">
            <text class="meta-item" v-if="item.campaignName">🎯 {{ item.campaignName }}</text>
            <text class="meta-item" v-if="item.slug">🔗 {{ item.slug }}</text>
            <text class="meta-item">📣 {{ goalText(item.conversionGoal) }}</text>
          </view>
          <view class="lp-footer">
            <view class="lp-status" :class="item.status">{{ statusText(item.status) }}</view>
            <view class="lp-state">
              <text class="state-tag" :class="{ on: item.isActive, off: !item.isActive }">
                {{ item.isActive ? '已上线' : '未上线' }}
              </text>
              <text class="lp-date">{{ formatDate(item.publishedAt || item.createdAt) }}</text>
            </view>
          </view>
        </view>
        <view class="lp-actions">
          <view v-if="hasPermission('logistics.landing-page.update')" class="action-btn edit" @click.stop="goEdit(item.documentId)">编辑</view>
          <view v-if="hasPermission('logistics.landing-page.update')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>

    <view v-if="!loading && lpList.length === 0" class="empty-state">
      <text class="empty-icon">🚀</text>
      <text class="empty-text">暂无落地页</text>
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.landing-page.create')">立即创建</button>
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
import { landingPageApi } from '../../../src/api/logistics.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import { useUserStore } from '../../../src/store/user.js'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const searchKeyword = ref('')
const statusIndex = ref(0)
const statusOptions = ['全部状态', '草稿', '已发布', '已下架']
const statusValues = ['', 'draft', 'published', 'archived']

const goalIndex = ref(0)
const goalOptions = ['全部目标', '报价提交', '联系点击', '电话拨打', '下载']
const goalValues = ['', 'quote_submit', 'contact_click', 'phone_call', 'download']

const lpList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

function statusText(v) {
  const m = { draft: '草稿', published: '已发布', archived: '已下架' }
  return m[v] || v || '-'
}
function goalText(v) {
  const i = goalValues.indexOf(v)
  return i > 0 ? goalOptions[i] : v || '-'
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
      params['filters[title][$contains]'] = searchKeyword.value
    }
    if (statusIndex.value > 0) {
      params['filters[status]'] = statusValues[statusIndex.value]
    }
    if (goalIndex.value > 0) {
      params['filters[conversionGoal]'] = goalValues[goalIndex.value]
    }
    const { list, pagination: pg } = await landingPageApi.list(params)
    lpList.value = list
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
function handleGoalChange(e) {
  goalIndex.value = e.detail.value
  loadData(1)
}

function goCreate() {
  uni.navigateTo({ url: '/pages/logistics/landing-page/edit' })
}
function goEdit(id) {
  uni.navigateTo({ url: `/pages/logistics/landing-page/edit?documentId=${id}` })
}

async function handleDelete(item) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除落地页「${item.title}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await landingPageApi.delete(item.documentId)
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

.lp-list { display: flex; flex-direction: column; gap: 20rpx; }
.lp-card {
  background: #fff; border-radius: 12rpx; padding: 24rpx;
  display: flex; align-items: center;
}
.lp-info { flex: 1; display: flex; flex-direction: column; }
.lp-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.lp-meta { flex: 1; }
.meta-item { font-size: 24rpx; color: #999; margin-right: 16rpx; }
.lp-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12rpx;
}
.lp-status {
  padding: 4rpx 16rpx; border-radius: 4rpx;
  font-size: 22rpx; color: #fff;
}
.lp-status.draft { background: #999; }
.lp-status.published { background: #07c160; }
.lp-status.archived { background: #666; }
.lp-state {
  display: flex; align-items: center; gap: 16rpx;
}
.state-tag {
  padding: 2rpx 12rpx; border-radius: 4rpx; font-size: 22rpx;
}
.state-tag.on { background: #e8f5e9; color: #07c160; }
.state-tag.off { background: #f5f5f5; color: #999; }
.lp-date { font-size: 22rpx; color: #999; }

.lp-actions { display: flex; flex-direction: column; gap: 12rpx; }
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
