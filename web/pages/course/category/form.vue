<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑分类' : '新增分类'"></PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        
        <view class="form-item">
          <text class="form-label">分类名称 <text class="required">*</text></text>
          <input
            type="text"
            v-model="form.name"
            placeholder="请输入分类名称"
            class="form-input"
          />
        </view>

        <view class="form-item">
          <text class="form-label">分类描述</text>
          <textarea
            v-model="form.description"
            placeholder="请输入分类描述（可选）"
            class="form-textarea"
            :maxlength="200"
          />
        </view>

        <view class="form-item">
          <text class="form-label">排序</text>
          <input
            type="number"
            v-model="form.sort"
            placeholder="数值越小越靠前"
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

        <view class="form-item" v-if="allowCrossChannelPublish">
          <text class="form-label">允许跨渠道访问</text>
          <view class="switch-row">
            <switch :checked="form.allowCrossChannel" @change="form.allowCrossChannel = !form.allowCrossChannel" />
            <text class="form-hint">关闭后，游客无法浏览此分类</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="form-actions">
      <button class="btn-cancel" @click="goBack">取消</button>
      <button class="btn-submit" @click="handleSubmit" :loading="submitting">
        {{ isEdit ? '保存' : '创建' }}
      </button>
    </view>

    <!-- 渠道选择器 -->
    <view v-if="showChannelPicker" class="tag-picker-modal" @click="showChannelPicker = false">
      <view class="tag-picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择渠道（可多选）</text>
          <text class="picker-close" @click="showChannelPicker = false">×</text>
        </view>
        <scroll-view scroll-y class="tag-options">
          <view
            v-for="ch in channelList"
            :key="ch.id"
            class="tag-option"
            :class="{ selected: form.channelIds.indexOf(ch.id) > -1 }"
            @click="toggleChannel(ch)"
          >
            <text>{{ ch.name }}</text>
            <text v-if="form.channelIds.indexOf(ch.id) > -1" class="tag-check">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCourseCategoryDetail, createCourseCategory, updateCourseCategory } from '../../../src/api/course.js'
import { getChannelList } from '../../../src/api/channel.js'
import { loadSiteConfig, isFeatureEnabled } from '../../../src/utils/config-helper.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const isEdit = ref(false)
const documentId = ref('')
const submitting = ref(false)
const showChannelPicker = ref(false)
const channelList = ref([])
const allowCrossChannelPublish = ref(false)

const form = reactive({
  name: '',
  description: '',
  sort: 0,
  channelScope: 'all',
  channelIds: [],
  allowCrossChannel: true,
})

onMounted(async () => {
  await loadSiteConfig()
  allowCrossChannelPublish.value = isFeatureEnabled('allowCrossChannelPublish')
  if (!allowCrossChannelPublish.value) {
    form.channelScope = 'specific'
  }
  loadChannels()
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const id = page.options?.id
  if (id) {
    isEdit.value = true
    documentId.value = id
    loadDetail(id)
  }
})

async function loadChannels() {
  try {
    const { list } = await getChannelList({ pageSize: 200 })
    channelList.value = list || []
  } catch (e) {
    uni.showToast({ title: '加载渠道失败', icon: 'none' })
  }
}

