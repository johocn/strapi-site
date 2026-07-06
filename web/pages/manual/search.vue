<template>
  <view class="search-page">
    <view class="header">
      <text class="header-title">搜索文档</text>
    </view>

    <view class="search-bar">
      <input
        class="search-input"
        v-model="query"
        placeholder="输入关键词搜索..."
        @input="onInput"
        confirm-type="search"
      />
      <text v-if="query" class="clear-btn" @click="clearQuery">×</text>
    </view>

    <view v-if="!query" class="empty-hint">
      <text>输入关键词开始搜索</text>
    </view>

    <view v-else-if="results.length === 0" class="empty-hint">
      <text>未找到匹配的文档</text>
    </view>

    <scroll-view v-else scroll-y class="result-list">
      <view class="result-count">共 {{ results.length }} 条结果</view>
      <view
        v-for="r in results"
        :key="r.doc"
        class="result-item"
        @click="goDoc(r.doc)"
      >
        <text class="result-title">{{ r.title || r.doc }}</text>
        <view class="result-snippet" v-html="highlight(r.snippet, query)"></view>
        <text class="result-path">{{ r.doc }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { buildIndex, search, highlight } from './search-index'

const docs = import.meta.glob('../../../docs/manual/**/*.md', { as: 'raw', eager: true })
const index = buildIndex(docs)

const query = ref('')
const results = ref([])
let timer = null

function onInput() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    results.value = search(query.value, index)
  }, 200)
}

function clearQuery() {
  query.value = ''
  results.value = []
}

function goDoc(doc) {
  uni.navigateTo({ url: `/pages/manual/viewer?doc=${encodeURIComponent(doc)}` })
}
</script>

<style scoped>
.search-page { height: 100vh; display: flex; flex-direction: column; }

.header {
  padding: 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #e4e7ed;
}
.header-title { font-size: 32rpx; font-weight: 600; color: #303133; }

.search-bar {
  display: flex; align-items: center;
  padding: 16rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #e4e7ed;
}
.search-input {
  flex: 1;
  padding: 16rpx 24rpx;
  background: #f5f7fa;
  border-radius: 24rpx;
  font-size: 28rpx;
}
.clear-btn { font-size: 40rpx; color: #c0c4cc; padding: 0 16rpx; }

.empty-hint { padding: 120rpx 0; text-align: center; color: #909399; font-size: 28rpx; }

.result-list { flex: 1; padding: 16rpx 24rpx; }
.result-count { font-size: 24rpx; color: #909399; margin-bottom: 16rpx; }

.result-item {
  padding: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  border: 1rpx solid #e4e7ed;
}
.result-title { display: block; font-size: 30rpx; font-weight: 600; color: #303133; margin-bottom: 8rpx; }
.result-snippet { font-size: 26rpx; color: #606266; line-height: 1.6; margin-bottom: 8rpx; }
.result-snippet :deep(mark) { background: #fef08a; color: #92400e; padding: 0 4rpx; border-radius: 2rpx; }
.result-path { font-size: 22rpx; color: #c0c4cc; }
</style>
