<template>
  <view class="page-container">
    <PageHeader title="SEO 配置">
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission('seo-config.update')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">Meta 标签</view>
        <view class="form-item"><text class="form-label">页面标题</text><input type="text" v-model="form.title" placeholder="浏览器标签页标题" class="form-input" /></view>
        <view class="form-item"><text class="form-label">描述</text><textarea v-model="form.description" placeholder="meta description" class="form-textarea" /></view>
        <view class="form-item"><text class="form-label">关键词（逗号分隔）</text><input type="text" v-model="form.keywords" placeholder="关键词1,关键词2" class="form-input" /></view>
        <view class="form-item"><text class="form-label">Robots</text><input type="text" v-model="form.robots" placeholder="index, follow" class="form-input" /></view>
      </view>

      <view class="form-section">
        <view class="section-title">Open Graph</view>
        <view class="form-item"><text class="form-label">OG 标题</text><input type="text" v-model="form.ogTitle" placeholder="分享标题" class="form-input" /></view>
        <view class="form-item"><text class="form-label">OG 描述</text><textarea v-model="form.ogDescription" placeholder="分享描述" class="form-textarea" /></view>
        <view class="form-item"><text class="form-label">OG 图片 URL</text><input type="text" v-model="form.ogImage" placeholder="https://..." class="form-input" /></view>
      </view>

      <view class="form-section">
        <view class="section-title">结构化数据</view>
        <view class="form-item"><text class="form-label">Structured Data (JSON)</text><textarea v-model="form.structuredData" placeholder='{"@context":"https://schema.org"}' class="form-textarea json-textarea" /></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { seoConfigApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const form = ref({
  documentId: '', title: '', description: '', keywords: '', robots: 'index, follow',
  ogTitle: '', ogDescription: '', ogImage: '', structuredData: '',
})

async function loadData() {
  try {
    const item = await seoConfigApi.get()
    if (item) {
      form.value = {
        documentId: item.documentId || '',
        title: item.title || '', description: item.description || '',
        keywords: item.keywords || '', robots: item.robots || 'index, follow',
        ogTitle: item.ogTitle || '', ogDescription: item.ogDescription || '',
        ogImage: item.ogImage || '',
        structuredData: typeof item.structuredData === 'string' ? item.structuredData : JSON.stringify(item.structuredData || '', null, 2),
      }
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleSubmit() {
  try {
    await seoConfigApi.save(form.value)
    uni.showToast({ title: '保存成功', icon: 'success' })
    loadData()
  } catch (e) { uni.showToast({ title: '保存失败', icon: 'none' }) }
}

onShow(() => loadData())
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
.form-textarea { width: 100%; min-height: 120rpx; padding: 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
.json-textarea { min-height: 240rpx; font-family: monospace; }
</style>
