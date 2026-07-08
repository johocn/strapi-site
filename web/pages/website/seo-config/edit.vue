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

      <view class="form-section">
        <view class="section-title">SEO 高级配置</view>
        <view class="form-item">
          <text class="form-label">备选语言 (JSON 数组)</text>
          <textarea v-model="form.alternateLocales" placeholder='["en-US","ja-JP"]' class="form-textarea json-textarea" />
        </view>
        <JsonExampleBlock
          fieldLabel="备选语言"
          fieldName="alternateLocales"
          :exampleJson="alternateLocalesExample"
          @fill="handleFillExample"
        />
        <view class="form-item">
          <text class="form-label">Schema sameAs (JSON 数组)</text>
          <textarea v-model="form.schemaSameAs" placeholder='["https://..."]' class="form-textarea json-textarea" />
        </view>
        <JsonExampleBlock
          fieldLabel="Schema sameAs"
          fieldName="schemaSameAs"
          :exampleJson="schemaSameAsExample"
          @fill="handleFillExample"
        />
        <view class="form-item">
          <text class="form-label">Schema 联系点 (JSON 数组)</text>
          <textarea v-model="form.schemaContactPoint" placeholder='[{"@type":"ContactPoint"}]' class="form-textarea json-textarea" />
        </view>
        <JsonExampleBlock
          fieldLabel="Schema 联系点"
          fieldName="schemaContactPoint"
          :exampleJson="schemaContactPointExample"
          @fill="handleFillExample"
        />
        <view class="form-item">
          <text class="form-label">Sitemap 排除类型 (JSON 数组)</text>
          <textarea v-model="form.sitemapExcludeTypes" placeholder='["visit-log"]' class="form-textarea json-textarea" />
        </view>
        <JsonExampleBlock
          fieldLabel="Sitemap 排除类型"
          fieldName="sitemapExcludeTypes"
          :exampleJson="sitemapExcludeTypesExample"
          @fill="handleFillExample"
        />
        <view class="form-item">
          <text class="form-label">额外配置 (JSON 对象)</text>
          <textarea v-model="form.extraConfig" placeholder='{"cacheTTL":3600}' class="form-textarea json-textarea" />
        </view>
        <JsonExampleBlock
          fieldLabel="额外配置"
          fieldName="extraConfig"
          :exampleJson="extraConfigExample"
          @fill="handleFillExample"
        />
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
import JsonExampleBlock from '../../../src/components/JsonExampleBlock.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const form = ref({
  documentId: '', title: '', description: '', keywords: '', robots: 'index, follow',
  ogTitle: '', ogDescription: '', ogImage: '', structuredData: '',
  alternateLocales: '', schemaSameAs: '', schemaContactPoint: '',
  sitemapExcludeTypes: '', extraConfig: '',
})

const alternateLocalesExample = JSON.stringify(["en-US", "ja-JP", "ko-KR"], null, 2)

const schemaSameAsExample = JSON.stringify([
  "https://zh.wikipedia.org/wiki/你的公司",
  "https://www.crunchbase.com/organization/your-company",
  "https://www.linkedin.com/company/your-company",
  "https://github.com/your-company"
], null, 2)

const schemaContactPointExample = JSON.stringify([
  {
    "@type": "ContactPoint",
    "telephone": "+86-10-12345678",
    "contactType": "customer service",
    "areaServed": "CN",
    "availableLanguage": ["Chinese", "English"],
    "hoursAvailable": "Mo-Fr 09:00-18:00"
  }
], null, 2)

const sitemapExcludeTypesExample = JSON.stringify(["visit-log", "search-log", "interaction"], null, 2)

const extraConfigExample = JSON.stringify({
  "cacheTTL": 3600,
  "enableBrotli": true,
  "cdnPurgeOnPublish": true
}, null, 2)

function handleFillExample({ fieldName, exampleJson }) {
  if (form.value[fieldName] && form.value[fieldName].trim()) {
    uni.showModal({
      title: '确认覆盖',
      content: `字段「${fieldName}」已有内容，确定用示例覆盖吗？`,
      success: (res) => {
        if (res.confirm) {
          form.value[fieldName] = exampleJson
          uni.showToast({ title: '已填入示例', icon: 'success' })
        }
      }
    })
  } else {
    form.value[fieldName] = exampleJson
    uni.showToast({ title: '已填入示例', icon: 'success' })
  }
}

async function loadData() {
  try {
    const item = await seoConfigApi.get()
    if (item) {
      const toString = (v) => typeof v === 'string' ? v : JSON.stringify(v || '', null, 2)
      form.value = {
        documentId: item.documentId || '',
        title: item.title || '', description: item.description || '',
        keywords: item.keywords || '', robots: item.robots || 'index, follow',
        ogTitle: item.ogTitle || '', ogDescription: item.ogDescription || '',
        ogImage: item.ogImage || '',
        structuredData: toString(item.structuredData),
        alternateLocales: toString(item.alternateLocales),
        schemaSameAs: toString(item.schemaSameAs),
        schemaContactPoint: toString(item.schemaContactPoint),
        sitemapExcludeTypes: toString(item.sitemapExcludeTypes),
        extraConfig: toString(item.extraConfig),
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
