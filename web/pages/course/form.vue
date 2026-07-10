<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑课程' : '新增课程'">
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        
        <view class="form-item">
          <text class="form-label">课程名称 *</text>
          <input 
            type="text" 
            v-model="form.title" 
            placeholder="请输入课程名称"
            class="form-input"
          />
        </view>

        <view class="form-item">
          <text class="form-label">课程描述</text>
          <textarea 
            v-model="form.description" 
            placeholder="请输入课程描述"
            class="form-textarea"
          />
        </view>

        <view class="form-item">
          <text class="form-label">作者</text>
          <input 
            type="text" 
            v-model="form.author" 
            placeholder="请输入作者名称"
            class="form-input"
          />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">媒体资源</view>
        
        <view class="form-item">
          <text class="form-label">封面图</text>
          <view class="upload-area" @click="showCoverPicker = true">
            <image 
              v-if="form.coverUrl" 
              :src="form.coverUrl" 
              mode="aspectFill"
              class="upload-preview"
            />
            <view v-else class="upload-placeholder">
              <text class="upload-icon">📷</text>
              <text class="upload-text">点击上传封面图</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">缩略图</text>
          <view class="upload-area" @click="showThumbnailPicker = true">
            <image 
              v-if="form.thumbnailUrl" 
              :src="form.thumbnailUrl" 
              mode="aspectFill"
              class="upload-preview"
            />
            <view v-else class="upload-placeholder">
              <text class="upload-icon">📷</text>
              <text class="upload-text">点击上传缩略图</text>
            </view>
          </view>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">价格设置</view>
        
        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">免费课程</text>
            <switch :checked="form.isFree" @change="form.isFree = !form.isFree" />
          </view>
          <view class="form-item half">
            <text class="form-label">付费课程</text>
            <switch :checked="form.isPaid" @change="form.isPaid = !form.isPaid" />
          </view>
        </view>

        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">现价（分）</text>
            <input 
              type="number" 
              v-model="form.price" 
              placeholder="0"
              class="form-input"
            />
          </view>
          <view class="form-item half">
            <text class="form-label">原价（分）</text>
            <input 
              type="number" 
              v-model="form.originalPrice" 
              placeholder="0"
              class="form-input"
            />
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">折扣价（分）</text>
          <input 
            type="number" 
            v-model="form.discountPrice" 
            placeholder="0"
            class="form-input"
          />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">分类标签</view>
        
        <view class="form-item">
          <text class="form-label">课程分类</text>
          <picker mode="selector" :range="categoryOptions" @change="handleCategoryChange">
            <view class="picker-value">
              <text>{{ selectedCategoryName || '请选择分类' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">课程标签</text>
          <view class="tag-list">
            <view
              v-for="tag in selectedTags"
              :key="tag.documentId"
              class="tag-item"
            >
              <text>{{ tag.name }}</text>
              <text class="tag-remove" @click="removeTag(tag)">×</text>
            </view>
            <view class="tag-add" @click="showTagPicker = true">
              <text>+ 添加标签</text>
            </view>
          </view>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">知识点关联</view>

        <view class="form-item">
          <text class="form-label">关联知识点</text>
          <view class="tag-list">
            <view
              v-for="kp in selectedKnowledgePoints"
              :key="kp.documentId"
              class="tag-item knowledge-tag"
            >
              <text>{{ kp.name }}</text>
              <text class="tag-remove" @click="removeKnowledgePoint(kp)">×</text>
            </view>
            <view class="tag-add" @click="showKnowledgePointPicker = true">
              <text>+ 添加知识点</text>
            </view>
          </view>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">学习设置</view>
        
        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">难度级别</text>
            <picker mode="selector" :range="difficultyOptions" @change="handleDifficultyChange">
              <view class="picker-value">
                <text>{{ difficultyOptions[difficultyIndex] }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <view class="form-item half">
            <text class="form-label">课程等级</text>
            <picker mode="selector" :range="levelOptions" @change="handleLevelChange">
              <view class="picker-value">
                <text>{{ levelOptions[levelIndex] }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">课程时长（分钟）</text>
          <input 
            type="number" 
            v-model="form.duration" 
            placeholder="0"
            class="form-input"
          />
        </view>

        <view class="form-item">
          <text class="form-label">排序</text>
          <input
            type="number"
            v-model="form.sort"
            placeholder="0"
            class="form-input"
          />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">渠道设置</view>

        <view class="form-item">
          <text class="form-label">渠道范围</text>
          <view class="radio-group">
            <label class="radio-item" v-if="allowCrossChannelPublish" @click="setChannelScope('all')">
              <view class="radio-circle" :class="{ active: form.channelScope === 'all' }"></view>
              <text>全部渠道（跨渠道公开）</text>
            </label>
            <label class="radio-item" @click="setChannelScope('specific')">
              <view class="radio-circle" :class="{ active: form.channelScope === 'specific' }"></view>
              <text>指定渠道（渠道专属）</text>
            </label>
          </view>
        </view>

        <view v-if="form.channelScope === 'specific'" class="form-item">
          <text class="form-label">选择渠道 *</text>
          <view class="channel-picker-trigger" @click="showChannelPicker = true">
            <text :class="{ placeholder: !form.channelIds.length }">{{ selectedChannelNames() }}</text>
          </view>
        </view>

        <view v-if="form.channelScope === 'specific' && form.channelIds.length > 0" class="form-item">
          <text class="form-label">积分归属渠道 *</text>
          <view class="channel-picker-trigger" @click="showPointChannelPicker = true">
            <text :class="{ placeholder: !form.pointChannel }">{{ selectedPointChannelName() }}</text>
          </view>
          <text class="form-hint">学习本课程获得的积分将归属此渠道</text>
        </view>

        <view class="form-item" v-if="showCrossChannelSection && allowCrossChannelPublish">
          <text class="form-label">允许跨渠道访问</text>
          <view class="switch-row">
            <switch :checked="form.allowCrossChannel" @change="form.allowCrossChannel = !form.allowCrossChannel" />
            <text class="form-hint">关闭后，游客无法浏览此课程</text>
          </view>
        </view>
      </view>

      <view class="form-section" v-if="showPointsSection">
        <view class="section-title">积分设置</view>
        
        <view class="form-item">
          <text class="form-label">启用积分</text>
          <switch :checked="form.enablePoints" @change="form.enablePoints = !form.enablePoints" />
        </view>

        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">积分数量</text>
            <input 
              type="number" 
              v-model="form.points" 
              placeholder="0"
              class="form-input"
            />
          </view>
          <view class="form-item half">
            <text class="form-label">积分类型</text>
            <picker mode="selector" :range="pointsTypeOptions" @change="handlePointsTypeChange">
              <view class="picker-value">
                <text>{{ pointsTypeOptions[pointsTypeIndex] }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">时间设置</view>
        
        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">报名开始日期</text>
            <picker mode="date" @change="(e) => form.enrollStartDate = e.detail.value">
              <view class="picker-value">
                <text>{{ form.enrollStartDate || '选择日期' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <view class="form-item half">
            <text class="form-label">报名结束日期</text>
            <picker mode="date" @change="(e) => form.enrollEndDate = e.detail.value">
              <view class="picker-value">
                <text>{{ form.enrollEndDate || '选择日期' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>

        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">课程开始日期</text>
            <picker mode="date" @change="(e) => form.courseStartDate = e.detail.value">
              <view class="picker-value">
                <text>{{ form.courseStartDate || '选择日期' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <view class="form-item half">
            <text class="form-label">课程结束日期</text>
            <picker mode="date" @change="(e) => form.courseEndDate = e.detail.value">
              <view class="picker-value">
                <text>{{ form.courseEndDate || '选择日期' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">状态管理</view>
        
        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">课程状态</text>
            <picker mode="selector" :range="statusOptions" @change="handleStatusChange">
              <view class="picker-value">
                <text>{{ statusOptions[statusIndex] }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <view class="form-item half">
            <text class="form-label">审核状态</text>
            <picker mode="selector" :range="auditStatusOptions" @change="handleAuditStatusChange">
              <view class="picker-value">
                <text>{{ auditStatusOptions[auditStatusIndex] }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">精选课程</text>
          <switch :checked="form.isFeatured" @change="form.isFeatured = !form.isFeatured" />
        </view>
      </view>
    </scroll-view>

    <view class="bottom-action">
      <button class="btn-save" @click="handleSubmit">保存课程</button>
    </view>

    <!-- 标签选择器 -->
    <TagPicker
      v-model:visible="showTagPicker"
      :selected="selectedTags"
      @select="onTagSelect"
    />

    <!-- 知识点选择器 -->
    <TagPicker
      v-model:visible="showKnowledgePointPicker"
      mode="knowledge-point"
      :selected="selectedKnowledgePoints"
      @select="onKnowledgePointSelect"
    />

    <view v-if="showChannelPicker" class="tag-picker-modal" @click="showChannelPicker = false">
      <view class="tag-picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择渠道（可多选）</text>
          <button class="picker-confirm-btn" @click="showChannelPicker = false">确定</button>
        </view>
        <scroll-view scroll-y class="tag-options">
          <view
            v-for="ch in channelList"
            :key="ch.id"
            class="tag-option"
            :class="{ selected: form.channelIds.some(cid => Number(cid) === Number(ch.id)) }"
            @click="toggleChannel(ch)"
          >
            <text>{{ ch.name }}</text>
            <text v-if="form.channelIds.some(cid => Number(cid) === Number(ch.id))" class="tag-check">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <view v-if="showPointChannelPicker" class="tag-picker-modal" @click="showPointChannelPicker = false">
      <view class="tag-picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择积分归属渠道（单选）</text>
          <button class="picker-confirm-btn" @click="showPointChannelPicker = false">确定</button>
        </view>
        <scroll-view scroll-y class="tag-options">
          <view
            v-for="ch in availablePointChannels()"
            :key="ch.id"
            class="tag-option"
            :class="{ selected: Number(form.pointChannel) === Number(ch.id) }"
            @click="selectPointChannel(ch)"
          >
            <text>{{ ch.name }}</text>
            <text v-if="Number(form.pointChannel) === Number(ch.id)" class="tag-check">✓</text>
          </view>
        </scroll-view>
        <view v-if="availablePointChannels().length === 0" class="picker-empty">
          <text>请先在上方选择至少 1 个所属渠道</text>
        </view>
      </view>
    </view>

    <MediaPicker 
      v-model:visible="showCoverPicker" 
      :folder="'/course/covers'" 
      :accept="'image/*'"
      @select="onCoverSelect" 
    />
    <MediaPicker 
      v-model:visible="showThumbnailPicker" 
      :folder="'/course/thumbnails'" 
      :accept="'image/*'"
      @select="onThumbnailSelect" 
    />
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { getCourseDetail, createCourse, updateCourse, getCourseCategoryList } from '../../src/api/course.js'
import { getChannelList } from '../../src/api/channel.js'
import { loadSiteConfig, isFeatureEnabled, clearConfigCache } from '../../src/utils/config-helper.js'
import { useUserStore } from '../../src/store/user.js'
import MediaPicker from '../../src/components/MediaPicker.vue'
import TagPicker from '../../src/components/TagPicker.vue'
import PageHeader from '../../src/components/PageHeader.vue'

const isEdit = ref(false)
const courseId = ref('')
const showTagPicker = ref(false)
const coverFile = ref(null)
const coverFileId = ref(null)
const thumbnailFile = ref(null)
const thumbnailFileId = ref(null)
const showCoverPicker = ref(false)
const showThumbnailPicker = ref(false)
const showPointsSection = ref(true)
const showCrossChannelSection = ref(false)

const userStore = useUserStore()

watch(() => userStore.currentTenantId, async () => {
  clearConfigCache()
  await loadSiteConfig()
  showPointsSection.value = isFeatureEnabled('pointsEnabled')
  showCrossChannelSection.value = isFeatureEnabled('allowCrossChannel')
  allowCrossChannelPublish.value = isFeatureEnabled('allowCrossChannelPublish')
  if (!allowCrossChannelPublish.value) {
    form.channelScope = 'specific'
  }
})

const form = reactive({
  title: '',
  description: '',
  author: '',
  cover: null,
  coverUrl: '',
  thumbnail: null,
  thumbnailUrl: '',
  price: 0,
  originalPrice: 0,
  discountPrice: 0,
  isFree: false,
  isPaid: false,
  category: null,
  tags: [],
  difficulty: 'beginner',
  level: 'introductory',
  duration: '',
  isFeatured: false,
  sort: 0,
  enablePoints: false,
  points: 0,
  pointsType: 'course_points',
  enrollStartDate: '',
  enrollEndDate: '',
  courseStartDate: '',
  courseEndDate: '',
  status: 'draft',
  auditStatus: 'pending',
  language: 'zh-CN',
  channelScope: 'all',
  channelIds: [],
  pointChannel: null,
  allowCrossChannel: true
})

const categoryOptions = ['请选择分类']
const categoryMap = {}
const selectedCategoryName = computed(() => {
  if (!form.category?.name) return ''
  return form.category.name
})

const tagList = ref([])
const selectedTags = ref([])

const selectedKnowledgePoints = ref([])
const showKnowledgePointPicker = ref(false)

const channelList = ref([])
const showChannelPicker = ref(false)
const showPointChannelPicker = ref(false)

const difficultyOptions = ['beginner', 'intermediate', 'advanced', 'expert']
const difficultyIndex = ref(0)

const levelOptions = ['introductory', 'foundation', 'advanced', 'professional']
const levelIndex = ref(0)

const pointsTypeOptions = ['course_points', 'lesson_points']
const pointsTypeIndex = ref(0)

const statusOptions = ['draft', 'pending', 'published', 'archived']
const statusIndex = ref(0)

const auditStatusOptions = ['pending', 'approved', 'rejected']
const auditStatusIndex = ref(0)

async function loadCategories() {
  try {
    const { list } = await getCourseCategoryList()
    list.forEach(cat => {
      categoryOptions.push(cat.name)
      categoryMap[cat.name] = cat
    })
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function onTagSelect(tags) {
  selectedTags.value = tags
}

function removeTag(tag) {
  const index = selectedTags.value.findIndex(t => t.documentId === tag.documentId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

function onKnowledgePointSelect(kps) {
  selectedKnowledgePoints.value = kps
}

function removeKnowledgePoint(kp) {
  const index = selectedKnowledgePoints.value.findIndex(k => k.documentId === kp.documentId)
  if (index > -1) {
    selectedKnowledgePoints.value.splice(index, 1)
  }
}

async function loadChannels() {
  try {
    const { list } = await getChannelList({ pageSize: 200 })
    channelList.value = list || []
  } catch (e) {
    uni.showToast({ title: '加载渠道失败', icon: 'none' })
  }
}

function toggleChannel(ch) {
  const id = Number(ch.id)
  const idx = form.channelIds.findIndex(cid => Number(cid) === id)
  if (idx > -1) {
    form.channelIds.splice(idx, 1)
    // 取消选中时若 pointChannel 在被移除的渠道里，联动清空
    if (Number(form.pointChannel) === id) {
      form.pointChannel = null
    }
  } else {
    form.channelIds.push(id)
  }
}

function selectedChannelNames() {
  if (!form.channelIds.length) return '点击选择渠道'
  console.log('[DEBUG] channelList.value:', channelList.value)
  const map = new Map(channelList.value.map(c => [Number(c.id), c.name]))
  console.log('[DEBUG] channelMap:', Array.from(map.entries()))
  return form.channelIds
    .map(id => {
      const numId = Number(id)
      if (!Number.isFinite(numId)) return ''
      console.log('[DEBUG] looking for id:', numId, 'map has:', map.has(numId))
      return map.get(numId) || `#${numId}`
    })
    .filter(name => name)
    .join('、')
}

function selectPointChannel(ch) {
  form.pointChannel = ch.id
  showPointChannelPicker.value = false
}

function selectedPointChannelName() {
  if (!form.pointChannel) return '点击选择积分归属渠道'
  const numId = Number(form.pointChannel)
  if (!Number.isFinite(numId)) return '点击选择积分归属渠道'
  const map = new Map(channelList.value.map(c => [Number(c.id), c.name]))
  return map.get(numId) || `#${numId}`
}

function availablePointChannels() {
  // 强约束：pointChannel 只能从已选 channelIds 中选
  return channelList.value.filter(c => form.channelIds.some(cid => Number(cid) === Number(c.id)))
}

function setChannelScope(scope) {
  form.channelScope = scope
  if (scope === 'all') {
    form.channelIds = []
    form.pointChannel = null
  } else {
    // specific 模式：pointChannel 必须在 channelIds 中，否则清空
    if (form.pointChannel && !form.channelIds.some(cid => Number(cid) === Number(form.pointChannel))) {
      form.pointChannel = null
    }
  }
}

function handleCategoryChange(e) {
  const index = e.detail.value
  if (index === 0) {
    form.category = null
  } else {
    form.category = categoryMap[categoryOptions[index]]
  }
}

function handleDifficultyChange(e) {
  difficultyIndex.value = e.detail.value
  form.difficulty = difficultyOptions[e.detail.value]
}

function handleLevelChange(e) {
  levelIndex.value = e.detail.value
  form.level = levelOptions[e.detail.value]
}

function handlePointsTypeChange(e) {
  pointsTypeIndex.value = e.detail.value
  form.pointsType = pointsTypeOptions[e.detail.value]
}

function handleStatusChange(e) {
  statusIndex.value = e.detail.value
  form.status = statusOptions[e.detail.value]
}

function handleAuditStatusChange(e) {
  auditStatusIndex.value = e.detail.value
  form.auditStatus = auditStatusOptions[e.detail.value]
}

function onCoverSelect(media) {
  coverFile.value = media.documentId
  coverFileId.value = media.id
  form.coverUrl = media.url
}

function onThumbnailSelect(media) {
  thumbnailFile.value = media.documentId
  thumbnailFileId.value = media.id
  form.thumbnailUrl = media.url
}

async function loadCourseDetail() {
    if (!courseId.value) return
    try {
      const data = await getCourseDetail(courseId.value)
      console.log('[DEBUG] getCourseDetail returned:', data)
      console.log('[DEBUG] data.channelIds exists:', 'channelIds' in data)
      console.log('[DEBUG] data.channelIds value:', data?.channelIds)
      Object.assign(form, data)
      if (data.cover) {
        coverFile.value = data.cover.documentId || data.cover.id
        coverFileId.value = data.cover.id
      }
      if (data.thumbnail) {
        thumbnailFile.value = data.thumbnail.documentId || data.thumbnail.id
        thumbnailFileId.value = data.thumbnail.id
      }
      if (data.category) {
        const idx = categoryOptions.indexOf(data.category.name)
        if (idx > -1) {
          form.category = data.category
        }
      }
      // 知识点现在混在 tags 中，按 tagGroup.slug === 'knowledge-point' 过滤
      if (data.tags && data.tags.length > 0) {
        const kpTags = data.tags.filter(t => t.tagGroup?.slug === 'knowledge-point')
        selectedKnowledgePoints.value = kpTags
        const normalTags = data.tags.filter(t => t.tagGroup?.slug !== 'knowledge-point')
        selectedTags.value = normalTags
      }
      if (data.channelScope) form.channelScope = data.channelScope
      if (data.channelIds && Array.isArray(data.channelIds)) {
        const parsedIds = data.channelIds.map(id => Number(id))
        console.log('[DEBUG] channelIds raw:', data.channelIds)
        console.log('[DEBUG] channelIds parsed:', parsedIds)
        form.channelIds = parsedIds.filter(id => Number.isFinite(id))
        console.log('[DEBUG] form.channelIds:', form.channelIds)
      }
      if (data.pointChannel) {
      // 后端 relation 字段返回 { id, ... } 或 documentId
      const pointId = data.pointChannel.id ?? data.pointChannel.documentId ?? data.pointChannel
      const numPointId = Number(pointId)
      if (Number.isFinite(numPointId)) {
        form.pointChannel = numPointId
      }
    }
    if (typeof data.allowCrossChannel === 'boolean') form.allowCrossChannel = data.allowCrossChannel
    difficultyIndex.value = difficultyOptions.indexOf(data.difficulty) || 0
    levelIndex.value = levelOptions.indexOf(data.level) || 0
    pointsTypeIndex.value = pointsTypeOptions.indexOf(data.pointsType) || 0
    statusIndex.value = statusOptions.indexOf(data.status) || 0
    auditStatusIndex.value = auditStatusOptions.indexOf(data.auditStatus) || 0
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.title) {
    uni.showToast({ title: '请输入课程名称', icon: 'none', duration: 2000 })
    return
  }

  // 渠道配置校验：specific 模式必须指派至少 1 个渠道
  if (form.channelScope === 'specific' && (!Array.isArray(form.channelIds) || form.channelIds.length === 0)) {
    uni.showModal({
      title: '提示',
      content: '指定渠道模式下，请至少选择1个所属渠道。\n\n课程将仅对所选渠道的成员可见。',
      showCancel: false,
      confirmText: '我知道了'
    })
    return
  }

  // 强约束：specific 模式 + pointChannel 必填且 ∈ channelIds
  if (form.channelScope === 'specific') {
    if (!form.pointChannel) {
      uni.showModal({
        title: '提示',
        content: '请选择积分归属渠道。\n\n学习本课程获得的积分将归属此渠道，用于渠道数据统计和奖励发放。',
        showCancel: false,
        confirmText: '我知道了'
      })
      return
    }
    if (form.channelIds.indexOf(form.pointChannel) === -1) {
      uni.showModal({
        title: '配置错误',
        content: '积分归属渠道必须在所属渠道中。\n\n请重新选择积分归属渠道。',
        showCancel: false,
        confirmText: '重新选择'
      })
      showPointChannelPicker.value = true
      return
    }
  }

  // 类型归一化：all 模式清空 channelIds + pointChannel
  if (form.channelScope === 'all') {
    form.channelIds = []
    form.pointChannel = null
  }

  const submitData = {
    title: form.title,
    description: form.description,
    author: form.author,
    cover: coverFileId.value || null,
    thumbnail: thumbnailFileId.value || null,
    price: parseFloat(form.price) || 0,
    originalPrice: parseFloat(form.originalPrice) || 0,
    discountPrice: parseFloat(form.discountPrice) || 0,
    isFree: form.isFree,
    isPaid: form.isPaid,
    difficulty: form.difficulty,
    level: form.level,
    duration: form.duration,
    isFeatured: form.isFeatured,
    sort: parseInt(form.sort) || 0,
    enablePoints: form.enablePoints,
    points: parseInt(form.points) || 0,
    pointsType: form.pointsType,
    enrollStartDate: form.enrollStartDate,
    enrollEndDate: form.enrollEndDate,
    courseStartDate: form.courseStartDate,
    courseEndDate: form.courseEndDate,
    status: form.status,
    auditStatus: form.auditStatus,
    language: form.language,
    channelScope: form.channelScope,
    channelIds: form.channelScope === 'specific' ? form.channelIds.map(id => Number(id)) : [],
    pointChannel: form.channelScope === 'specific' && form.pointChannel ? Number(form.pointChannel) : null,
    allowCrossChannel: form.allowCrossChannel
  }

  if (form.category) {
    submitData.category = { documentId: form.category.documentId }
  }

  // 知识点统一保存到 tags 字段（知识点是 zhao-tag 中"知识点"分组的标签）
  const allTagDocs = [...(selectedTags.value || []), ...selectedKnowledgePoints.value]
  const uniqueDocs = []
  const seen = new Set()
  for (const t of allTagDocs) {
    if (!seen.has(t.documentId)) {
      seen.add(t.documentId)
      uniqueDocs.push({ documentId: t.documentId })
    }
  }
  submitData.tags = uniqueDocs

  try {
    uni.showLoading({ title: '保存中...' })

    if (isEdit.value) {
      await updateCourse(courseId.value, submitData)
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      await createCourse(submitData)
      uni.showToast({ title: '创建成功', icon: 'success' })
    }

    uni.hideLoading()
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e) {
    uni.hideLoading()

    const errorMsg = e.message || '保存失败'

    if (errorMsg.includes('COURSE_001')) {
      uni.showModal({
        title: '渠道配置错误',
        content: errorMsg.replace('COURSE_001: ', ''),
        showCancel: false
      })
    } else {
      uni.showToast({ title: errorMsg, icon: 'none', duration: 3000 })
    }
  }
}

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}

  if (options.id) {
    isEdit.value = true
    courseId.value = options.id
  }

  await loadSiteConfig()
  showPointsSection.value = isFeatureEnabled('pointsEnabled')
  showCrossChannelSection.value = isFeatureEnabled('allowCrossChannel')

  await loadCategories()
  await loadChannels()
  await loadCourseDetail()
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  padding: 15rpx 30rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.form-scroll {
  padding: 100rpx 30rpx 140rpx;
  height: 100vh;
}

.form-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-row {
  display: flex;
  gap: 30rpx;
}

.form-item.half {
  flex: 1;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.form-textarea {
  width: 100%;
  height: 160rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 28rpx;
}

.upload-area {
  width: 100%;
  height: 200rpx;
  border: 2rpx dashed #ddd;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.upload-preview {
  width: 100%;
  height: 100%;
  border-radius: 10rpx;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.upload-icon {
  font-size: 48rpx;
}

.upload-text {
  font-size: 26rpx;
  color: #999;
}

.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.picker-arrow {
  font-size: 20rpx;
  color: #999;
}

.tag-area {
  min-height: 80rpx;
  border: 1rpx dashed #ddd;
  border-radius: 10rpx;
  padding: 15rpx;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: #e3f2fd;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #1989fa;
}

.tag-item.knowledge-tag {
  background: #fff7e6;
  color: #fa8c16;
}

.tag-remove {
  font-size: 28rpx;
  color: #999;
}

.tag-add {
  padding: 8rpx 16rpx;
  border: 1rpx dashed #ddd;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #999;
}

.kp-search-bar {
  padding: 12rpx 20rpx;
  border-bottom: 1rpx solid #eee;
}

.tag-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50rpx;
  font-size: 26rpx;
  color: #999;
}

.tag-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.tag-picker-content {
  width: 100%;
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 70vh;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.picker-title {
  font-size: 32rpx;
  font-weight: bold;
}

.picker-confirm-btn {
  background: #667eea;
  color: #fff;
  border: none;
  padding: 0 24rpx;
  height: 56rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  line-height: 56rpx;
}

.tag-options {
  padding: 20rpx;
  max-height: 50vh;
}

.tag-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 20rpx;
  border-radius: 10rpx;
  margin-bottom: 10rpx;
}

.tag-option.selected {
  background: #667eea;
  color: #fff;
}

.tag-check {
  font-size: 28rpx;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.btn-save {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: 28rpx;
  color: #333;
}

.radio-circle {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #ccc;
  position: relative;
}

.radio-circle.active {
  border-color: #667eea;
}

.radio-circle.active::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #667eea;
  transform: translate(-50%, -50%);
}

.channel-picker-trigger {
  padding: 20rpx 24rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  min-height: 80rpx;
  font-size: 28rpx;
  color: #333;
}

.channel-picker-trigger .placeholder {
  color: #999;
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.form-hint {
  font-size: 24rpx;
  color: #999;
  flex: 1;
}
</style>