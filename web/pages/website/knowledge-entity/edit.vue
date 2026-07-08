<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑实体' : '新增实体'">
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission(isEdit ? 'knowledge-entity.update' : 'knowledge-entity.create')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        <view class="form-item"><text class="form-label">名称 *</text><input type="text" v-model="form.name" placeholder="实体名称" class="form-input" /></view>
        <view class="form-item">
          <text class="form-label">类型</text>
          <picker mode="selector" :range="typeOptions" @change="(e) => form.type = typeOptions[e.detail.value]">
            <view class="form-input picker-display">{{ form.type || '请选择' }}</view>
          </picker>
        </view>
        <view class="form-item"><text class="form-label">别名（逗号分隔）</text><input type="text" v-model="aliasesInput" placeholder="别名1,别名2" class="form-input" /></view>
        <view class="form-item"><text class="form-label">描述</text><textarea v-model="form.description" placeholder="实体描述" class="form-textarea" /></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { knowledgeGraphApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const typeOptions = ['concept', 'person', 'organization', 'product', 'location', 'event', 'other']
const documentId = ref('')
const isEdit = computed(() => !!documentId.value)
const aliasesInput = ref('')
const form = ref({ name: '', type: '', aliases: [], description: '' })

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await knowledgeGraphApi.listEntities({ 'filters[documentId]': documentId.value }).then(res => res.list?.[0]) || null
    if (item) {
      form.value = { name: item.name || '', type: item.type || '', aliases: item.aliases || [], description: item.description || '' }
      aliasesInput.value = Array.isArray(item.aliases) ? item.aliases.join(',') : (item.aliases || '')
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleSubmit() {
  if (!form.value.name) { uni.showToast({ title: '请填写名称', icon: 'none' }); return }
  const payload = { ...form.value, aliases: aliasesInput.value ? aliasesInput.value.split(',').map(s => s.trim()).filter(Boolean) : [] }
  try {
    if (isEdit.value) await knowledgeGraphApi.updateEntity(documentId.value, payload)
    else await knowledgeGraphApi.createEntity(payload)
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
.form-textarea { width: 100%; min-height: 160rpx; padding: 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
</style>