async function loadDetail(id) {
  try {
    const data = await getCourseCategoryDetail(id)
    if (data) {
      form.name = data.name || ''
      form.description = data.description || ''
      form.sort = data.sort ?? 0
      form.channelScope = data.channelScope || 'all'
      form.channelIds = data.channelIds || []
      form.allowCrossChannel = data.allowCrossChannel ?? true
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function toggleChannel(ch) {
  const id = ch.id
  const idx = form.channelIds.indexOf(id)
  if (idx > -1) {
    form.channelIds.splice(idx, 1)
  } else {
    form.channelIds.push(id)
  }
}

function selectedChannelNames() {
  if (!form.channelIds.length) return '点击选择渠道'
  const map = new Map(channelList.value.map(c => [c.id, c.name]))
  return form.channelIds.map(id => map.get(id) || `#${id}`).join('、')
}

function setChannelScope(scope) {
  form.channelScope = scope
  if (scope === 'all') {
    form.channelIds = []
  }
}

function goBack() {
  uni.navigateBack()
}

async function handleSubmit() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }
  
  if (form.channelScope === 'specific' && !form.channelIds.length) {
    uni.showToast({ title: '请选择渠道', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      sort: Number(form.sort) || 0,
      channelScope: form.channelScope,
      channelIds: form.channelIds,
      allowCrossChannel: form.allowCrossChannel,
    }
    if (isEdit.value) {
      await updateCourseCategory(documentId.value, payload)
      uni.showToast({ title: '保存成功', icon: 'success' })
    } else {
      await createCourseCategory(payload)
      uni.showToast({ title: '创建成功', icon: 'success' })
    }
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}


</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx; box-sizing: border-box; }

.form-scroll { height: calc(100vh - 160rpx); }

.form-section { background: #fff; border-radius: 12rpx; padding: 20rpx; margin-bottom: 20rpx; }

.section-title { font-size: 30rpx; font-weight: 600; color: #333; margin-bottom: 24rpx; padding-left: 8rpx; border-left: 4rpx solid #07c160; }

.form-item { margin-bottom: 32rpx; }
.form-item:last-child { margin-bottom: 0; }

.form-label { font-size: 28rpx; color: #333; margin-bottom: 12rpx; display: block; }
.required { color: #ff4d4f; }

.form-input {
  width: 100%; height: 80rpx; background: #f5f5f5; border-radius: 8rpx;
  padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box;
}

.form-textarea {
  width: 100%; height: 200rpx; background: #f5f5f5; border-radius: 8rpx;
  padding: 20rpx; font-size: 28rpx; box-sizing: border-box;
}

.form-hint { font-size: 24rpx; color: #999; margin-top: 8rpx; display: block; }

.form-actions {
  display: flex; gap: 20rpx; margin-top: 40rpx; padding: 0 20rpx;
  padding-bottom: 60rpx;
}

.btn-cancel {
  flex: 1; height: 88rpx; line-height: 88rpx; text-align: center;
  background: #f5f5f5; color: #666; font-size: 30rpx; border-radius: 8rpx; border: none;
}

.btn-submit {
  flex: 1; height: 88rpx; line-height: 88rpx; text-align: center;
  background: #07c160; color: #fff; font-size: 30rpx; border-radius: 8rpx; border: none;
}

.radio-group { display: flex; flex-direction: column; gap: 16rpx; }

.radio-item {
  display: flex; align-items: center; gap: 12rpx; padding: 16rpx;
  background: #f9f9f9; border-radius: 8rpx;
}

.radio-circle {
  width: 40rpx; height: 40rpx; border: 2rpx solid #ddd; border-radius: 50%;
  position: relative;
}

.radio-circle.active {
  border-color: #07c160;
}

.radio-circle.active::after {
  content: ''; position: absolute; top: 50%; left: 50%;
  width: 20rpx; height: 20rpx; background: #07c160;
  border-radius: 50%; transform: translate(-50%, -50%);
}

.channel-picker-trigger {
  width: 100%; height: 80rpx; background: #f5f5f5; border-radius: 8rpx;
  padding: 0 20rpx; font-size: 28rpx; display: flex; align-items: center;
  box-sizing: border-box;
}

.channel-picker-trigger .placeholder { color: #999; }

.switch-row { display: flex; align-items: center; gap: 16rpx; }

.switch-row .form-hint { margin-top: 0; }

.tag-picker-modal {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); display: flex; align-items: flex-end;
  z-index: 1000;
}

.tag-picker-content {
  width: 100%; max-height: 60vh; background: #fff;
  border-radius: 20rpx 20rpx 0 0;
}

.picker-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 30rpx; border-bottom: 1rpx solid #eee;
}

.picker-title { font-size: 32rpx; font-weight: 600; color: #333; }

.picker-close { font-size: 48rpx; color: #999; line-height: 1; }

.tag-options { max-height: 50vh; padding: 20rpx; }

.tag-option {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24rpx; margin-bottom: 12rpx;
  background: #f9f9f9; border-radius: 8rpx;
  font-size: 28rpx; color: #333;
}

.tag-option.selected {
  background: #e8f5e9; color: #07c160;
}

.tag-check { font-size: 28rpx; font-weight: bold; }
</style>
