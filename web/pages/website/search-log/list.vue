<template>
  <view class="page-container">
    <PageHeader title="搜索日志" />

    <view class="search-section">
      <view class="search-box">
        <input type="text" v-model="searchKeyword" placeholder="搜索关键词" @confirm="loadData(1)" class="search-input" />
        <text class="search-icon">🔍</text>
      </view>
    </view>

    <view class="item-list">
      <view v-for="item in itemList" :key="item.documentId" class="item-card">
        <view class="item-info">
          <view class="item-title">🔎 {{ item.keyword }}</view>
          <view class="item-meta">
            <text class="meta-item">结果数: {{ item.resultCount ?? 0 }}</text>
            <text class="meta-item">IP: {{ item.visitorIp || '-' }}</text>
          </view>
          <view class="item-footer">
            <view class="item-date">{{ formatDate(item.searchedAt || item.createdAt) }}</view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>
    <view v-if="!loading && itemList.length === 0" class="empty-state">
      <text class="empty-icon">🔎</text>
      <text class="empty-text">暂无搜索日志</text>
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
import { searchLogApi } from '../../../src/api/website.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const searchKeyword = ref('')
const itemList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)
const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = { 'pagination[page]': page, 'pagination[pageSize]': 10 }
    if (searchKeyword.value) params['filters[keyword][$contains]'] = searchKeyword.value
    const { list, pagination: pg } = await searchLogApi.list(params)
    itemList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
  finally { loading.value = false }
}

function prevPage() { if (currentPage.value > 1) loadData(currentPage.value - 1) }
function nextPage() { if (currentPage.value < totalPages.value) loadData(currentPage.value + 1) }
onShow(() => loadData(1))
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx; box-sizing: border-box; }
.search-section { background: #fff; padding: 20rpx; border-radius: 12rpx; margin-bottom: 20rpx; }
.search-box { display: flex; align-items: center; background: #f5f5f5; border-radius: 8rpx; padding: 0 20rpx; }
.search-input { flex: 1; height: 72rpx; font-size: 28rpx; }
.search-icon { font-size: 32rpx; }
.item-list { display: flex; flex-direction: column; gap: 20rpx; }
.item-card { background: #fff; border-radius: 12rpx; padding: 24rpx; }
.item-info { display: flex; flex-direction: column; }
.item-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.item-meta { flex: 1; }
.meta-item { font-size: 24rpx; color: #999; margin-right: 16rpx; }
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
