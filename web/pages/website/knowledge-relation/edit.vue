<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑关系' : '新增关系'">
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission(isEdit ? 'knowledge-relation.update' : 'knowledge-relation.create')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">关系信息</view>
        <view class="form-item"><text class="form-label">主体 ID *</text><input type="text" v-model="form.subject_id" placeholder="主体实体 ID" class="form-input" /></view>
        <view class="form-item"><text class="form-label">谓词 *</text><input type="text" v-model="form.predicate" placeholder="例: belongs_to, related_to" class="form-input" /></view>
        <view class="form-item"><text class="form-label">客体 ID *</text><input type="text" v-model="form.object_id" placeholder="客体实体 ID" class="form-input" /></view>
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

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)
const form = ref({ subject_id: '', predicate: '', object_id: '' })

async function loadDetail() {
  if (!documentId.value) return
  try {
    const res = await knowledgeGraphApi.listRelations({ 'filters[documentId]': documentId.value })
    const item = res.list?.[0]
    if (item) {
      form.value = { subject_id: item.subject_id || '', predicate: item.predicate || '', object_id: item.object_id || '' }
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleSubmit() {
  if (!form.value.subject_id || !form.value.predicate || !form.value.object_id) {
    uni.showToast({ title: '请填写完整', icon: 'none' }); return
  }
  try {
    if (isEdit.value) await knowledgeGraphApi.updateRelation(documentId.value, form.value)
    else await knowledgeGraphApi.addRelation(form.value)
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
</style>
