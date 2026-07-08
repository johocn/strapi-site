<template>
  <view class="page-container">
    <PageHeader title="互动记录" />

    <view class="filter-section">
      <view class="filter-row">
        <picker mode="selector" :range="typeOptions" @change="handleTypeChange">
          <view class="filter-item"><text>{{ type || '全部类型' }}</text><text class="arrow">▼</text></view>
        </picker>
      </view>
    </view>

    <view class="item-list">
      <view v-for="item in itemList" :key="item.documentId" class="item-card">
        <view class="item-info">
          <view class="item-title">💬 {{ item.type || '互动' }}</view>
          <view class="item-meta">
            <text class="meta-item">目标: {{ item.targetType }}#{{ item.targetId }}</text>
          </view>
          <view class="item-content" v-if="item.content">{{ item.content }}</view>
          <view class="item-footer">
            <view class="item-date">{{ formatDate(item.createdAt) }}</view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>
    <view v-if="!loading && itemList.length === 0" class="empty-state">
      <text class="empty-icon">💬</text>
      <text class="empty-text">暂无互动记录</text>
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
import { interactionApi } from '../../../src/api/website.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const typeOptions = ['like', 'comment', 'share', 'favorite', 'view']
const type = ref('')
const itemList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)
const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = { 'pagination[page]': page, 'pagination[pageSize]': 10 }
    if (type.value) params['filters[type]'] = type.value
    const { list, pagination: pg } = await interactionApi.list(params)
    itemList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
  finally { loading.value = false }
}

function handleTypeChange(e) { type.value = typeOptions[e.detail.value] || ''; loadData(1) }

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
.arrow { font-size: 20rpx; color: #999; }
.item-list { display: flex; flex-direction: column; gap: 20rpx; }
.item-card { background: #fff; border-radius: 12rpx; padding: 24rpx; }
.item-info { display: flex; flex-direction: column; }
.item-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.item-meta { flex: 1; }
.meta-item { font-size: 24rpx; color: #999; margin-right: 16rpx; }
.item-content { font-size: 26rpx; color: #666; background: #f9f9f9; padding: 12rpx; border-radius: 8rpx; margin-top: 12rpx; }
.item-footer { display: flex; justify-content: flex-end; align-items: center; margin-top: 12rpx; }
.item-date { font-size: 22rpx; color: #999; }
.loading, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #999; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 40rpx; padding: 40rpx 0; }
.pagination-btn { padding: 16rpx 32rpx; background: #fff; border-radius: 8rpx; font-size: 28rpx; }
.pagination-btn.disabled { color: #999; background: #f5f5f5; }
.pagination-info { font-size: 28rpx; color: #666; }
</style>
