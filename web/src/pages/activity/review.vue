<template>
  <view class="page-container">
    <PageHeader title="活动评价">
      <view class="header-right">
        <button class="btn-query" @click="loadData(1)">查询</button>
      </view>
    </PageHeader>

    <view class="filter-section">
      <view class="filter-item">
        <text class="filter-label">活动</text>
        <picker mode="selector" :range="activityNames" :value="activityIndex" @change="handleActivityChange">
          <view class="picker-value" :class="{ empty: !activityDId }">
            <text>{{ activityNames[activityIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 汇总统计卡 -->
    <view class="summary-grid" v-if="summary">
      <view class="summary-card">
        <text class="summary-value">{{ summary.count ?? 0 }}</text>
        <text class="summary-label">评价数</text>
      </view>
      <view class="summary-card">
        <text class="summary-value">{{ summary.avgRating ?? '-' }}</text>
        <text class="summary-label">平均分</text>
      </view>
      <view class="summary-card">
        <text class="summary-value">{{ summary.avgNps ?? '-' }}</text>
        <text class="summary-label">平均NPS</text>
      </view>
      <view class="summary-card">
        <text class="summary-value" :class="npsClass(summary.npsScore)">{{ summary.npsScore ?? 0 }}</text>
        <text class="summary-label">NPS得分</text>
      </view>
    </view>
    <view class="nps-grid" v-if="summary">
      <view class="nps-cell detractor">
        <text class="nps-value">{{ summary.detractor ?? 0 }}</text>
        <text class="nps-label">贬损者</text>
      </view>
      <view class="nps-cell passive">
        <text class="nps-value">{{ summary.passive ?? 0 }}</text>
        <text class="nps-label">中立者</text>
      </view>
      <view class="nps-cell promoter">
        <text class="nps-value">{{ summary.promoter ?? 0 }}</text>
        <text class="nps-label">推荐者</text>
      </view>
    </view>

    <!-- 评分分布 -->
    <view class="dist-section" v-if="summary">
      <text class="dist-title">评分分布</text>
      <view v-for="(cnt, star) in distRows" :key="star" class="dist-row">
        <text class="dist-star">{{ star }}★</text>
        <view class="dist-track">
          <view class="dist-fill" :style="{ width: distPercent(star) + '%' }"></view>
        </view>
        <text class="dist-count">{{ cnt }}</text>
      </view>
    </view>

    <!-- 评分均值趋势（按周，最近12周） -->
    <view v-if="summary && summary.trend && summary.trend.length" class="trend-section">
      <text class="trend-title">评分趋势（按周）</text>
      <view v-for="tp in summary.trend" :key="tp.weekLabel" class="trend-row">
        <text class="trend-week">{{ tp.weekLabel.slice(5) }}</text>
        <text class="trend-count">{{ tp.count }}条</text>
        <view class="trend-track">
          <view class="trend-fill" :style="{ width: ratingWidth(tp.avgRating) + '%' }"></view>
        </view>
        <text class="trend-rating">{{ tp.avgRating ?? '-' }}分</text>
        <text class="trend-nps">NPS {{ tp.avgNps ?? '-' }}</text>
      </view>
    </view>

    <!-- 评价关键词（词频 Top） -->
    <view v-if="summary && summary.keywords && summary.keywords.length" class="kw-section">
      <text class="kw-title">评价关键词</text>
      <view class="kw-cloud">
        <view v-for="(k, i) in summary.keywords" :key="k.text" class="kw-chip" :class="'kw-lv' + kwLevel(i)">
          <text class="kw-text">{{ k.text }}</text>
          <text class="kw-count">{{ k.value }}</text>
        </view>
      </view>
    </view>

    <view class="review-list" v-if="!loading && rows.length > 0">
      <view v-for="row in rows" :key="row.id" class="review-card">
        <view class="review-head">
          <text class="review-user">{{ row.user?.username ?? '匿名用户' }}</text>
          <text class="review-activity">{{ row.activity?.title ?? '-' }}</text>
        </view>
        <view class="review-meta">
          <text v-if="row.rating != null" class="review-stars">★ {{ row.rating }}</text>
          <text v-if="row.nps != null" class="review-nps">NPS {{ row.nps }}</text>
          <text class="review-time">{{ formatTime(row.reviewedAt) }}</text>
        </view>
        <view class="review-body">
          <text class="review-text">{{ row.review || '（无文字）' }}</text>
        </view>
        <view class="review-ops" v-if="row.id">
          <view class="review-op" @click.stop="toggleHidden(row)">{{ row.reviewHidden ? '恢复显示' : '隐藏' }}</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>
    <view v-if="!loading && rows.length === 0" class="empty-state">
      <text class="empty-icon">⭐</text>
      <text class="empty-text">暂无评价数据</text>
    </view>

    <view class="pagination" v-if="pagination.pageCount > 1">
      <view class="pagination-btn" @click="prevPage" :class="{ disabled: currentPage === 1 }">上一页</view>
      <text class="pagination-info">{{ currentPage }} / {{ pagination.pageCount }}</text>
      <view class="pagination-btn" @click="nextPage" :class="{ disabled: currentPage >= pagination.pageCount }">下一页</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getActivityReviews, setActivityReviewHidden, listActivities } from '../../api/activity.js'
import PageHeader from '../../components/PageHeader.vue'

const activityList = ref([])
const activityDId = ref('')
const activityIndex = ref(0)
const rows = ref([])
const summary = ref(null)
const pagination = ref({ page: 1, pageSize: 20, pageCount: 1 })
const currentPage = ref(1)
const loading = ref(false)

const activityNames = computed(() => {
  const names = ['全部活动']
  for (const a of activityList.value) names.push(a.title || a.documentId || '未命名活动')
  return names
})

const maxDist = computed(() => {
  const arr = summary.value?.ratingDist ?? []
  return Math.max(...arr.map(n => Number(n) || 0), 1)
})

const distRows = computed(() => {
  const arr = summary.value?.ratingDist ?? []
  const out = []
  for (let i = 0; i < 6; i++) out.push({ star: i, count: arr[i] ?? 0 })
  return out
})

function distPercent(star) {
  const row = distRows.value.find(r => r.star === star)
  return row ? Math.round((row.count / maxDist.value) * 100) : 0
}

// 趋势条宽度（0~5 分映射到百分比）
function ratingWidth(r) {
  if (r == null) return 0
  return Math.round(Math.max(0, Math.min(5, r)) / 5 * 100)
}

// 关键词层级：按词频排序位次放大字号（前3/前6/其余）
function kwLevel(i) {
  if (i < 3) return 3
  if (i < 6) return 2
  return 1
}

function npsClass(score) {
  if (score == null) return ''
  if (score >= 50) return 'nps-good'
  if (score >= 0) return 'nps-mid'
  return 'nps-bad'
}

function formatTime(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function handleActivityChange(e) {
  activityIndex.value = Number(e.detail.value)
  const idx = activityIndex.value
  activityDId.value = idx === 0 ? '' : (activityList.value[idx - 1]?.documentId ?? '')
}

async function loadActivities() {
  try {
    const res = await listActivities({ pageSize: 1000 })
    const list = res?.list || res?.data || []
    activityList.value = list
  } catch (e) {
    /* 活动下拉失败不阻断评价加载 */
  }
}

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = { page, pageSize: pagination.value.pageSize }
    if (activityDId.value) params.activityDId = activityDId.value
    const res = await getActivityReviews(params)
    const payload = res?.data ?? res ?? {}
    rows.value = Array.isArray(payload.rows) ? payload.rows : []
    summary.value = payload.summary ?? null
    pagination.value = { page: 1, pageSize: 20, pageCount: 1, ...(payload.pagination ?? {}) }
    currentPage.value = page
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function prevPage() { if (currentPage.value > 1) loadData(currentPage.value - 1) }
function nextPage() { if (currentPage.value < (pagination.value.pageCount || 1)) loadData(currentPage.value + 1) }

async function toggleHidden(row) {
  try {
    const next = !row.reviewHidden
    await setActivityReviewHidden(row.id, next)
    row.reviewHidden = next
    uni.showToast({ title: next ? '已隐藏' : '已恢复', icon: 'none' })
    loadData(currentPage.value)
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

onMounted(() => {
  loadActivities()
  loadData(1)
})
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx; box-sizing: border-box; }
.header-right { display: flex; align-items: center; }
.btn-query {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff; padding: 16rpx 40rpx; font-size: 30rpx;
  border-radius: 40rpx; border: none; line-height: 1.2;
}
.filter-section { background: #fff; border-radius: 12rpx; padding: 20rpx; margin-bottom: 20rpx; }
.filter-item { display: flex; align-items: center; gap: 12rpx; }
.filter-label { font-size: 26rpx; color: #666; flex-shrink: 0; }
.picker-value {
  flex: 1; display: flex; justify-content: space-between; align-items: center;
  padding: 12rpx 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 26rpx;
  min-height: 44rpx;
}
.picker-value.empty { color: #999; }
.arrow { font-size: 20rpx; color: #999; }

.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16rpx; margin-bottom: 16rpx; }
.summary-card { background: #fff; border-radius: 12rpx; padding: 24rpx 16rpx; text-align: center; }
.summary-value { display: block; font-size: 44rpx; font-weight: bold; color: #333; }
.summary-value.nps-good { color: #52c41a; }
.summary-value.nps-mid { color: #fa8c16; }
.summary-value.nps-bad { color: #ff4d4f; }
.summary-label { display: block; font-size: 24rpx; color: #999; margin-top: 8rpx; }

.nps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; margin-bottom: 20rpx; }
.nps-cell { background: #fff; border-radius: 12rpx; padding: 20rpx 16rpx; text-align: center; }
.nps-cell.detractor .nps-value { color: #ff4d4f; }
.nps-cell.passive .nps-value { color: #fa8c16; }
.nps-cell.promoter .nps-value { color: #52c41a; }
.nps-value { display: block; font-size: 40rpx; font-weight: bold; }
.nps-label { display: block; font-size: 22rpx; color: #999; margin-top: 6rpx; }

.dist-section { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 20rpx; }
.dist-title { display: block; font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.dist-row { display: flex; align-items: center; margin-bottom: 16rpx; }
.dist-row:last-child { margin-bottom: 0; }
.dist-star { width: 80rpx; font-size: 26rpx; color: #666; flex-shrink: 0; }
.dist-track { flex: 1; height: 32rpx; background: #f5f5f5; border-radius: 16rpx; margin: 0 20rpx; overflow: hidden; }
.dist-fill { height: 100%; border-radius: 16rpx; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-width: 8rpx; }
.dist-count { width: 60rpx; font-size: 26rpx; font-weight: bold; color: #333; text-align: right; flex-shrink: 0; }

.trend-section { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 20rpx; }
.trend-title { display: block; font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.trend-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.trend-row:last-child { margin-bottom: 0; }
.trend-week { width: 90rpx; font-size: 24rpx; color: #666; flex-shrink: 0; }
.trend-count { width: 64rpx; font-size: 22rpx; color: #999; flex-shrink: 0; }
.trend-track { flex: 1; height: 28rpx; background: #f5f5f5; border-radius: 14rpx; overflow: hidden; }
.trend-fill { height: 100%; border-radius: 14rpx; background: linear-gradient(90deg, #52c41a 0%, #fa8c16 100%); min-width: 6rpx; }
.trend-rating { width: 70rpx; font-size: 26rpx; font-weight: bold; color: #333; text-align: right; flex-shrink: 0; }
.trend-nps { width: 110rpx; font-size: 22rpx; color: #667eea; text-align: right; flex-shrink: 0; }

.kw-section { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 20rpx; }
.kw-title { display: block; font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.kw-cloud { display: flex; flex-wrap: wrap; gap: 16rpx; }
.kw-chip {
  display: inline-flex; align-items: center; gap: 8rpx;
  padding: 8rpx 20rpx; border-radius: 32rpx; background: #f5f5f5;
}
.kw-text { color: #333; font-weight: bold; }
.kw-count { color: #999; }
.kw-lv3 .kw-text { font-size: 30rpx; }
.kw-lv2 .kw-text { font-size: 26rpx; }
.kw-lv1 .kw-text { font-size: 22rpx; }

.review-list { display: flex; flex-direction: column; gap: 16rpx; }
.review-card { background: #fff; border-radius: 12rpx; padding: 24rpx; }
.review-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; gap: 16rpx; }
.review-user { font-size: 30rpx; font-weight: bold; color: #333; }
.review-activity { font-size: 24rpx; color: #999; flex-shrink: 0; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.review-meta { display: flex; gap: 24rpx; margin-bottom: 12rpx; }
.review-stars { font-size: 26rpx; color: #fa8c16; font-weight: bold; }
.review-nps { font-size: 26rpx; color: #667eea; }
.review-time { font-size: 24rpx; color: #999; }
.review-body { padding-top: 16rpx; border-top: 1rpx solid #f0f0f0; }
.review-text { font-size: 26rpx; color: #333; line-height: 1.6; }
.review-ops { margin-top: 12rpx; display: flex; justify-content: flex-end; }
.review-op { font-size: 24rpx; color: #667eea; border: 1rpx solid #667eea; padding: 4rpx 16rpx; border-radius: 20rpx; }

.loading, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #999; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 40rpx; padding: 40rpx 0; }
.pagination-btn { padding: 16rpx 32rpx; background: #fff; border-radius: 8rpx; font-size: 28rpx; }
.pagination-btn.disabled { color: #999; background: #f5f5f5; }
.pagination-info { font-size: 28rpx; color: #666; }
</style>