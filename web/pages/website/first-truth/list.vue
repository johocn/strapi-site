<template>
  <view class="page-container">
    <PageHeader title="第一真值">
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('first-truth.create')">+ 新增真值</button>
    </PageHeader>

    <view class="filter-section">
      <view class="tab-row">
        <view class="tab-item" :class="{ active: tab === 'all' }" @click="switchTab('all')">全部</view>
        <view class="tab-item" :class="{ active: tab === 'conflicts' }" @click="switchTab('conflicts')">冲突</view>
      </view>
    </view>

    <view class="item-list">
      <view v-for="item in itemList" :key="item.documentId" class="item-card" @click="goEdit(item.documentId)">
        <view class="item-info">
          <view class="item-title">{{ item.claim }}</view>
          <view class="item-meta">
            <text class="meta-item">💎 {{ item.truth_value }}</text>
            <text class="meta-item" v-if="item.confidence != null">置信度: {{ (item.confidence * 100).toFixed(0) }}%</text>
            <text class="meta-item" v-if="item.source">来源: {{ item.source }}</text>
          </view>
          <view class="item-footer">
            <view class="item-status" :class="item.status">{{ getStatusText(item.status) }}</view>
            <view class="item-date">{{ formatDate(item.createdAt) }}</view>
          </view>
        </view>
        <view class="item-actions">
          <view v-if="item.status !== 'verified' && hasPermission('first-truth.update')" class="action-btn verify" @click.stop="handleVerify(item)">验证</view>
          <view v-if="hasPermission('first-truth.update')" class="action-btn edit" @click.stop="goEdit(item.documentId)">编辑</view>
          <view v-if="hasPermission('first-truth.delete')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>
    <view v-if="!loading && itemList.length === 0" class="empty-state">
      <text class="empty-icon">💎</text>
      <text class="empty-text">暂无真值</text>
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('first-truth.create')">立即添加</button>
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
import { firstTruthApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const tab = ref('all')
const itemList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)
const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

const statusMap = { verified: '已验证', pending: '待验证', conflict: '冲突' }
function getStatusText(s) { return statusMap[s] || s }

async function loadData(page = 1) {
  loading.value = true
  try {
    if (tab.value === 'conflicts') {
      const list = await firstTruthApi.conflicts()
      itemList.value = list || []
      pagination.value = { page: 1, pageSize: 10, total: list?.length || 0 }
      currentPage.value = 1
    } else {
      const params = { 'pagination[page]': page, 'pagination[pageSize]': 10 }
      const { list, pagination: pg } = await firstTruthApi.list(params)
      itemList.value = list
      pagination.value = pg
      currentPage.value = page
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
  finally { loading.value = false }
}

function switchTab(t) { tab.value = t; loadData(1) }
function goCreate() { uni.navigateTo({ url: '/pages/website/first-truth/edit' }) }
function goEdit(id) { uni.navigateTo({ url: `/pages/website/first-truth/edit?documentId=${id}` }) }

async function handleVerify(item) {
  uni.showModal({ title: '确认验证', content: `确定要将「${item.claim}」标记为已验证吗？`, success: async (res) => {
    if (res.confirm) { try { await firstTruthApi.verify(item.documentId); uni.showToast({ title: '验证成功', icon: 'success' }); loadData(currentPage.value) } catch (e) { uni.showToast({ title: '验证失败', icon: 'none' }) } }
  }})
}
async function handleDelete(item) {
  uni.showModal({ title: '确认删除', content: `确定要删除「${item.claim}」吗？`, success: async (res) => {
    if (res.confirm) { try { await firstTruthApi.delete(item.documentId); uni.showToast({ title: '删除成功', icon: 'success' }); loadData(currentPage.value) } catch (e) { uni.showToast({ title: '删除失败', icon: 'none' }) } }
  }})
}

function prevPage() { if (currentPage.value > 1) loadData(currentPage.value - 1) }
function nextPage() { if (currentPage.value < totalPages.value) loadData(currentPage.value + 1) }
onShow(() => loadData(1))
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx; box-sizing: border-box; }
.btn-primary { background: #ff0000; color: #ffffff; padding: 16rpx 32rpx; font-size: 30rpx; border-radius: 8rpx; border: none; line-height: 1.2; }
.filter-section { background: #fff; padding: 20rpx; border-radius: 12rpx; margin-bottom: 20rpx; }
.tab-row { display: flex; gap: 20rpx; }
.tab-item { padding: 12rpx 32rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 26rpx; }
.tab-item.active { background: #ff0000; color: #fff; }
.item-list { display: flex; flex-direction: column; gap: 20rpx; }
.item-card { background: #fff; border-radius: 12rpx; padding: 24rpx; display: flex; align-items: center; }
.item-info { flex: 1; display: flex; flex-direction: column; }
.item-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.item-meta { flex: 1; }
.meta-item { font-size: 24rpx; color: #999; margin-right: 16rpx; }
.item-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.item-status { padding: 4rpx 16rpx; border-radius: 4rpx; font-size: 22rpx; color: #fff; background: #999; }
.item-status.verified { background: #07c160; }
.item-status.pending { background: #faad14; }
.item-status.conflict { background: #ff4d4f; }
.item-date { font-size: 22rpx; color: #999; }
.item-actions { display: flex; flex-direction: column; gap: 12rpx; }
.action-btn { padding: 12rpx 24rpx; border-radius: 8rpx; font-size: 24rpx; text-align: center; }
.action-btn.verify { background: #e8f5e9; color: #07c160; }
.action-btn.edit { background: #f5f5f5; color: #1989fa; }
.action-btn.delete { background: #fff0f0; color: #ff4d4f; }
.loading, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-bottom: 20rpx; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 40rpx; padding: 40rpx 0; }
.pagination-btn { padding: 16rpx 32rpx; background: #fff; border-radius: 8rpx; font-size: 28rpx; }
.pagination-btn.disabled { color: #999; background: #f5f5f5; }
.pagination-info { font-size: 28rpx; color: #666; }
</style>
