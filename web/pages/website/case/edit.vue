<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑案例' : '新增案例'">
      <button class="btn-secondary" @click="handleSubmit('draft')" v-if="hasPermission('case.update')">存草稿</button>
      <button class="btn-primary" @click="handleSubmit('published')" v-if="hasPermission('case.publish')">发布</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        <view class="form-item"><text class="form-label">标题 *</text><input type="text" v-model="form.title" placeholder="案例标题" class="form-input" /></view>
        <view class="form-item"><text class="form-label">slug</text><input type="text" v-model="form.slug" placeholder="URL 别名" class="form-input" /></view>
        <view class="form-item"><text class="form-label">客户名称 *</text><input type="text" v-model="form.clientName" placeholder="客户公司名" class="form-input" /></view>
        <view class="form-item"><text class="form-label">客户行业</text><input type="text" v-model="form.clientIndustry" placeholder="客户所在行业" class="form-input" /></view>
        <view class="form-item"><text class="form-label">客户简介</text><textarea v-model="form.clientDescription" placeholder="客户介绍" class="form-textarea" /></view>
        <view class="form-item"><text class="form-label">封面图 URL</text><input type="text" v-model="form.coverImage" placeholder="封面图地址" class="form-input" /></view>
      </view>

      <view class="form-section">
        <view class="section-title">案例详情</view>
        <view class="form-item"><text class="form-label">挑战 *</text><textarea v-model="form.challenge" placeholder="客户面临的挑战" class="form-textarea content-textarea" /></view>
        <view class="form-item"><text class="form-label">解决方案 *</text><textarea v-model="form.solution" placeholder="提供的解决方案" class="form-textarea content-textarea" /></view>
        <view class="form-item"><text class="form-label">成果（JSON 数组）*</text><textarea v-model="resultsJson" placeholder='[{"metric":"增长","value":"30%"}]' class="form-textarea" /></view>
        <view class="form-item"><text class="form-label">客户评价</text><textarea v-model="form.testimonial" placeholder="客户证言" class="form-textarea" /></view>
        <view class="form-item"><text class="form-label">评价人姓名</text><input type="text" v-model="form.testimonialAuthor" placeholder="评价人姓名" class="form-input" /></view>
        <view class="form-item"><text class="form-label">评价人职位</text><input type="text" v-model="form.testimonialTitle" placeholder="评价人职位" class="form-input" /></view>
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
import { caseApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import TagSelector from '../../../src/components/TagSelector.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission
const siteId = computed(() => userStore.currentSite?.documentId || '')

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)
const resultsJson = ref('[]')

const form = ref({
  title: '', slug: '', clientName: '', clientIndustry: '', clientDescription: '',
  challenge: '', solution: '', results: [], testimonial: '', testimonialAuthor: '', testimonialTitle: '',
  coverImage: '', tags: [], status: 'draft',
})

function safeParse(str, fallback) { try { return JSON.parse(str) } catch { return fallback } }

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await caseApi.detail(documentId.value)
    if (item) {
      form.value = {
        title: item.title || '', slug: item.slug || '',
        clientName: item.clientName || '', clientIndustry: item.clientIndustry || '', clientDescription: item.clientDescription || '',
        challenge: item.challenge || '', solution: item.solution || '', results: item.results || [],
        testimonial: item.testimonial || '', testimonialAuthor: item.testimonialAuthor || '', testimonialTitle: item.testimonialTitle || '',
        coverImage: item.coverImage || '', tags: (item.tags || []).map(t => t.documentId), status: item.status || 'draft',
      }
      resultsJson.value = JSON.stringify(item.results || [], null, 2)
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleSubmit(targetStatus) {
  if (!form.value.title) { uni.showToast({ title: '请填写标题', icon: 'none' }); return }
  if (!form.value.clientName) { uni.showToast({ title: '请填写客户名称', icon: 'none' }); return }
  if (!form.value.challenge) { uni.showToast({ title: '请填写挑战', icon: 'none' }); return }
  if (!form.value.solution) { uni.showToast({ title: '请填写解决方案', icon: 'none' }); return }
  const payload = {
    ...form.value,
    results: safeParse(resultsJson.value, []),
    status: targetStatus === 'published' ? 'published' : 'draft',
  }
  try {
    if (isEdit.value) {
      await caseApi.update(documentId.value, payload)
      if (targetStatus === 'published' && form.value.status !== 'published') await caseApi.publish(documentId.value)
    } else {
      const created = await caseApi.create(payload)
      if (targetStatus === 'published' && created?.documentId) await caseApi.publish(created.documentId)
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
.content-textarea { min-height: 300rpx; }
</style>
