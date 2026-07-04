<template>
  <view class="page-container">
    <PageHeader title="课程详情">
      <button v-if="(course.status === 'draft' || course.status === 'pending') && hasPermission('course.publish')" class="btn-publish" @click="handlePublish">发布</button>
      <button v-if="course.status === 'published' && hasPermission('course.publish')" class="btn-unpublish" @click="handleUnpublish">下架</button>
      <button v-if="hasPermission('course.update')" class="btn-secondary" @click="goEdit">编辑</button>
    </PageHeader>

    <scroll-view scroll-y class="detail-scroll">
      <view class="cover-section">
        <image 
          :src="course.coverUrl || '/static/default-course.png'" 
          mode="aspectFill"
          class="cover-image"
        />
        <view class="cover-overlay">
          <view class="course-title">{{ course.title }}</view>
          <view class="course-meta">
            <text v-if="course.author">{{ course.author }}</text>
            <text v-if="course.category?.name">· {{ course.category.name }}</text>
          </view>
        </view>
      </view>

      <view class="info-section">
        <view class="section-title">基本信息</view>
        <view class="info-grid">
          <view class="info-item">
            <text class="info-label">状态</text>
            <text class="info-value" :class="course.status">{{ getStatusText(course.status) }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">难度</text>
            <text class="info-value">{{ course.difficulty }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">级别</text>
            <text class="info-value">{{ course.level }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">时长</text>
            <text class="info-value">{{ course.duration || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">学生数</text>
            <text class="info-value">{{ course.studentCount || 0 }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">浏览量</text>
            <text class="info-value">{{ course.viewCount || 0 }}</text>
          </view>
        </view>
      </view>

      <view class="info-section">
        <view class="section-title">价格信息</view>
        <view class="price-row">
          <view class="price-item">
            <text class="price-label">现价</text>
            <text class="price-value">¥{{ course.price || 0 }}</text>
          </view>
          <view class="price-item">
            <text class="price-label">原价</text>
            <text class="price-value original">¥{{ course.originalPrice || 0 }}</text>
          </view>
          <view class="price-item">
            <text class="price-label">折扣价</text>
            <text class="price-value">¥{{ course.discountPrice || 0 }}</text>
          </view>
        </view>
        <view class="price-tags">
          <text v-if="course.isFree" class="price-tag free">免费</text>
          <text v-if="course.isPaid" class="price-tag paid">付费</text>
          <text v-if="course.isFeatured" class="price-tag featured">推荐</text>
        </view>
      </view>

      <view class="info-section">
        <view class="section-title">课程描述</view>
        <view class="description-content">{{ course.description || '-' }}</view>
      </view>

      <view class="info-section">
        <view class="section-title">时间设置</view>
        <view class="time-grid">
          <view class="time-item">
            <text class="time-label">报名开始</text>
            <text class="time-value">{{ formatDate(course.enrollStartDate) }}</text>
          </view>
          <view class="time-item">
            <text class="time-label">报名结束</text>
            <text class="time-value">{{ formatDate(course.enrollEndDate) }}</text>
          </view>
          <view class="time-item">
            <text class="time-label">课程开始</text>
            <text class="time-value">{{ formatDate(course.courseStartDate) }}</text>
          </view>
          <view class="time-item">
            <text class="time-label">课程结束</text>
            <text class="time-value">{{ formatDate(course.courseEndDate) }}</text>
          </view>
        </view>
      </view>

      <view class="info-section">
        <view class="section-title">标签</view>
        <view class="tag-list">
          <view v-for="tag in course.tags" :key="tag.documentId" class="tag-item">
            {{ tag.name }}
          </view>
        </view>
      </view>

      <view v-if="knowledgePointTags.length" class="info-section">
        <view class="section-title">知识点</view>
        <view class="tag-list">
          <view v-for="kp in knowledgePointTags" :key="kp.documentId" class="tag-item kp">
            {{ kp.name }}
          </view>
        </view>
      </view>

      <view class="info-section">
        <view class="section-title">课时列表</view>
        <view v-if="course.lessons?.length > 0" class="lesson-list">
          <view 
            v-for="lesson in course.lessons" 
            :key="lesson.documentId" 
            class="lesson-item"
          >
            <view class="lesson-index">{{ lesson.sequenceNumber || 0 }}</view>
            <view class="lesson-info">
              <view class="lesson-title">{{ lesson.title }}</view>
              <view class="lesson-meta">
                <text class="lesson-type">{{ getLessonType(lesson.type) }}</text>
                <text class="lesson-duration">⏱️ {{ formatDuration(lesson.duration) }}</text>
              </view>
            </view>
            <view class="lesson-status">
              <text v-if="lesson.isFreePreview" class="free-tag">可预览</text>
              <text v-if="lesson.isRequired" class="required-tag">必修</text>
            </view>
          </view>
        </view>
        <view v-else class="empty-lessons">
          <text>暂无课时</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCourseDetail, publishCourse, unpublishCourse } from '../../src/api/course.js'
import { useUserStore } from '../../src/store/user.js'
import PageHeader from '../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const course = ref({})

const knowledgePointTags = computed(() => {
  if (!course.value?.tags) return []
  return course.value.tags.filter(t => t.tagGroup?.slug === 'knowledge-point')
})

const statusMap = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  archived: '已归档'
}

const lessonTypeMap = {
  video: '视频',
  audio: '音频',
  article: '图文',
  quiz: '测验'
}

function getStatusText(status) {
  return statusMap[status] || status
}

function getLessonType(type) {
  return lessonTypeMap[type] || type
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.split('T')[0]
}

function formatDuration(seconds) {
  if (!seconds) return '-'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function goEdit() {
  const id = course.value.documentId
  uni.navigateTo({ url: `/pages/course/form?id=${id}` })
}

async function handlePublish() {
  uni.showModal({
    title: '确认发布',
    content: '确定要发布此课程吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '发布中...' })
          await publishCourse(course.value.documentId)
          uni.hideLoading()
          uni.showToast({ title: '发布成功', icon: 'success' })
          course.value = await getCourseDetail(course.value.documentId)
        } catch (e) {
          uni.hideLoading()
          uni.showToast({ title: '发布失败', icon: 'none' })
        }
      }
    }
  })
}

async function handleUnpublish() {
  uni.showModal({
    title: '确认下架',
    content: '确定要下架此课程吗？下架后C端将无法查看该课程。',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '下架中...' })
          await unpublishCourse(course.value.documentId)
          uni.hideLoading()
          uni.showToast({ title: '已下架', icon: 'success' })
          course.value = await getCourseDetail(course.value.documentId)
        } catch (e) {
          uni.hideLoading()
          uni.showToast({ title: '下架失败', icon: 'none' })
        }
      }
    }
  })
}

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}
  
  if (options.id) {
    try {
      course.value = await getCourseDetail(options.id)
    } catch (e) {
      uni.showToast({ title: '加载失败', icon: 'none' })
    }
  }
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.btn-secondary {
  padding: 16rpx 32rpx;
  border: 1rpx solid #1989fa;
  color: #1989fa;
  background: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.btn-publish {
  padding: 16rpx 32rpx;
  border: none;
  color: #fff;
  background: #07c160;
  border-radius: 8rpx;
  font-size: 28rpx;
  margin-right: 16rpx;
}

.btn-unpublish {
  padding: 16rpx 32rpx;
  border: none;
  color: #fff;
  background: #ff9500;
  border-radius: 8rpx;
  font-size: 28rpx;
  margin-right: 16rpx;
}

.detail-scroll {
  height: calc(100vh - 88rpx);
}

.cover-section {
  position: relative;
  height: 300rpx;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: 40rpx 20rpx 20rpx;
}

.course-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8rpx;
}

