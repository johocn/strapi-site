<template>
  <view class="page-container">
    <PageHeader title="发布中心" />

    <TenantSelector v-if="hasPermission('menu.tenant')" v-model="tenantId" @change="onTenantChange" />

    <view class="step-indicator">
      <view class="step-num">{{ step }}/3</view>
      <text class="step-title">{{ stepLabels[step - 1] }}</text>
    </view>

    <!-- Step 1: 选择文章 -->
    <view v-if="step === 1" class="step-content">
      <view class="card">
        <view class="card-label">筛选</view>
        <view class="filter-row">
          <input
            v-model="categoryFilter"
            placeholder="按分类筛选"
            class="filter-input"
            @confirm="loadArticles"
          />
        </view>
      </view>

      <view class="card">
        <view class="card-label">选择文章（已选 {{ selectedArticleIds.length }} 篇）</view>
        <scroll-view scroll-y class="scroll-list">
          <view
            v-for="item in articles"
            :key="item.documentId"
            class="check-item"
            @click="toggleArticle(item.documentId)"
          >
            <view class="checkbox" :class="{ checked: selectedArticleIds.includes(item.documentId) }">
              <text v-if="selectedArticleIds.includes(item.documentId)" class="check-icon">✓</text>
            </view>
            <view class="item-info">
              <view class="item-title">{{ item.title }}</view>
              <view class="item-meta">
                <text class="meta-text">📂 {{ item.category || '未分类' }}</text>
                <text v-if="hasPermission('menu.tenant')" class="scope-tag">{{ getScopeText(item) }}</text>
              </view>
            </view>
          </view>
          <view v-if="!loading && articles.length === 0" class="empty-inline">
            <text class="empty-text">暂无可发布文章</text>
          </view>
        </scroll-view>
      </view>

      <view class="btn-row">
        <button class="btn-primary" :disabled="selectedArticleIds.length === 0" @click="step = 2">
          下一步（选择账号）
        </button>
      </view>
    </view>

    <!-- Step 2: 选择发布账号 -->
    <view v-if="step === 2" class="step-content">
      <view class="card">
        <view class="card-label">选择发布账号（已选 {{ selectedAccountIds.length }} 个）</view>
        <scroll-view scroll-y class="scroll-list">
          <view v-for="group in accountGroups" :key="group.platformName" class="platform-group">
            <view class="platform-header">{{ group.platformName }}</view>
            <view
              v-for="account in group.accounts"
              :key="account.documentId"
              class="check-item"
              @click="toggleAccount(account.documentId)"
            >
              <view class="checkbox" :class="{ checked: selectedAccountIds.includes(account.documentId) }">
                <text v-if="selectedAccountIds.includes(account.documentId)" class="check-icon">✓</text>
              </view>
              <view class="item-info">
                <view class="item-title">{{ account.name }}</view>
                <view class="item-meta">
                  <text class="meta-text">{{ getPlatformName(account.platform) }}</text>
                </view>
              </view>
            </view>
          </view>
          <view v-if="!loading && accountGroups.length === 0" class="empty-inline">
            <text class="empty-text">暂无可用账号</text>
          </view>
        </scroll-view>
      </view>

      <view class="btn-row">
        <button class="btn-default" @click="step = 1">上一步</button>
        <button
          class="btn-primary"
          :disabled="selectedAccountIds.length === 0 || publishing"
          @click="startPublish"
        >
          {{ publishing ? '发布中...' : `发布到选中平台（${selectedAccountIds.length}）` }}
        </button>
      </view>
    </view>

    <!-- Step 3: 发布结果 -->
    <view v-if="step === 3" class="step-content">
      <view v-if="publishing" class="card">
        <view class="card-label">发布进度（{{ publishResults.length }} / {{ selectedArticleIds.length }} 篇）</view>
      </view>

      <view v-if="!publishing" class="stats-card">
        <view class="stat-item success">
          <text class="stat-num">{{ successCount }}</text>
          <text class="stat-label">成功</text>
        </view>
        <view class="stat-item fail">
          <text class="stat-num">{{ failCount }}</text>
          <text class="stat-label">失败</text>
        </view>
      </view>

      <view class="result-list">
        <view v-for="(record, idx) in publishResults" :key="idx" class="result-card">
          <view class="result-header">
            <text class="result-article">{{ record.articleTitle }}</text>
            <text class="result-status" :class="record.success ? 'ok' : 'fail'">
              {{ record.success ? '成功' : '失败' }}
            </text>
          </view>
          <view class="result-meta">
            <text v-if="record.platformName" class="meta-text">平台：{{ record.platformName }}</text>
            <text v-if="record.externalId" class="meta-text">外部ID：{{ record.externalId }}</text>
            <text v-if="record.error" class="meta-text error-text">{{ record.error }}</text>
          </view>
          <view v-if="!record.success && record.recordId" class="retry-btn" @click="retryRecord(idx)">
            重试
          </view>
        </view>
      </view>

      <view class="btn-row">
        <button class="btn-default" @click="resetAll">重新发布</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { articleDraftApi, publishAccountApi, publishActionApi } from '../../../src/api/studio.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import TenantSelector from '../../../src/components/TenantSelector.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const step = ref(1)
