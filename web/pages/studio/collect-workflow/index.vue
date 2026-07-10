<template>
  <view class="page-container">
    <PageHeader title="采集工作流" />

    <view class="step-indicator">
      <view class="step-num">{{ step }}/4</view>
      <text class="step-title">{{ stepLabels[step - 1] }}</text>
    </view>

    <!-- Step 1: 选择采集源 -->
    <view v-if="step === 1" class="step-content">
      <view class="card">
        <view class="card-label">选择采集源</view>
        <picker mode="selector" :range="sourceNames" @change="onSourceChange" :value="sourceIndex">
          <view class="picker-value">{{ sourceNames[sourceIndex] || '请选择采集源' }}</view>
        </picker>
      </view>
      <view v-if="!loading && sources.length === 0" class="empty-state">
        <text class="empty-text">暂无可用采集源</text>
      </view>
      <button class="btn-primary" :disabled="!selectedSourceId || loading" @click="startCollect">
        {{ loading ? '创建任务中...' : '开始采集' }}
      </button>
    </view>

    <!-- Step 2: 标题列表 -->
    <view v-if="step === 2" class="step-content">
      <view v-if="loading" class="loading"><text>加载标题中...</text></view>
      <view v-else>
        <view class="card">
          <view class="card-label">选择要抓取的标题（共 {{ titles.length }} 条）</view>
          <view class="select-actions">
            <text class="link" @click="selectAllTitles">全选</text>
            <text class="link" @click="clearTitles">清空</text>
            <text class="link" @click="loadTaskTitles">刷新</text>
          </view>
        </view>
        <view class="title-list">
          <view
            v-for="(title, idx) in titles"
            :key="idx"
            class="check-item"
            @click="toggleTitle(idx)"
          >
            <view class="checkbox" :class="{ checked: selectedTitleIndices.includes(idx) }">
              <text v-if="selectedTitleIndices.includes(idx)" class="check-icon">✓</text>
            </view>
            <text class="title-text">{{ title }}</text>
          </view>
        </view>
        <view v-if="titles.length === 0" class="empty-state">
          <text class="empty-text">暂无标题，请点击刷新</text>
        </view>
        <view class="btn-row">
          <button class="btn-default" @click="step = 1">上一步</button>
          <button
            class="btn-primary"
            :disabled="selectedTitleIndices.length === 0 || loading"
            @click="fetchContent"
          >
            {{ loading ? '抓取中...' : `抓取选中内容（${selectedTitleIndices.length}）` }}
          </button>
        </view>
      </view>
    </view>

    <!-- Step 3: 内容预览 -->
    <view v-if="step === 3" class="step-content">
      <view class="card">
        <view class="card-label">内容预览（{{ contents.length }} 篇）</view>
      </view>
      <view class="content-list">
        <view v-for="(item, idx) in contents" :key="idx" class="content-card">
          <view class="content-title">{{ item.title }}</view>
          <view class="content-meta">
            <text class="quality-tag" :class="getQualityClass(item.qualityScore)">
              质量评分：{{ item.qualityScore ?? '-' }}
            </text>
          </view>
          <view class="content-body">{{ truncateText(item.content || item.summary || '') }}</view>
        </view>
      </view>

      <view v-if="hasPermission('menu.tenant')" class="card">
        <view class="card-label">导入可见范围</view>
        <picker mode="selector" :range="scopeOptions" @change="onScopeChange" :value="scopeIndex">
          <view class="picker-value">{{ scopeOptions[scopeIndex] }}</view>
        </picker>
        <view v-if="scopeValue === 'tenant'">
          <view class="card-label" style="margin-top: 20rpx;">选择目标租户</view>
          <TenantSelector v-model="targetTenantId" />
        </view>
      </view>

      <view class="btn-row">
        <button class="btn-default" @click="step = 2">上一步</button>
        <button class="btn-primary" :disabled="loading" @click="confirmImport">
          {{ loading ? '导入中...' : '确认导入' }}
        </button>
      </view>
    </view>

    <!-- Step 4: 完成 -->
    <view v-if="step === 4" class="step-content">
      <view class="success-card">
        <text class="success-icon">✅</text>
        <text class="success-text">成功导入 {{ importedCount }} 篇草稿</text>
        <button class="btn-primary" @click="goDraftList">查看草稿列表</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { collectSourceApi, collectActionApi } from '../../../src/api/studio.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import TenantSelector from '../../../src/components/TenantSelector.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const step = ref(1)
const stepLabels = ['选择采集源', '标题列表', '内容预览', '完成']
const loading = ref(false)

// Step 1
const sources = ref([])
const sourceIndex = ref(0)
const sourceNames = computed(() => sources.value.map(s => s.name || s.url || '未命名'))
const selectedSourceId = computed(() => sources.value[sourceIndex.value]?.documentId || '')
const taskId = ref('')

// Step 2
const titles = ref([])
const selectedTitleIndices = ref([])

