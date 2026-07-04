<template>
  <view class="page-container">
    <PageHeader title="知识点管理">
      <button class="btn-primary" @click="goAdd" v-if="hasPermission('menu.knowledge')">+ 新增知识点</button>
    </PageHeader>

    <view class="search-section">
      <view class="search-box">
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="搜索知识点名称"
          @confirm="loadData"
          class="search-input"
        />
        <text class="search-icon">🔍</text>
      </view>
    </view>

    <view class="knowledge-list">
      <view 
        v-for="item in knowledgeList" 
        :key="item.documentId" 
        class="knowledge-card"
      >
        <view class="knowledge-info">
          <view class="knowledge-name">{{ item.name }}</view>
          <view class="knowledge-meta">
            <text class="meta-item">分组: {{ item.tagGroup?.name || '-' }}</text>
            <text class="meta-item">排序: {{ item.sort }}</text>
            <text class="meta-item">使用次数: {{ item.usageCount }}</text>
          </view>
          <view v-if="item.description" class="knowledge-desc">{{ item.description }}</view>
        </view>
        <view class="knowledge-actions">
          <view class="action-btn edit" @click="goEdit(item.documentId)" v-if="hasPermission('menu.knowledge')">编辑</view>
          <view class="action-btn delete" @click="handleDelete(item)" v-if="hasPermission('menu.knowledge')">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-if="!loading && knowledgeList.length === 0" class="empty-state">
      <text class="empty-icon">📚</text>
      <text class="empty-text">暂无知识点</text>
      <button class="btn-primary" @click="goAdd" v-if="hasPermission('menu.knowledge')">立即添加</button>
    </view>

    <view class="pagination" v-if="pagination.total > pagination.pageSize">
      <view class="pagination-btn" @click="prevPage" :class="{ disabled: currentPage === 1 }">上一页</view>
      <text class="pagination-info">{{ currentPage }} / {{ totalPages }}</text>
      <view class="pagination-btn" @click="nextPage" :class="{ disabled: currentPage >= totalPages }">下一页</view>
    </view>

    <view class="fab-btn" @click="goAdd" v-if="hasPermission('menu.knowledge')">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import PageHeader from '../../src/components/PageHeader.vue'
import { getTagList, deleteTag } from '../../src/api/tag.js'
import { useUserStore } from '../../src/store/user.js'

const searchKeyword = ref('')
const userStore = useUserStore()
const hasPermission = userStore.hasPermission
const knowledgeList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.pageSize))

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = {
      page: page,
      pageSize: 10,
      'filters[tagGroup][slug][$eq]': 'knowledge-point'
    }
    if (searchKeyword.value) {
      params['filters[name][$containsi]'] = searchKeyword.value
    }
    const { list, pagination: pg } = await getTagList(params)
    knowledgeList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goAdd() {
  uni.navigateTo({ url: '/pages/tag/knowledge-form' })
}

function goEdit(id) {
  uni.navigateTo({ url: `/pages/tag/knowledge-form?id=${id}` })
}

async function handleDelete(item) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除知识点「${item.name}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteTag(item.documentId)
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
  if (currentPage.value > 1) {
    loadData(currentPage.value - 1)
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    loadData(currentPage.value + 1)
  }
}

onMounted(() => {
  loadData(1)
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  box-sizing: border-box;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 15rpx 30rpx;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
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
}

.search-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
}

.search-icon {
  font-size: 32rpx;
}

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.knowledge-card {
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  display: flex;
  padding: 20rpx;
  align-items: center;
}

.knowledge-info {
  flex: 1;
  padding-right: 20rpx;
}

.knowledge-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 12rpx;
}

.knowledge-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 12rpx;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.knowledge-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #999;
}

.knowledge-actions {
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

.action-btn.edit {
  background: #f0f0f0;
  color: #1989fa;
}

.action-btn.delete {
  background: #fff0f0;
  color: #ff4d4f;
}

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

.fab-btn {
  position: fixed;
  right: 40rpx;
  bottom: 120rpx;
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 999;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
}

.fab-icon {
  font-size: 48rpx;
  line-height: 1;
}
</style>
