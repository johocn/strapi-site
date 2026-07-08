<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑产品' : '新增产品'">
      <button class="btn-secondary" @click="handleSubmit('draft')" v-if="hasPermission('product.update')">存草稿</button>
      <button class="btn-primary" @click="handleSubmit('published')" v-if="hasPermission('product.publish')">发布</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        <view class="form-item">
          <text class="form-label">名称 *</text>
          <input type="text" v-model="form.name" placeholder="产品名称" class="form-input" />
        </view>
        <view class="form-item">
          <text class="form-label">slug</text>
          <input type="text" v-model="form.slug" placeholder="URL 别名（留空自动生成）" class="form-input" />
        </view>
        <view class="form-item">
          <text class="form-label">标语</text>
          <input type="text" v-model="form.tagline" placeholder="产品标语" class="form-input" />
        </view>
        <view class="form-item">
          <text class="form-label">简介</text>
          <textarea v-model="form.description" placeholder="产品简介" class="form-textarea" />
        </view>
        <view class="form-item">
          <text class="form-label">封面图 URL</text>
          <input type="text" v-model="form.coverImage" placeholder="封面图地址" class="form-input" />
        </view>
        <view class="form-item">
          <text class="form-label">正文</text>
          <textarea v-model="form.content" placeholder="产品详情" class="form-textarea content-textarea" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">产品属性</view>
        <view class="form-item">
          <text class="form-label">价格区间</text>
          <input type="text" v-model="form.priceRange" placeholder="例: ¥1000-5000" class="form-input" />
        </view>
        <view class="form-item">
          <text class="form-label">价格单位</text>
          <input type="text" v-model="form.priceUnit" placeholder="例: 元/年" class="form-input" />
        </view>
        <view class="form-item">
          <text class="form-label">特性（JSON 数组）</text>
          <textarea v-model="featuresJson" placeholder='[{"name":"特性1","description":"..."}]' class="form-textarea" />
        </view>
        <JsonExampleBlock
          fieldLabel="产品特性"
          fieldName="features"
          :exampleJson="productFeaturesExample"
          @fill="handleFillExample"
        />
        <view class="form-item">
          <text class="form-label">规格（JSON 对象）</text>
          <textarea v-model="specificationsJson" placeholder='{"CPU":"4核","内存":"8G"}' class="form-textarea" />
        </view>
        <JsonExampleBlock
          fieldLabel="规格参数"
          fieldName="specifications"
          :exampleJson="productSpecExample"
          @fill="handleFillExample"
        />
        <view class="form-item">
          <text class="form-label">应用场景（JSON 数组）</text>
          <textarea v-model="scenariosJson" placeholder='["场景1","场景2"]' class="form-textarea" />
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
import { productApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import TagSelector from '../../../src/components/TagSelector.vue'
import JsonExampleBlock from '../../../src/components/JsonExampleBlock.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission
const siteId = computed(() => userStore.currentSite?.documentId || '')

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)
const featuresJson = ref('[]')
const specificationsJson = ref('{}')
const scenariosJson = ref('[]')

const productFeaturesExample = JSON.stringify([
  { "icon": "⚡", "title": "高性能", "description": "毫秒级响应" },
  { "icon": "🔒", "title": "安全可靠", "description": "金融级加密" },
  { "icon": "📱", "title": "多端适配", "description": "PC/移动/小程序" }
], null, 2)

const productSpecExample = JSON.stringify([
  { "label": "版本", "value": "企业版" },
  { "label": "授权方式", "value": "年付订阅" },
  { "label": "用户数", "value": "不限" },
  { "label": "存储空间", "value": "100GB" }
], null, 2)

function handleFillExample({ fieldName, exampleJson }) {
  const refMap = { features: featuresJson, specifications: specificationsJson }
  const target = refMap[fieldName]
  if (!target) return
  if (target.value && target.value.trim()) {
    uni.showModal({
      title: '确认覆盖',
      content: `字段「${fieldName}」已有内容，确定用示例覆盖吗？`,
      success: (res) => {
        if (res.confirm) {
          target.value = exampleJson
          uni.showToast({ title: '已填入示例', icon: 'success' })
        }
      }
    })
  } else {
    target.value = exampleJson
    uni.showToast({ title: '已填入示例', icon: 'success' })
  }
}

const form = ref({
  name: '', slug: '', tagline: '', description: '', content: '', coverImage: '',
  priceRange: '', priceUnit: '', features: [], specifications: {}, scenarios: [],
  isFeatured: false, tags: [], status: 'draft',
})

function safeParse(str, fallback) { try { return JSON.parse(str) } catch { return fallback } }

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await productApi.detail(documentId.value)
    if (item) {
      form.value = {
        name: item.name || '', slug: item.slug || '', tagline: item.tagline || '',
        description: item.description || '', content: item.content || '', coverImage: item.coverImage || '',
        priceRange: item.priceRange || '', priceUnit: item.priceUnit || '',
        features: item.features || [], specifications: item.specifications || {}, scenarios: item.scenarios || [],
        isFeatured: item.isFeatured || false, tags: (item.tags || []).map(t => t.documentId), status: item.status || 'draft',
      }
      featuresJson.value = JSON.stringify(item.features || [], null, 2)
      specificationsJson.value = JSON.stringify(item.specifications || {}, null, 2)
      scenariosJson.value = JSON.stringify(item.scenarios || [], null, 2)
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleSubmit(targetStatus) {
  if (!form.value.name) { uni.showToast({ title: '请填写名称', icon: 'none' }); return }
  const payload = {
    ...form.value,
    features: safeParse(featuresJson.value, []),
    specifications: safeParse(specificationsJson.value, {}),
    scenarios: safeParse(scenariosJson.value, []),
    status: targetStatus === 'published' ? 'published' : 'draft',
  }
  try {
    if (isEdit.value) {
      await productApi.update(documentId.value, payload)
      if (targetStatus === 'published' && form.value.status !== 'published') await productApi.publish(documentId.value)
    } else {
      const created = await productApi.create(payload)
      if (targetStatus === 'published' && created?.documentId) await productApi.publish(created.documentId)
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
