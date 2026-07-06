<template>
  <view class="manual-viewer">
    <view class="header">
      <text class="title">{{ currentTitle || '文档查看' }}</text>
      <view class="header-actions">
        <text class="search-btn" @click="goSearch">🔍</text>
      </view>
    </view>

    <view v-if="loading" class="loading">加载中...</view>
    <view v-else-if="error" class="error">{{ error }}</view>
    <scroll-view v-else scroll-y class="markdown-body">
      <view v-html="renderedHtml"></view>

      <view class="doc-nav">
        <view v-if="prevDoc" class="nav-btn prev" @click="goDoc(prevDoc)">← 上一篇</view>
        <view v-if="nextDoc" class="nav-btn next" @click="goDoc(nextDoc)">下一篇 →</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: true, linkify: true })

const docs = import.meta.glob('../../../docs/manual/**/*.md', { as: 'raw', eager: true })

const currentDoc = ref('')
const content = ref('')
const loading = ref(true)
const error = ref('')

const renderedHtml = computed(() => md.render(content.value))
const currentTitle = computed(() => {
  const line = content.value.split('\n').find(l => l.startsWith('#'))
  return line ? line.replace(/^#+\s*/, '') : ''
})

const prevDoc = computed(() => {
  const order = getIndexOrder()
  const idx = order.indexOf(currentDoc.value)
  return idx > 0 ? order[idx - 1] : null
})

const nextDoc = computed(() => {
  const order = getIndexOrder()
  const idx = order.indexOf(currentDoc.value)
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null
})

function getIndexOrder() {
  const keys = Object.keys(docs)
  const findDoc = (target) => {
    const key = keys.find(k => k.endsWith(target))
    return key ? docs[key] : null
  }
  const adminIndex = findDoc('docs/manual/admin/index.md')
  const shaoIndex = findDoc('docs/manual/shao-catalog/index.md')
  const userIndex = findDoc('docs/manual/user-guide/index.md')
  const order = []
  const extractLinks = (raw) => {
    if (!raw) return
    const re = /\[([^\]]+)\]\(([^)]+\.md)\)/g
    let m
    while ((m = re.exec(raw)) !== null) {
      order.push(m[2])
    }
  }
  extractLinks(adminIndex)
  extractLinks(shaoIndex)
  extractLinks(userIndex)
  return order
}

function loadDoc(docPath) {
  loading.value = true
  error.value = ''
  const keys = Object.keys(docs)
  const key = keys.find(k => k.endsWith(`docs/manual/${docPath}`))
  const raw = key ? docs[key] : null
  if (!raw) {
    error.value = `文档不存在: ${docPath}`
    loading.value = false
    return
  }
  content.value = raw
  currentDoc.value = docPath
  loading.value = false
}

onLoad((opts) => {
  const doc = opts.doc ? decodeURIComponent(opts.doc) : 'admin/index.md'
  loadDoc(doc)
})

function goSearch() {
  uni.navigateTo({ url: '/pages/manual/search' })
}

function goDoc(doc) {
  uni.redirectTo({ url: `/pages/manual/viewer?doc=${encodeURIComponent(doc)}` })
}
</script>

<style scoped>
.manual-viewer { height: 100vh; display: flex; flex-direction: column; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 32rpx; background: #fff; border-bottom: 1rpx solid #e4e7ed; }
.header .title { font-size: 32rpx; font-weight: 600; color: #303133; }
.header-actions { display: flex; align-items: center; }
.search-btn { font-size: 32rpx; padding: 0 16rpx; }

.loading, .error { padding: 80rpx; text-align: center; color: #909399; }

.markdown-body {
  flex: 1;
  padding: 32rpx;
  background: #fff;
}
.markdown-body :deep(h1) { font-size: 40rpx; font-weight: 700; margin: 24rpx 0 16rpx; color: #303133; }
.markdown-body :deep(h2) { font-size: 34rpx; font-weight: 600; margin: 24rpx 0 12rpx; color: #303133; }
.markdown-body :deep(h3) { font-size: 30rpx; font-weight: 600; margin: 16rpx 0 8rpx; color: #303133; }
.markdown-body :deep(p) { font-size: 28rpx; line-height: 1.7; color: #606266; margin: 12rpx 0; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: 40rpx; margin: 12rpx 0; }
.markdown-body :deep(li) { font-size: 28rpx; line-height: 1.7; color: #606266; }
.markdown-body :deep(code) { background: #f5f7fa; padding: 2rpx 8rpx; border-radius: 4rpx; font-family: monospace; font-size: 26rpx; }
.markdown-body :deep(pre) { background: #f5f7fa; padding: 16rpx; border-radius: 8rpx; overflow-x: auto; margin: 16rpx 0; }
.markdown-body :deep(table) { width: 100%; border-collapse: collapse; margin: 16rpx 0; }
.markdown-body :deep(th), .markdown-body :deep(td) { border: 1rpx solid #dcdfe6; padding: 8rpx 12rpx; font-size: 26rpx; }
.markdown-body :deep(th) { background: #f5f7fa; font-weight: 600; }
.markdown-body :deep(a) { color: #409eff; text-decoration: underline; }
.markdown-body :deep(blockquote) { border-left: 4rpx solid #dcdfe6; padding-left: 16rpx; color: #909399; margin: 16rpx 0; }

.doc-nav { display: flex; justify-content: space-between; padding: 32rpx 0; border-top: 1rpx solid #e4e7ed; margin-top: 32rpx; }
.nav-btn { padding: 16rpx 24rpx; background: #f5f7fa; border-radius: 8rpx; font-size: 26rpx; color: #606266; }
.nav-btn.next { margin-left: auto; }
</style>
