<template>
  <view class="page-container">
    <PageHeader title="追踪节点">
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.tracking-node.create')">+ 新增</button>
    </PageHeader>

    <view class="search-section">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索节点描述/位置"
          @confirm="loadData"
          class="search-input"
        />
        <text class="search-icon">🔍</text>
      </view>
      <view class="filter-row">
        <picker mode="selector" :range="nodeTypeOptions" @change="handleNodeTypeChange">
          <view class="filter-item">
            <text>{{ nodeTypeOptions[nodeTypeIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="data-list">
      <view
        v-for="item in dataList"
        :key="item.documentId"
        class="data-card"
        @click="goEdit(item.documentId)"
      >
        <view class="data-info">
          <view class="data-title">{{ item.description }}</view>
          <view class="data-meta">
            <text class="meta-item" v-if="item.location">📍 {{ item.location }}</text>
            <text class="meta-item" v-if="item.eventTime">🕐 {{ item.eventTime.substring(0, 16).replace('T', ' ') }}</text>
          </view>
          <view class="data-footer">
            <view class="data-status" :class="item.nodeStatus">{{ getNodeStatusText(item.nodeStatus) }}</view>
            <view class="data-date">{{ getNodeTypeText(item.nodeType) }} · {{ getDataSourceText(item.dataSource) }}</view>
          </view>
        </view>
        <view class="data-actions">
          <view v-if="hasPermission('logistics.tracking-node.update')" class="action-btn edit" @click.stop="goEdit(item.documentId)">编辑</view>
          <view v-if="hasPermission('logistics.tracking-node.update')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-if="!loading && dataList.length === 0" class="empty-state">
      <text class="empty-icon">📍</text>
      <text class="empty-text">暂无追踪节点</text>
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
import { trackingNodeApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const searchKeyword = ref('')
const nodeTypeIndex = ref(0)
const nodeTypeOptions = ['全部类型', '已揽收', '出口', '进口', '清关', '滞留', '派送', '已签收', '异常']
const nodeTypeReverseMap = { 1: 'picked_up', 2: 'export', 3: 'import', 4: 'customs', 5: 'hold', 6: 'delivery', 7: 'delivered', 8: 'exception' }

const dataList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

const nodeStatusMap = {
  done: '已完成',
  active: '进行中',
  pending: '待处理',
  alert: '异常'
}

const nodeTypeMap = {
  picked_up: '已揽收',
  export: '出口',
  import: '进口',
  customs: '清关',
  hold: '滞留',
  delivery: '派送',
  delivered: '已签收',
  exception: '异常'
}

const dataSourceMap = {
  internal: '内部',
  external: '外部'
}

function getNodeStatusText(status) {
  return nodeStatusMap[status] || status
}

function getNodeTypeText(type) {
  return nodeTypeMap[type] || type
}

function getDataSourceText(source) {
  return dataSourceMap[source] || source
}

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = {
      'pagination[page]': page,
      'pagination[pageSize]': 10
    }
    if (searchKeyword.value) {
      params['filters[$or][0][description][$contains]'] = searchKeyword.value
      params['filters[$or][1][location][$contains]'] = searchKeyword.value
    }
    if (nodeTypeIndex.value > 0) {
      params['filters[nodeType]'] = nodeTypeReverseMap[nodeTypeIndex.value]
    }
    const { list, pagination: pg } = await trackingNodeApi.list(params)
    dataList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function handleNodeTypeChange(e) {
  nodeTypeIndex.value = e.detail.value
  loadData(1)
}

function goCreate() {
  uni.navigateTo({ url: '/pages/logistics/tracking-node/edit' })
}

function goEdit(id) {
  uni.navigateTo({ url: `/pages/logistics/tracking-node/edit?documentId=${id}` })
}

async function handleDelete(item) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除节点「${item.description}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await trackingNodeApi.delete(item.documentId)
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

const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

onShow(() => {
  loadData(1)
})
</script>

<style scoped>
page {
  background: #f5f5f5;
}
.page-container {
  min-height: 100vh;
  padding: 20rpx;
  box-sizing: border-box;
}

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

.search-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
}

.search-icon {
  font-size: 32rpx;
}

.filter-row {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.arrow {
  font-size: 20rpx;
  color: #999;
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.data-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
}

.data-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.data-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.data-meta {
  flex: 1;
}

.meta-item {
  font-size: 24rpx;
  color: #999;
  margin-right: 16rpx;
}

.data-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
}

.data-status {
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
  color: #fff;
}

.data-status.done { background: #07c160; }
.data-status.active { background: #1989fa; }
.data-status.pending { background: #999; }
.data-status.alert { background: #ff4d4f; }

.data-date {
  font-size: 22rpx;
  color: #999;
}

.data-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  text-align: center;
}

.action-btn.edit { background: #f5f5f5; color: #1989fa; }
.action-btn.delete { background: #fff0f0; color: #ff4d4f; }

.loading, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40rpx;
  padding: 40rpx 0;
}

.pagination-btn {
  padding: 16rpx 32rpx;
  background: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.pagination-btn.disabled {
  color: #999;
  background: #f5f5f5;
}

.pagination-info {
  font-size: 28rpx;
  color: #666;
}
</style>
