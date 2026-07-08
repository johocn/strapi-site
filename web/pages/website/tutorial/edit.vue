<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑教程' : '新增教程'">
      <button class="btn-secondary" @click="handleSubmit('draft')" v-if="hasPermission('tutorial.update')">存草稿</button>
      <button class="btn-primary" @click="handleSubmit('published')" v-if="hasPermission('tutorial.publish')">发布</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        <view class="form-item"><text class="form-label">标题 *</text><input type="text" v-model="form.title" placeholder="教程标题" class="form-input" /></view>
        <view class="form-item"><text class="form-label">slug</text><input type="text" v-model="form.slug" placeholder="URL 别名" class="form-input" /></view>
        <view class="form-item"><text class="form-label">简介</text><textarea v-model="form.description" placeholder="教程简介" class="form-textarea" /></view>
        <view class="form-item"><text class="form-label">封面图 URL</text><input type="text" v-model="form.coverImage" placeholder="封面图地址" class="form-input" /></view>
      </view>

      <view class="form-section">
        <view class="section-title">教程详情</view>
        <view class="form-item">
          <text class="form-label">难度</text>
          <picker mode="selector" :range="difficultyOptions" :range-key="'label'" @change="(e) => form.difficulty = difficultyOptions[e.detail.value].value">
            <view class="form-input picker-display">{{ getDifficultyText(form.difficulty) }}</view>
          </picker>
        </view>
        <view class="form-item"><text class="form-label">预计时长</text><input type="text" v-model="form.estimatedTime" placeholder="例: 30分钟" class="form-input" /></view>
        <view class="form-item"><text class="form-label">步骤（JSON 数组）*</text><textarea v-model="stepsJson" placeholder='[{"title":"步骤1","content":"..."}]' class="form-textarea content-textarea" /></view>
        <JsonExampleBlock
          fieldLabel="教程步骤"
          fieldName="steps"
          :exampleJson="tutorialStepsExample"
          @fill="handleFillExample"
        />
        <view class="form-item"><text class="form-label">材料（JSON 数组）</text><textarea v-model="materialsJson" placeholder='["材料1","材料2"]' class="form-textarea" /></view>
        <view class="form-item"><text class="form-label">结果说明</text><textarea v-model="form.result" placeholder="教程结果" class="form-textarea" /></view>
      </view>

      <view class="form-section">
        <view class="section-title">标签</view>
        <view class="form-item">
          <text class="form-label">标签</text>
          <TagSelector v-model="form.tags" :siteId="siteId" label="标签" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { tutorialApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import TagSelector from '../../../src/components/TagSelector.vue'
import JsonExampleBlock from '../../../src/components/JsonExampleBlock.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission
const siteId = computed(() => userStore.currentSite?.documentId || '')

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)
const stepsJson = ref('[]')
const materialsJson = ref('[]')

const tutorialStepsExample = JSON.stringify([
  {
    "title": "步骤一：登录系统",
    "description": "使用管理员账号登录后台",
    "image": "https://example.com/step1.png",
    "tip": "默认账号 admin/admin"
  },
  {
    "title": "步骤二：进入配置页",
    "description": "点击左侧菜单「系统设置」",
    "image": "https://example.com/step2.png"
  },
  {
    "title": "步骤三：保存配置",
    "description": "填写完成后点击「保存」按钮",
    "tip": "保存后立即生效"
  }
], null, 2)

function handleFillExample({ fieldName, exampleJson }) {
  const refMap = { steps: stepsJson }
  const target = refMap[fieldName]
  if (!target) return
  if (target.value && target.value.trim()) {
    uni.showModal({
      title: '确认覆盖',
      content: `字段「${fieldName}」已有内容，确定用示例覆盖吗？`,
      success: (res) => {
        if (res.confirm) {
          target.value = exampleJson
          uni.showToast({ title: '已填入示例', icon: 'success' })
        }
      }
    })
  } else {
    target.value = exampleJson
    uni.showToast({ title: '已填入示例', icon: 'success' })
  }
}

const difficultyOptions = [
  { label: '入门', value: 'beginner' },
  { label: '进阶', value: 'intermediate' },
  { label: '高级', value: 'advanced' },
]
const difficultyMap = { beginner: '入门', intermediate: '进阶', advanced: '高级' }
function getDifficultyText(d) { return difficultyMap[d] || d }

const form = ref({
  title: '', slug: '', description: '', coverImage: '',
  steps: [], materials: [], estimatedTime: '', difficulty: 'beginner', result: '',
  tags: [], status: 'draft',
})

function safeParse(str, fallback) { try { return JSON.parse(str) } catch { return fallback } }

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await tutorialApi.detail(documentId.value)
    if (item) {
      form.value = {
        title: item.title || '', slug: item.slug || '', description: item.description || '', coverImage: item.coverImage || '',
        steps: item.steps || [], materials: item.materials || [],
        estimatedTime: item.estimatedTime || '', difficulty: item.difficulty || 'beginner', result: item.result || '',
        tags: (item.tags || []).map(t => t.documentId), status: item.status || 'draft',
      }
      stepsJson.value = JSON.stringify(item.steps || [], null, 2)
      materialsJson.value = JSON.stringify(item.materials || [], null, 2)
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleSubmit(targetStatus) {
  if (!form.value.title) { uni.showToast({ title: '请填写标题', icon: 'none' }); return }
  const payload = {
    ...form.value,
    steps: safeParse(stepsJson.value, []),
    materials: safeParse(materialsJson.value, []),
    status: targetStatus === 'published' ? 'published' : 'draft',
  }
  try {
    if (isEdit.value) {
      await tutorialApi.update(documentId.value, payload)
      if (targetStatus === 'published' && form.value.status !== 'published') await tutorialApi.publish(documentId.value)
    } else {
      const created = await tutorialApi.create(payload)
      if (targetStatus === 'published' && created?.documentId) await tutorialApi.publish(created.documentId)
    }
    uni.showToast({ title: targetStatus === 'published' ? '发布成功' : '已保存草稿', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (e) { uni.showToast({ title: '保存失败', icon: 'none' }) }
}

onLoad((options) => { if (options?.documentId) { documentId.value = options.documentId; loadDetail() } })
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; display: flex; flex-direction: column; }
.form-scroll { flex: 1; padding: 20rpx; box-sizing: border-box; }
.btn-primary { background: #ff0000; color: #ffffff; padding: 16rpx 32rpx; font-size: 30rpx; border-radius: 8rpx; border: none; line-height: 1.2; margin-left: 12rpx; }
.btn-secondary { background: #f5f5f5; color: #333; padding: 16rpx 32rpx; font-size: 30rpx; border-radius: 8rpx; border: none; line-height: 1.2; }
.form-section { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 24rpx; padding-left: 8rpx; border-left: 6rpx solid #ff0000; }
.form-item { margin-bottom: 24rpx; }
.form-label { display: block; font-size: 26rpx; color: #666; margin-bottom: 12rpx; }
.form-input { width: 100%; height: 72rpx; padding: 0 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
.picker-display { display: flex; align-items: center; line-height: 72rpx; }
.form-textarea { width: 100%; min-height: 160rpx; padding: 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
.content-textarea { min-height: 300rpx; }
</style>
