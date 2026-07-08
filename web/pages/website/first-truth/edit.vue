<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑真值' : '新增真值'">
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission(isEdit ? 'first-truth.update' : 'first-truth.create')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">真值信息</view>
        <view class="form-item"><text class="form-label">声明 *</text><textarea v-model="form.claim" placeholder="事实声明" class="form-textarea" /></view>
        <view class="form-item"><text class="form-label">真值 *</text><textarea v-model="form.truth_value" placeholder="事实真相" class="form-textarea" /></view>
        <view class="form-item"><text class="form-label">来源</text><input type="text" v-model="form.source" placeholder="来源引用" class="form-input" /></view>
        <view class="form-item">
          <text class="form-label">置信度（0-1）</text>
          <input type="digit" v-model="form.confidence" placeholder="例: 0.95" class="form-input" />
        </view>
        <view class="form-item">
          <text class="form-label">状态</text>
          <picker mode="selector" :range="statusOptions" :range-key="'label'" @change="(e) => form.status = statusOptions[e.detail.value].value">
            <view class="form-input picker-display">{{ getStatusText(form.status) }}</view>
          </picker>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { firstTruthApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const statusOptions = [
  { label: '待验证', value: 'pending' },
  { label: '已验证', value: 'verified' },
  { label: '冲突', value: 'conflict' },
]
const statusMap = { pending: '待验证', verified: '已验证', conflict: '冲突' }
function getStatusText(s) { return statusMap[s] || s }

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)
const form = ref({ claim: '', truth_value: '', source: '', confidence: 0, status: 'pending' })

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await firstTruthApi.detail(documentId.value)
    if (item) {
      form.value = {
        claim: item.claim || '', truth_value: item.truth_value || '',
        source: item.source || '', confidence: item.confidence ?? 0,
        status: item.status || 'pending',
      }
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleSubmit() {
  if (!form.value.claim || !form.value.truth_value) { uni.showToast({ title: '请填写完整', icon: 'none' }); return }
  try {
    const payload = { ...form.value, confidence: Number(form.value.confidence) || 0 }
    if (isEdit.value) await firstTruthApi.update(documentId.value, payload)
    else await firstTruthApi.create(payload)
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (e) { uni.showToast({ title: '保存失败', icon: 'none' }) }
}

onLoad((options) => { if (options?.documentId) { documentId.value = options.documentId; loadDetail() } })
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; display: flex; flex-direction: column; }
.form-scroll { flex: 1; padding: 20rpx; box-sizing: border-box; }
.btn-primary { background: #ff0000; color: #ffffff; padding: 16rpx 32rpx; font-size: 30rpx; border-radius: 8rpx; border: none; line-height: 1.2; }
.form-section { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 24rpx; padding-left: 8rpx; border-left: 6rpx solid #ff0000; }
.form-item { margin-bottom: 24rpx; }
.form-label { display: block; font-size: 26rpx; color: #666; margin-bottom: 12rpx; }
.form-input { width: 100%; height: 72rpx; padding: 0 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
.picker-display { display: flex; align-items: center; line-height: 72rpx; }
.form-textarea { width: 100%; min-height: 120rpx; padding: 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
</style>
