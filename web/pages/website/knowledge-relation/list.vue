<template>
  <view class="page-container">
    <PageHeader title="知识关系">
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('knowledge-relation.create')">+ 新增关系</button>
    </PageHeader>

    <view class="item-list">
      <view v-for="item in itemList" :key="item.documentId" class="item-card">
        <view class="item-info">
          <view class="item-title">{{ item.subjectName || item.subject_id }} → {{ item.predicate }} → {{ item.objectName || item.object_id }}</view>
          <view class="item-footer">
            <view class="item-date">{{ formatDate(item.createdAt) }}</view>
          </view>
        </view>
        <view class="item-actions">
          <view v-if="hasPermission('knowledge-relation.update')" class="action-btn edit" @click="goEdit(item.documentId)">编辑</view>
          <view v-if="hasPermission('knowledge-relation.delete')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>
    <view v-if="!loading && itemList.length === 0" class="empty-state">
      <text class="empty-icon">🔗</text>
      <text class="empty-text">暂无关系</text>
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('knowledge-relation.create')">立即添加</button>
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
import { knowledgeGraphApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const itemList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)
const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = { 'pagination[page]': page, 'pagination[pageSize]': 10 }
    const { list, pagination: pg } = await knowledgeGraphApi.listRelations(params)
    itemList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
  finally { loading.value = false }
}

function goCreate() { uni.navigateTo({ url: '/pages/website/knowledge-relation/edit' }) }
function goEdit(id) { uni.navigateTo({ url: `/pages/website/knowledge-relation/edit?documentId=${id}` }) }

async function handleDelete(item) {
  uni.showModal({ title: '确认删除', content: '确定要删除此关系吗？', success: async (res) => {
    if (res.confirm) { try { await knowledgeGraphApi.deleteRelation(item.documentId); uni.showToast({ title: '删除成功', icon: 'success' }); loadData(currentPage.value) } catch (e) { uni.showToast({ title: '删除失败', icon: 'none' }) } }
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
.item-list { display: flex; flex-direction: column; gap: 20rpx; }
.item-card { background: #fff; border-radius: 12rpx; padding: 24rpx; display: flex; align-items: center; }
.item-info { flex: 1; display: flex; flex-direction: column; }
.item-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.item-footer { display: flex; justify-content: space-between; align-items: center; }
.item-date { font-size: 22rpx; color: #999; }
.item-actions { display: flex; flex-direction: column; gap: 12rpx; }
.action-btn { padding: 12rpx 24rpx; border-radius: 8rpx; font-size: 24rpx; text-align: center; }
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
