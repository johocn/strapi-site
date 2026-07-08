<template>
  <view class="page-container">
    <PageHeader title="AI 摘要" />

    <view class="filter-section">
      <view class="filter-row">
        <picker mode="selector" :range="targetTypeOptions" @change="handleTypeChange">
          <view class="filter-item"><text>{{ targetType || '全部类型' }}</text><text class="arrow">▼</text></view>
        </picker>
        <input type="text" v-model="targetIdFilter" placeholder="按 targetId 筛选" class="filter-input" @confirm="loadData(1)" />
      </view>
    </view>

    <view class="item-list">
      <view v-for="item in itemList" :key="item.documentId" class="item-card" @click="goDetail(item.documentId)">
        <view class="item-info">
          <view class="item-title">{{ item.summary?.slice(0, 80) || '(无摘要)' }}{{ item.summary?.length > 80 ? '...' : '' }}</view>
          <view class="item-meta">
            <text class="meta-item">📄 {{ item.targetType }}</text>
            <text class="meta-item">ID: {{ item.targetId }}</text>
            <text class="meta-item" v-if="item.status">状态: {{ item.status }}</text>
          </view>
          <view class="item-footer">
            <view class="item-date">{{ formatDate(item.createdAt) }}</view>
          </view>
        </view>
        <view class="item-actions">
          <view v-if="hasPermission('ai-summary.update')" class="action-btn regen" @click.stop="handleRegenerate(item)">重新生成</view>
          <view v-if="hasPermission('ai-summary.delete')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>
    <view v-if="!loading && itemList.length === 0" class="empty-state">
      <text class="empty-icon">✨</text>
      <text class="empty-text">暂无 AI 摘要</text>
    </view>

    <view class="pagination" v-if="pagination.total > pagination.pageSize">
      <view class="pagination-btn" @click="prevPage" :class="{ disabled: currentPage === 1 }">上一页</view>
      <text class="pagination-info">{{ currentPage }} / {{ totalPages }}</text>
      <view class="pagination-btn" @click="nextPage" :class="{ disabled: currentPage >= totalPages }">下一页</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { aiSummaryApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const targetTypeOptions = ['article', 'case', 'product', 'faq', 'tutorial', 'compliance']
const targetType = ref('')
const targetIdFilter = ref('')
const itemList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)
const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = { 'pagination[page]': page, 'pagination[pageSize]': 10 }
    if (targetType.value) params['filters[targetType]'] = targetType.value
    if (targetIdFilter.value) params['filters[targetId]'] = targetIdFilter.value
    const { list, pagination: pg } = await aiSummaryApi.list(params)
    itemList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
  finally { loading.value = false }
}

function handleTypeChange(e) {
  targetType.value = targetTypeOptions[e.detail.value] || ''
  loadData(1)
}
function goDetail(id) { uni.navigateTo({ url: `/pages/website/ai-summary/edit?documentId=${id}` }) }

async function handleRegenerate(item) {
  uni.showModal({ title: '确认重新生成', content: '将调用 AI 重新生成摘要，确定吗？', success: async (res) => {
    if (res.confirm) { try { await aiSummaryApi.regenerate(item.documentId); uni.showToast({ title: '已重新生成', icon: 'success' }); loadData(currentPage.value) } catch (e) { uni.showToast({ title: '生成失败', icon: 'none' }) } }
  }})
}
async function handleDelete(item) {
  uni.showModal({ title: '确认删除', content: '确定要删除此摘要吗？', success: async (res) => {
    if (res.confirm) { try { await aiSummaryApi.delete(item.documentId); uni.showToast({ title: '删除成功', icon: 'success' }); loadData(currentPage.value) } catch (e) { uni.showToast({ title: '删除失败', icon: 'none' }) } }
  }})
}

function prevPage() { if (currentPage.value > 1) loadData(currentPage.value - 1) }
function nextPage() { if (currentPage.value < totalPages.value) loadData(currentPage.value + 1) }
onShow(() => loadData(1))
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx; box-sizing: border-box; }
.filter-section { background: #fff; padding: 20rpx; border-radius: 12rpx; margin-bottom: 20rpx; }
.filter-row { display: flex; gap: 20rpx; align-items: center; }
.filter-item { display: flex; align-items: center; gap: 8rpx; padding: 12rpx 24rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 26rpx; }
.filter-input { flex: 1; height: 64rpx; padding: 0 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 26rpx; }
.arrow { font-size: 20rpx; color: #999; }
.item-list { display: flex; flex-direction: column; gap: 20rpx; }
.item-card { background: #fff; border-radius: 12rpx; padding: 24rpx; display: flex; align-items: center; }
.item-info { flex: 1; display: flex; flex-direction: column; }
.item-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.item-meta { flex: 1; }
.meta-item { font-size: 24rpx; color: #999; margin-right: 16rpx; }
.item-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.item-date { font-size: 22rpx; color: #999; }
.item-actions { display: flex; flex-direction: column; gap: 12rpx; }
.action-btn { padding: 12rpx 24rpx; border-radius: 8rpx; font-size: 24rpx; text-align: center; }
.action-btn.regen { background: #e8f5e9; color: #07c160; }
.action-btn.delete { background: #fff0f0; color: #ff4d4f; }
.loading, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #999; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 40rpx; padding: 40rpx 0; }
.pagination-btn { padding: 16rpx 32rpx; background: #fff; border-radius: 8rpx; font-size: 28rpx; }
.pagination-btn.disabled { color: #999; background: #f5f5f5; }
.pagination-info { font-size: 28rpx; color: #666; }
</style>
