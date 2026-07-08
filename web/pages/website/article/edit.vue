<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑文章' : '新增文章'">
      <button class="btn-secondary" @click="handleSubmit('draft')" v-if="hasPermission('article.update')">存草稿</button>
      <button class="btn-primary" @click="handleSubmit('published')" v-if="hasPermission('article.publish')">发布</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <!-- 基本信息 -->
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">标题 *</text>
          <input type="text" v-model="form.title" placeholder="请输入文章标题" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">slug</text>
          <input type="text" v-model="form.slug" placeholder="URL 别名（留空自动生成）" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">分类</text>
          <input type="text" v-model="form.category" placeholder="文章分类" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">标签</text>
          <TagSelector v-model="form.tags" :siteId="siteId" label="标签" />
        </view>

        <view class="form-item">
          <text class="form-label">摘要</text>
          <textarea v-model="form.excerpt" placeholder="文章摘要" class="form-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">封面图 URL</text>
          <input type="text" v-model="form.coverImage" placeholder="封面图地址" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">正文</text>
          <textarea v-model="form.content" placeholder="请输入正文内容" class="form-textarea content-textarea" />
        </view>
      </view>

      <!-- SEO 配置 -->
      <view class="form-section">
        <view class="section-title">SEO 配置</view>

        <view class="form-item">
          <text class="form-label">SEO 标题</text>
          <input type="text" v-model="form.seoTitle" placeholder="SEO 标题" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">SEO 描述</text>
          <textarea v-model="form.seoDescription" placeholder="SEO 描述" class="form-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">SEO 关键词（逗号分隔）</text>
          <input type="text" v-model="form.seoKeywords" placeholder="例: 关键词1,关键词2" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">canonical URL</text>
          <input type="text" v-model="form.canonicalUrl" placeholder="规范链接" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">结构化数据 (JSON)</text>
          <textarea v-model="form.schemaJson" placeholder='{"@context":"https://schema.org"}' class="form-textarea json-textarea" />
        </view>
        <JsonExampleBlock
          fieldLabel="结构化数据"
          fieldName="schemaJson"
          :exampleJson="articleSchemaJsonExample"
          @fill="handleFillExample"
        />

        <view class="form-item form-row">
          <text class="form-label">允许收录</text>
          <switch :checked="form.allowIndex" @change="form.allowIndex = !form.allowIndex" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { articleApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import TagSelector from '../../../src/components/TagSelector.vue'
import JsonExampleBlock from '../../../src/components/JsonExampleBlock.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission
const siteId = computed(() => userStore.currentSite?.documentId || '')

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const form = ref({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: '',
  tags: [],
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  canonicalUrl: '',
  schemaJson: '',
  allowIndex: true,
  status: 'draft',
})

const articleSchemaJsonExample = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "文章标题",
  "image": ["https://example.com/photos/1x1/photo.jpg"],
  "datePublished": "2026-01-01",
  "dateModified": "2026-01-01",
  "author": { "@type": "Person", "name": "作者名" },
  "publisher": {
    "@type": "Organization",
    "name": "公司名",
    "logo": { "@type": "ImageObject", "url": "https://example.com/logo.jpg" }
  },
  "description": "文章摘要"
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

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await articleApi.detail(documentId.value)
    if (item) {
      form.value = {
        title: item.title || '',
        slug: item.slug || '',
        excerpt: item.excerpt || '',
        content: item.content || '',
        coverImage: item.coverImage || '',
        category: item.category || '',
        tags: (item.tags || []).map(t => t.documentId),
        seoTitle: item.seoTitle || '',
        seoDescription: item.seoDescription || '',
        seoKeywords: item.seoKeywords || '',
        canonicalUrl: item.canonicalUrl || '',
        schemaJson: typeof item.schemaJson === 'string' ? item.schemaJson : JSON.stringify(item.schemaJson || '', null, 2),
        allowIndex: item.allowIndex !== false,
        status: item.status || 'draft',
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit(targetStatus) {
  if (!form.value.title) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  const payload = {
    ...form.value,
    status: targetStatus === 'published' ? 'published' : 'draft',
  }
  try {
    if (isEdit.value) {
      await articleApi.update(documentId.value, payload)
      // 已发布且原状态非 published 时，调用 publish 接口确保发布
      if (targetStatus === 'published' && form.value.status !== 'published') {
        await articleApi.publish(documentId.value)
      }
    } else {
      const created = await articleApi.create(payload)
      if (targetStatus === 'published' && created?.documentId) {
        await articleApi.publish(created.documentId)
      }
    }
    uni.showToast({ title: targetStatus === 'published' ? '发布成功' : '已保存草稿', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

onLoad((options) => {
  if (options?.documentId) {
    documentId.value = options.documentId
    loadDetail()
  }
})
</script>

<style scoped>
page {
  background: #f5f5f5;
}
.page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.form-scroll {
  flex: 1;
  padding: 20rpx;
  box-sizing: border-box;
}

.btn-primary {
  background: #ff0000;
  color: #ffffff;
  padding: 16rpx 32rpx;
  font-size: 30rpx;
  border-radius: 8rpx;
  border: none;
  line-height: 1.2;
  margin-left: 12rpx;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  padding: 16rpx 32rpx;
  font-size: 30rpx;
  border-radius: 8rpx;
  border: none;
  line-height: 1.2;
}

.form-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  padding-left: 8rpx;
  border-left: 6rpx solid #ff0000;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 72rpx;
  padding: 0 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  min-height: 160rpx;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.content-textarea {
  min-height: 400rpx;
}

.json-textarea {
  min-height: 240rpx;
  font-family: monospace;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
