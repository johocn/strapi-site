<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑合规' : '新增合规'">
      <button class="btn-secondary" @click="handleSubmit('draft')" v-if="hasPermission('compliance.update')">存草稿</button>
      <button class="btn-primary" @click="handleSubmit('published')" v-if="hasPermission('compliance.publish')">发布</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        <view class="form-item"><text class="form-label">标题 *</text><input type="text" v-model="form.title" placeholder="合规公示标题" class="form-input" /></view>
        <view class="form-item"><text class="form-label">slug</text><input type="text" v-model="form.slug" placeholder="URL 别名" class="form-input" /></view>
        <view class="form-item">
          <text class="form-label">类目 *</text>
          <picker mode="selector" :range="categoryOptions" :range-key="'label'" @change="(e) => form.category = categoryOptions[e.detail.value].value">
            <view class="form-input picker-display">{{ getCategoryText(form.category) }}</view>
          </picker>
        </view>
        <view class="form-item"><text class="form-label">生效日期</text><input type="date" v-model="form.effectiveDate" class="form-input" /></view>
        <view class="form-item"><text class="form-label">失效日期</text><input type="date" v-model="form.expiryDate" class="form-input" /></view>
      </view>

      <view class="form-section">
        <view class="section-title">内容</view>
        <view class="form-item"><text class="form-label">正文 *</text><textarea v-model="form.content" placeholder="合规公示正文" class="form-textarea content-textarea" /></view>
      </view>

      <view class="form-section">
        <view class="section-title">设置</view>
        <view class="form-item form-row">
          <text class="form-label">置顶</text>
          <switch :checked="form.isPinned" @change="form.isPinned = !form.isPinned" />
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
import { complianceApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import TagSelector from '../../../src/components/TagSelector.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission
const siteId = computed(() => userStore.currentSite?.documentId || '')

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const categoryOptions = [
  { label: '公告', value: 'notice' },
  { label: '政策', value: 'policy' },
  { label: '报告', value: 'report' },
  { label: '证书', value: 'certificate' },
  { label: '协议', value: 'agreement' },
]
const categoryMap = { notice: '公告', policy: '政策', report: '报告', certificate: '证书', agreement: '协议' }
function getCategoryText(c) { return categoryMap[c] || c }

const form = ref({
  title: '', slug: '', category: 'notice', content: '',
  effectiveDate: '', expiryDate: '', isPinned: false,
  tags: [], status: 'draft',
})

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await complianceApi.detail(documentId.value)
    if (item) {
      form.value = {
        title: item.title || '', slug: item.slug || '', category: item.category || 'notice',
        content: item.content || '', effectiveDate: item.effectiveDate || '', expiryDate: item.expiryDate || '',
        isPinned: item.isPinned || false, tags: (item.tags || []).map(t => t.documentId), status: item.status || 'draft',
      }
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleSubmit(targetStatus) {
  if (!form.value.title) { uni.showToast({ title: '请填写标题', icon: 'none' }); return }
  if (!form.value.content) { uni.showToast({ title: '请填写正文', icon: 'none' }); return }
  const payload = {
    ...form.value,
    status: targetStatus === 'published' ? 'published' : 'draft',
  }
  try {
    if (isEdit.value) {
      await complianceApi.update(documentId.value, payload)
      if (targetStatus === 'published' && form.value.status !== 'published') await complianceApi.publish(documentId.value)
    } else {
      const created = await complianceApi.create(payload)
      if (targetStatus === 'published' && created?.documentId) await complianceApi.publish(created.documentId)
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
.content-textarea { min-height: 400rpx; }
.form-row { display: flex; justify-content: space-between; align-items: center; }
</style>