const stepLabels = ['选择文章', '选择发布账号', '发布']
const loading = ref(false)
const publishing = ref(false)

const tenantId = ref('')

// Step 1
const articles = ref([])
const selectedArticleIds = ref([])
const categoryFilter = ref('')

// Step 2
const accounts = ref([])
const selectedAccountIds = ref([])

// Step 3
const publishResults = ref([])

const successCount = computed(() => publishResults.value.filter(r => r.success).length)
const failCount = computed(() => publishResults.value.filter(r => !r.success).length)

const accountGroups = computed(() => {
  const groups = {}
  accounts.value.forEach(account => {
    const platformName = getPlatformName(account.platform)
    if (!groups[platformName]) {
      groups[platformName] = { platformName, accounts: [] }
    }
    groups[platformName].accounts.push(account)
  })
  return Object.values(groups)
})

function getPlatformName(platform) {
  if (!platform) return '未绑定'
  if (typeof platform === 'string') return platform
  return platform.name || platform.documentId || '未命名'
}

function getScopeText(article) {
  const scopeMap = {
    global: '全局',
    tenant: '指定租户',
    current: '当前租户'
  }
  return scopeMap[article.scope] || '当前租户'
}

async function loadArticles() {
  loading.value = true
  try {
    const params = {
      'pagination[pageSize]': 100,
      'filters[status]': 'ready',
      'populate': '*'
    }
    if (categoryFilter.value) {
      params['filters[category][$contains]'] = categoryFilter.value
    }
    if (tenantId.value) {
      params['filters[tenantId]'] = tenantId.value
    }
    const { list } = await articleDraftApi.list(params)
    articles.value = list
  } catch (e) {
    uni.showToast({ title: '加载文章失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadAccounts() {
  loading.value = true
  try {
    const params = {
      'pagination[pageSize]': 100,
      'filters[isActive]': true,
      'populate': '*'
    }
    if (tenantId.value) {
      params['filters[tenantId]'] = tenantId.value
    }
    const { list } = await publishAccountApi.list(params)
    accounts.value = list
  } catch (e) {
    uni.showToast({ title: '加载账号失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function onTenantChange() {
  selectedArticleIds.value = []
  selectedAccountIds.value = []
  loadArticles()
  loadAccounts()
}

function toggleArticle(id) {
  const i = selectedArticleIds.value.indexOf(id)
  if (i >= 0) {
    selectedArticleIds.value.splice(i, 1)
  } else {
    selectedArticleIds.value.push(id)
  }
}

function toggleAccount(id) {
  const i = selectedAccountIds.value.indexOf(id)
  if (i >= 0) {
    selectedAccountIds.value.splice(i, 1)
  } else {
    selectedAccountIds.value.push(id)
  }
}

async function startPublish() {
  step.value = 3
  publishing.value = true
  publishResults.value = []

  for (const articleId of selectedArticleIds.value) {
    const article = articles.value.find(a => a.documentId === articleId)
    const articleTitle = article?.title || articleId

    try {
      const result = await publishActionApi.publishArticle(articleId, selectedAccountIds.value)
      const records = Array.isArray(result) ? result : (result?.results || [result])
      records.forEach(record => {
        publishResults.value.push({
          articleTitle,
          articleId,
          recordId: record.recordId || record.documentId || record.id,
          accountId: record.accountId,
          platformName: record.platformName || getPlatformName(record.platform),
          success: record.success !== false && record.status !== 'failed',
          externalId: record.externalId || '',
          error: record.error || record.errorMessage || ''
        })
      })
    } catch (e) {
      publishResults.value.push({
        articleTitle,
        articleId,
        success: false,
        error: e?.message || '发布请求失败'
      })
    }
  }

  publishing.value = false
  const msg = `发布完成：成功 ${successCount.value} 条，失败 ${failCount.value} 条`
  uni.showToast({ title: msg, icon: 'none', duration: 3000 })
}

async function retryRecord(idx) {
  const record = publishResults.value[idx]
  if (!record.recordId) return

  uni.showLoading({ title: '重试中...' })
  try {
    const result = await publishActionApi.retryPublish(record.recordId)
    publishResults.value[idx] = {
      ...record,
      success: result?.success !== false && result?.status !== 'failed',
      externalId: result?.externalId || record.externalId || '',
      error: result?.error || result?.errorMessage || ''
    }
    uni.showToast({ title: '重试成功', icon: 'success' })
  } catch (e) {
    publishResults.value[idx].error = e?.message || '重试失败'
    uni.showToast({ title: '重试失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function resetAll() {
  step.value = 1
  selectedArticleIds.value = []
  selectedAccountIds.value = []
  publishResults.value = []
}

onLoad(() => {
  loadArticles()
  loadAccounts()
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

.filter-row {
  display: flex;
  gap: 16rpx;
}
.filter-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 20rpx;
}

.scroll-list {
  max-height: 800rpx;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.check-item:last-child {
  border-bottom: none;
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
.item-info {
  flex: 1;
}
.item-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}
.item-meta {
  display: flex;
  gap: 16rpx;
  align-items: center;
}
.meta-text {
  font-size: 24rpx;
  color: #999;
}
.scope-tag {
  font-size: 22rpx;
  color: #1989fa;
  background: #e6f3ff;
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
}

.platform-group {
  margin-bottom: 20rpx;
}
.platform-header {
  font-size: 26rpx;
  font-weight: bold;
  color: #666;
  padding: 12rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
}

.empty-inline {
  padding: 40rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 28rpx;
  color: #999;
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

.stats-card {
  display: flex;
  gap: 20rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 40rpx 24rpx;
}
.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}
.stat-num {
  font-size: 56rpx;
  font-weight: bold;
}
.stat-item.success .stat-num { color: #07c160; }
.stat-item.fail .stat-num { color: #ff4d4f; }
.stat-label {
  font-size: 26rpx;
  color: #999;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.result-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
}
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}
.result-article {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}
.result-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
  color: #fff;
}
.result-status.ok { background: #07c160; }
.result-status.fail { background: #ff4d4f; }
.result-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.error-text {
  color: #ff4d4f;
}
.retry-btn {
  display: inline-block;
  margin-top: 12rpx;
  padding: 8rpx 24rpx;
  background: #fff0f0;
  color: #ff4d4f;
  font-size: 24rpx;
  border-radius: 8rpx;
  text-align: center;
  align-self: flex-start;
}
</style>
