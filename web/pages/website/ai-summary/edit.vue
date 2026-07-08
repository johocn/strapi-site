<template>
  <view class="page-container">
    <PageHeader title="摘要详情">
      <button class="btn-secondary" v-if="hasPermission('ai-summary.update')" @click="handleRegenerate">重新生成</button>
      <button class="btn-primary" v-if="hasPermission('ai-summary.delete')" @click="handleDelete">删除</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">摘要信息</view>
        <view class="form-item"><text class="form-label">目标类型</text><view class="form-value">{{ form.targetType || '-' }}</view></view>
        <view class="form-item"><text class="form-label">目标 ID</text><view class="form-value">{{ form.targetId || '-' }}</view></view>
        <view class="form-item"><text class="form-label">状态</text><view class="form-value">{{ form.status || '-' }}</view></view>
      </view>
      <view class="form-section">
        <view class="section-title">摘要内容</view>
        <view class="form-item"><text class="form-label">摘要</text><view class="form-value">{{ form.summary || '(空)' }}</view></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { aiSummaryApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const form = ref({ targetType: '', targetId: '', summary: '', status: '' })

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await aiSummaryApi.detail(documentId.value)
    if (item) {
      form.value = {
        targetType: item.targetType || '', targetId: item.targetId || '',
        summary: item.summary || '', status: item.status || '',
      }
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleRegenerate() {
  uni.showModal({ title: '确认重新生成', content: '将调用 AI 重新生成摘要，确定吗？', success: async (res) => {
    if (res.confirm) { try { await aiSummaryApi.regenerate(documentId.value); uni.showToast({ title: '已重新生成', icon: 'success' }); loadDetail() } catch (e) { uni.showToast({ title: '生成失败', icon: 'none' }) } }
  }})
}
async function handleDelete() {
  uni.showModal({ title: '确认删除', content: '确定要删除此摘要吗？', success: async (res) => {
    if (res.confirm) { try { await aiSummaryApi.delete(documentId.value); uni.showToast({ title: '删除成功', icon: 'success' }); setTimeout(() => uni.navigateBack(), 600) } catch (e) { uni.showToast({ title: '删除失败', icon: 'none' }) } }
  }})
}

onLoad((options) => { if (options?.documentId) { documentId.value = options.documentId; loadDetail() } })
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; display: flex; flex-direction: column; }
.form-scroll { flex: 1; padding: 20rpx; box-sizing: border-box; }
.btn-primary { background: #ff0000; color: #ffffff; padding: 16rpx 32rpx; font-size: 30rpx; border-radius: 8rpx; border: none; line-height: 1.2; margin-left: 12rpx; }
.btn-secondary { background: #f5f5f5; color: #333; padding: 16rpx 32rpx; font-size: 30rpx; border-radius: 8rpx; border: none; line-height: 1.2; }
.form-section { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 24rpx; padding-left: 8rpx; border-left: 6rpx solid #ff0000; }
.form-item { margin-bottom: 24rpx; }
.form-label { display: block; font-size: 26rpx; color: #666; margin-bottom: 12rpx; }
.form-value { font-size: 28rpx; color: #333; padding: 16rpx; background: #f9f9f9; border-radius: 8rpx; min-height: 40rpx; }
</style>
