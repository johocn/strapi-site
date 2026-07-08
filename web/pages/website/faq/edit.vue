<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑问答' : '新增问答'">
      <button class="btn-secondary" @click="handleSubmit('draft')" v-if="hasPermission('faq.update')">存草稿</button>
      <button class="btn-primary" @click="handleSubmit('published')" v-if="hasPermission('faq.publish')">发布</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">问答内容</view>
        <view class="form-item">
          <text class="form-label">问题 *</text>
          <textarea v-model="form.question" placeholder="请输入问题" class="form-textarea" />
        </view>
        <view class="form-item">
          <text class="form-label">答案 *</text>
          <textarea v-model="form.answer" placeholder="请输入答案" class="form-textarea content-textarea" />
        </view>
        <view class="form-item">
          <text class="form-label">slug</text>
          <input type="text" v-model="form.slug" placeholder="URL 别名" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">设置</view>
        <view class="form-item">
          <text class="form-label">排序（数字越小越靠前）</text>
          <input type="number" v-model="form.order" placeholder="0" class="form-input" />
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
import { faqApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import TagSelector from '../../../src/components/TagSelector.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission
const siteId = computed(() => userStore.currentSite?.documentId || '')

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const form = ref({
  question: '', answer: '', slug: '', order: 0, isFeatured: false, tags: [], status: 'draft',
})

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await faqApi.detail(documentId.value)
    if (item) {
      form.value = {
        question: item.question || '', answer: item.answer || '', slug: item.slug || '',
        order: item.order || 0, isFeatured: item.isFeatured || false,
        tags: (item.tags || []).map(t => t.documentId), status: item.status || 'draft',
      }
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleSubmit(targetStatus) {
  if (!form.value.question) { uni.showToast({ title: '请填写问题', icon: 'none' }); return }
  if (!form.value.answer) { uni.showToast({ title: '请填写答案', icon: 'none' }); return }
  const payload = {
    ...form.value,
    order: Number(form.value.order) || 0,
    status: targetStatus === 'published' ? 'published' : 'draft',
  }
  try {
    if (isEdit.value) {
      await faqApi.update(documentId.value, payload)
      if (targetStatus === 'published' && form.value.status !== 'published') await faqApi.publish(documentId.value)
    } else {
      const created = await faqApi.create(payload)
      if (targetStatus === 'published' && created?.documentId) await faqApi.publish(created.documentId)
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
.form-textarea { width: 100%; min-height: 160rpx; padding: 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
.content-textarea { min-height: 400rpx; }
.form-row { display: flex; justify-content: space-between; align-items: center; }
</style>
