<template>
  <view class="page-container">
    <PageHeader title="转化漏斗">
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.conversion-funnel.create')">+ 新建漏斗</button>
    </PageHeader>

    <view class="search-section">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索漏斗名称"
          @confirm="loadData(1)"
          class="search-input"
        />
        <text class="search-icon">🔍</text>
      </view>
      <view class="filter-row">
        <picker mode="selector" :range="stateOptions" @change="handleStateChange">
          <view class="filter-item">
            <text>{{ stateOptions[stateIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="funnel-list">
      <view
        v-for="item in funnelList"
        :key="item.documentId"
        class="funnel-card"
        @click="goEdit(item.documentId)"
      >
        <view class="funnel-info">
          <view class="funnel-title">{{ item.name }}</view>
          <view class="funnel-meta">
            <text class="meta-item" v-if="item.lang">🌐 {{ item.lang }}</text>
            <text class="meta-item">📊 步骤数：{{ stepCount(item.steps) }}</text>
          </view>
          <view class="funnel-footer">
            <view class="funnel-state" :class="{ on: item.isActive, off: !item.isActive }">
              {{ item.isActive ? '启用' : '停用' }}
            </view>
            <view class="funnel-date">{{ formatDate(item.createdAt) }}</view>
          </view>
        </view>
        <view class="funnel-actions">
          <view v-if="hasPermission('logistics.conversion-funnel.read')" class="action-btn stats" @click.stop="handleStats(item)">统计</view>
          <view v-if="hasPermission('logistics.conversion-funnel.update')" class="action-btn edit" @click.stop="goEdit(item.documentId)">编辑</view>
          <view v-if="hasPermission('logistics.conversion-funnel.update')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>

    <view v-if="!loading && funnelList.length === 0" class="empty-state">
      <text class="empty-icon">📉</text>
      <text class="empty-text">暂无漏斗</text>
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.conversion-funnel.create')">立即创建</button>
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
import { conversionFunnelApi, logisticsActionApi } from '../../../src/api/logistics.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import { useUserStore } from '../../../src/store/user.js'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const searchKeyword = ref('')
const stateIndex = ref(0)
const stateOptions = ['全部状态', '启用', '停用']
const stateValues = ['', true, false]

const funnelList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

function stepCount(steps) {
  if (!steps) return 0
  if (Array.isArray(steps)) return steps.length
  if (typeof steps === 'string') {
    try {
      const parsed = JSON.parse(steps)
      return Array.isArray(parsed) ? parsed.length : 0
    } catch (e) { return 0 }
  }
  return 0
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
      params['filters[name][$contains]'] = searchKeyword.value
    }
    if (stateIndex.value > 0) {
      params['filters[isActive]'] = stateValues[stateIndex.value]
    }
    const { list, pagination: pg } = await conversionFunnelApi.list(params)
    funnelList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function handleStateChange(e) {
  stateIndex.value = e.detail.value
  loadData(1)
}

function goCreate() {
  uni.navigateTo({ url: '/pages/logistics/conversion-funnel/edit' })
}
function goEdit(id) {
  uni.navigateTo({ url: `/pages/logistics/conversion-funnel/edit?documentId=${id}` })
}

async function handleDelete(item) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除漏斗「${item.name}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await conversionFunnelApi.delete(item.documentId)
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

async function handleStats(item) {
  try {
    const stats = await logisticsActionApi.funnelStats({ funnelId: item.documentId })
    const lines = []
    if (stats && typeof stats === 'object') {
      Object.keys(stats).forEach(k => {
        lines.push(`${k}: ${stats[k]}`)
      })
    }
    uni.showModal({
      title: `漏斗统计 - ${item.name}`,
      content: lines.length ? lines.join('\n') : '暂无统计数据',
      showCancel: false
    })
  } catch (e) {
    uni.showToast({ title: '统计加载失败', icon: 'none' })
  }
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

.funnel-list { display: flex; flex-direction: column; gap: 20rpx; }
.funnel-card {
  background: #fff; border-radius: 12rpx; padding: 24rpx;
  display: flex; align-items: center;
}
.funnel-info { flex: 1; display: flex; flex-direction: column; }
.funnel-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.funnel-meta { flex: 1; }
.meta-item { font-size: 24rpx; color: #999; margin-right: 16rpx; }
.funnel-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12rpx;
}
.funnel-state {
  padding: 4rpx 16rpx; border-radius: 4rpx;
  font-size: 22rpx; color: #fff;
}
.funnel-state.on { background: #07c160; }
.funnel-state.off { background: #999; }
.funnel-date { font-size: 22rpx; color: #999; }

.funnel-actions { display: flex; flex-direction: column; gap: 12rpx; }
.action-btn {
  padding: 12rpx 24rpx; border-radius: 8rpx;
  font-size: 24rpx; text-align: center;
}
.action-btn.edit { background: #f5f5f5; color: #1989fa; }
.action-btn.delete { background: #fff0f0; color: #ff4d4f; }
.action-btn.stats { background: #e3f2fd; color: #1989fa; }

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