.course-meta {
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
}

.info-section {
  background: #fff;
  margin: 20rpx;
  border-radius: 12rpx;
  padding: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background: #f9f9f9;
  border-radius: 8rpx;
}

.info-label {
  font-size: 26rpx;
  color: #666;
}

.info-value {
  font-size: 26rpx;
  color: #333;
}

.info-value.draft { color: #999; }
.info-value.pending { color: #ff9500; }
.info-value.published { color: #07c160; }
.info-value.archived { color: #666; }

.price-row {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
}

.price-item {
  text-align: center;
}

.price-label {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.price-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff5722;
}

.price-value.original {
  color: #999;
  text-decoration: line-through;
  font-weight: normal;
}

.price-tags {
  display: flex;
  gap: 12rpx;
}

.price-tag {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.price-tag.free { background: #e8f5e9; color: #07c160; }
.price-tag.paid { background: #fff3e0; color: #ff9500; }
.price-tag.featured { background: #e3f2fd; color: #1989fa; }

.description-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.time-item {
  padding: 12rpx;
}

.time-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.time-value {
  font-size: 26rpx;
  color: #333;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-item {
  padding: 8rpx 20rpx;
  background: #e3f2fd;
  color: #1989fa;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.tag-item.kp {
  background: #f3e5f5;
  color: #9c27b0;
}

.lesson-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.lesson-item {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: #f9f9f9;
  border-radius: 8rpx;
}

.lesson-index {
  width: 48rpx;
  height: 48rpx;
  background: #1989fa;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  margin-right: 16rpx;
}

.lesson-info {
  flex: 1;
}

.lesson-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 4rpx;
}

.lesson-meta {
  display: flex;
  gap: 16rpx;
  font-size: 22rpx;
  color: #999;
}

.lesson-status {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.free-tag, .required-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.free-tag { background: #e3f2fd; color: #1989fa; }
.required-tag { background: #fff3e0; color: #ff9500; }

.empty-lessons {
  text-align: center;
  padding: 40rpx;
  color: #999;
}
</style>