// Step 3
const contents = ref([])
const scopeIndex = ref(2)
const scopeOptions = ['全局', '指定租户', '仅当前租户']
const scopeReverseMap = { 0: 'global', 1: 'tenant', 2: 'current' }
const scopeValue = computed(() => scopeReverseMap[scopeIndex.value])
const targetTenantId = ref('')

// Step 4
const importedCount = ref(0)

async function loadSources() {
  try {
    const { list } = await collectSourceApi.list({ 'pagination[pageSize]': 100 })
    sources.value = list
  } catch (e) {
    uni.showToast({ title: '加载采集源失败', icon: 'none' })
  }
}

function onSourceChange(e) {
  sourceIndex.value = e.detail.value
}

async function startCollect() {
  if (!selectedSourceId.value) {
    uni.showToast({ title: '请先选择采集源', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const task = await collectActionApi.createTask(selectedSourceId.value)
    taskId.value = task.documentId || task.id
    step.value = 2
    await loadTaskTitles()
  } catch (e) {
    uni.showToast({ title: '创建采集任务失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadTaskTitles() {
  if (!taskId.value) return
  loading.value = true
  try {
    const task = await collectActionApi.getTask(taskId.value)
    titles.value = task.titles || task.titleList || []
    selectedTitleIndices.value = []
  } catch (e) {
    uni.showToast({ title: '获取标题失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function toggleTitle(idx) {
  const i = selectedTitleIndices.value.indexOf(idx)
  if (i >= 0) {
    selectedTitleIndices.value.splice(i, 1)
  } else {
    selectedTitleIndices.value.push(idx)
  }
}

function selectAllTitles() {
  selectedTitleIndices.value = titles.value.map((_, i) => i)
}

function clearTitles() {
  selectedTitleIndices.value = []
}

async function fetchContent() {
  if (selectedTitleIndices.value.length === 0) return
  loading.value = true
  try {
    const selected = selectedTitleIndices.value.map(i => titles.value[i])
    const result = await collectActionApi.fetchSelectedContent(taskId.value, selected)
    contents.value = Array.isArray(result) ? result : (result?.contents || result?.list || [])
    step.value = 3
  } catch (e) {
    uni.showToast({ title: '抓取内容失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function onScopeChange(e) {
  scopeIndex.value = e.detail.value
}

function getQualityClass(score) {
  if (score == null) return ''
  if (score >= 80) return 'high'
  if (score >= 60) return 'mid'
  return 'low'
}

function truncateText(text) {
  if (!text) return ''
  return text.length > 200 ? text.slice(0, 200) + '...' : text
}

async function confirmImport() {
  if (scopeValue.value === 'tenant' && !targetTenantId.value) {
    uni.showToast({ title: '请选择目标租户', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const scope = hasPermission('menu.tenant') ? scopeValue.value : 'current'
    const tenantId = scope === 'tenant' ? targetTenantId.value : undefined
    const result = await collectActionApi.confirmImport(taskId.value, contents.value, scope, tenantId)
    importedCount.value = result?.importedCount ?? result?.count ?? contents.value.length
    step.value = 4
    uni.showToast({ title: '导入成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '导入失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goDraftList() {
  uni.navigateTo({ url: '/pages/studio/article-draft/list' })
}

onLoad(() => {
  loadSources()
})
</script>

<style scoped>
page {
  background: #f5f5f5;
}
.page-container {
  min-height: 100vh;
  padding: 20rpx;
  box-sizing: border-box;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #fff;
  padding: 20rpx 24rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}
.step-num {
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
  background: #1989fa;
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
}
.step-title {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
}
.card-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.picker-value {
  font-size: 28rpx;
  color: #333;
  padding: 16rpx 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
}

.select-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 12rpx;
}
.link {
  font-size: 26rpx;
  color: #1989fa;
}

.title-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.check-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
}
.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4rpx;
}
.checkbox.checked {
  background: #1989fa;
  border-color: #1989fa;
}
.check-icon {
  color: #fff;
  font-size: 28rpx;
  font-weight: bold;
}
.title-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.content-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
}
.content-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}
.content-meta {
  margin-bottom: 12rpx;
}
.quality-tag {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
  color: #fff;
  background: #999;
}
.quality-tag.high { background: #07c160; }
.quality-tag.mid { background: #faad14; }
.quality-tag.low { background: #ff4d4f; }
.content-body {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

.btn-row {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}
.btn-primary {
  flex: 1;
  background: #ff0000;
  color: #fff;
  padding: 20rpx;
  font-size: 30rpx;
  border-radius: 8rpx;
  border: none;
  text-align: center;
}
.btn-primary[disabled] {
  background: #ccc;
  color: #fff;
}
.btn-default {
  flex: 1;
  background: #f5f5f5;
  color: #333;
  padding: 20rpx;
  font-size: 30rpx;
  border-radius: 8rpx;
  border: none;
  text-align: center;
}

.loading, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}
.empty-text {
  font-size: 28rpx;
  color: #999;
}

.success-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 80rpx 40rpx;
}
.success-icon {
  font-size: 100rpx;
}
.success-text {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}
.success-card .btn-primary {
  flex: none;
  padding: 20rpx 60rpx;
}
</style>
