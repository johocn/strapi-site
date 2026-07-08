<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑下载' : '新增下载'">
      <button class="btn-secondary" @click="handleSubmit('draft')" v-if="hasPermission('download.update')">存草稿</button>
      <button class="btn-primary" @click="handleSubmit('published')" v-if="hasPermission('download.publish')">发布</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        <view class="form-item"><text class="form-label">名称 *</text><input type="text" v-model="form.name" placeholder="下载名称" class="form-input" /></view>
        <view class="form-item"><text class="form-label">描述</text><textarea v-model="form.description" placeholder="文件描述" class="form-textarea" /></view>
        <view class="form-item"><text class="form-label">文件 URL *</text><input type="text" v-model="form.file" placeholder="文件下载地址" class="form-input" /></view>
        <view class="form-item">
          <text class="form-label">文件类型</text>
          <picker mode="selector" :range="fileTypeOptions" :range-key="'label'" @change="(e) => form.fileType = fileTypeOptions[e.detail.value].value">
            <view class="form-input picker-display">{{ getFileTypeText(form.fileType) }}</view>
          </picker>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">下载设置</view>
        <view class="form-item"><text class="form-label">排序（数字越小越靠前）</text><input type="number" v-model="form.order" placeholder="0" class="form-input" /></view>
        <view class="form-item form-row">
          <text class="form-label">需要线索（用户下载前需提交联系信息）</text>
          <switch :checked="form.requireLead" @change="form.requireLead = !form.requireLead" />
        </view>
        <view class="form-item form-row">
          <text class="form-label">推荐</text>
          <switch :checked="form.isFeatured" @change="form.isFeatured = !form.isFeatured" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">标签</view>
        <view class="form-item">
          <text class="form-label">标签</text>
          <TagSelector v-model="form.tags" :siteId="siteId" label="标签" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { downloadApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import TagSelector from '../../../src/components/TagSelector.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission
const siteId = computed(() => userStore.currentSite?.documentId || '')

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const fileTypeOptions = [
  { label: '白皮书', value: 'whitepaper' },
  { label: '宣传册', value: 'brochure' },
  { label: '数据表', value: 'datasheet' },
  { label: '模板', value: 'template' },
  { label: '指南', value: 'guide' },
  { label: '证书', value: 'certificate' },
  { label: '其他', value: 'other' },
]
const fileTypeMap = { whitepaper: '白皮书', brochure: '宣传册', datasheet: '数据表', template: '模板', guide: '指南', certificate: '证书', other: '其他' }
function getFileTypeText(t) { return fileTypeMap[t] || t }

const form = ref({
  name: '', description: '', file: '', fileType: 'other',
  order: 0, requireLead: true, isFeatured: false,
  tags: [], status: 'draft',
})

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await downloadApi.detail(documentId.value)
    if (item) {
      form.value = {
        name: item.name || '', description: item.description || '', file: item.file || '', fileType: item.fileType || 'other',
        order: item.order || 0, requireLead: item.requireLead !== false, isFeatured: item.isFeatured || false,
        tags: (item.tags || []).map(t => t.documentId), status: item.status || 'draft',
      }
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleSubmit(targetStatus) {
  if (!form.value.name) { uni.showToast({ title: '请填写名称', icon: 'none' }); return }
  if (!form.value.file) { uni.showToast({ title: '请填写文件 URL', icon: 'none' }); return }
  const payload = {
    ...form.value,
    order: Number(form.value.order) || 0,
    status: targetStatus === 'published' ? 'published' : 'draft',
  }
  try {
    if (isEdit.value) {
      await downloadApi.update(documentId.value, payload)
      if (targetStatus === 'published' && form.value.status !== 'published') await downloadApi.publish(documentId.value)
    } else {
      const created = await downloadApi.create(payload)
      if (targetStatus === 'published' && created?.documentId) await downloadApi.publish(created.documentId)
    }
    uni.showToast({ title: targetStatus === 'published' ? '发布成功' : '已保存草稿', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (e) { uni.showToast({ title: '保存失败', icon: 'none' }) }
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
.form-input { width: 100%; height: 72rpx; padding: 0 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
.picker-display { display: flex; align-items: center; line-height: 72rpx; }
.form-textarea { width: 100%; min-height: 160rpx; padding: 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
.form-row { display: flex; justify-content: space-between; align-items: center; }
</style>
