<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑草稿文章' : '新增草稿文章'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">标题 *</text>
          <input type="text" v-model="form.title" placeholder="请输入文章标题" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">分类</text>
          <input type="text" v-model="form.category" placeholder="文章分类" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">正文 *</text>
          <textarea v-model="form.content" placeholder="请输入正文内容" class="form-textarea content-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">状态 *</text>
          <picker mode="selector" :range="statusLabelOptions" :value="statusValueIndex" @change="handleStatusChange">
            <view class="form-picker">
              <text>{{ statusLabelOptions[statusValueIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">来源信息</view>

        <view class="form-item">
          <text class="form-label">来源 URL</text>
          <input type="text" v-model="form.sourceUrl" placeholder="请输入来源 URL" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">来源标题</text>
          <input type="text" v-model="form.sourceTitle" placeholder="请输入来源标题" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">来源作者</text>
          <input type="text" v-model="form.sourceAuthor" placeholder="请输入来源作者" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">来源发布时间</text>
          <picker mode="date" :value="form.sourcePublishedAt" @change="form.sourcePublishedAt = $event.detail.value">
            <view class="form-picker">
              <text>{{ form.sourcePublishedAt || '请选择时间' }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>

      <view v-if="hasPermission('menu.tenant')" class="form-section">
        <view class="section-title">归属范围</view>

        <view class="form-item">
          <text class="form-label">可见范围 *</text>
          <picker mode="selector" :range="scopeLabelOptions" :value="scopeValueIndex" @change="handleScopeChange">
            <view class="form-picker">
              <text>{{ scopeLabelOptions[scopeValueIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item" v-if="form.scope === 'tenant'">
          <text class="form-label">指定租户 ID *</text>
          <input type="text" v-model="form.scopeTenantId" placeholder="请输入租户 documentId" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">AI 辅助</view>

        <view v-if="!isEdit" class="ai-hint">
          <text>请先保存文章后再使用 AI 工具</text>
        </view>

        <view v-else class="ai-toolbar">
          <view class="ai-btn" :class="{ disabled: aiLoading }" @click="handleGenerateSummary">
            <text class="ai-icon">📝</text>
            <text class="ai-label">生成摘要</text>
          </view>
          <view class="ai-btn" :class="{ disabled: aiLoading }" @click="handleOptimizeTitle">
            <text class="ai-icon">✨</text>
            <text class="ai-label">优化标题</text>
          </view>
          <view class="ai-btn" :class="{ disabled: aiLoading }" @click="handleRewrite">
            <text class="ai-icon">♻️</text>
            <text class="ai-label">改写内容</text>
          </view>
          <view class="ai-btn" :class="{ disabled: aiLoading }" @click="handleConvert">
            <text class="ai-icon">🔄</text>
            <text class="ai-label">转换格式</text>
          </view>
          <view class="ai-btn" :class="{ disabled: aiLoading }" @click="openChat">
            <text class="ai-icon">💬</text>
            <text class="ai-label">AI 对话</text>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">AI 优化标题</text>
          <input type="text" v-model="form.aiOptimizedTitle" placeholder="AI 生成的优化标题" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">AI 摘要</text>
          <textarea v-model="form.aiSummary" placeholder="AI 生成的摘要" class="form-textarea" />
        </view>

        <view class="form-item form-row">
          <text class="form-label">AI 已处理</text>
          <switch :checked="form.aiProcessed" @change="form.aiProcessed = !form.aiProcessed" />
        </view>
      </view>

      <view v-if="showChat" class="chat-mask" @click="closeChat">
        <view class="chat-box" @click.stop>
          <view class="chat-header">
            <text class="chat-title">AI 对话</text>
            <text class="chat-close" @click="closeChat">×</text>
          </view>
          <scroll-view scroll-y class="chat-body">
            <view v-if="chatReply" class="chat-msg">{{ chatReply }}</view>
            <view v-else class="chat-empty">发送消息开始对话</view>
          </scroll-view>
          <view class="chat-input-row">
            <input type="text" v-model="chatMessage" placeholder="请输入消息" class="chat-input" @confirm="handleChat" />
            <button class="chat-send" @click="handleChat" :disabled="aiLoading">发送</button>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { articleDraftApi, aiActionApi } from '../../../src/api/studio.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const statusEnumList = ['draft', 'processing', 'ready', 'published']
const statusLabelOptions = ['草稿', '处理中', '就绪', '已发布']

const scopeEnumList = ['current', 'global', 'tenant']
const scopeLabelOptions = ['仅当前租户', '全局共享', '指定租户']

const form = ref({
  title: '',
  content: '',
  sourceUrl: '',
  sourceTitle: '',
  sourcePublishedAt: '',
  sourceAuthor: '',
  category: '',
  status: 'draft',
  aiProcessed: false,
  aiSummary: '',
  aiOptimizedTitle: '',
  scope: 'current',
  scopeTenantId: '',
  publishedAt: ''
})

const aiLoading = ref(false)

const statusValueIndex = computed(() => {
  const idx = statusEnumList.indexOf(form.value.status)
  return idx >= 0 ? idx : 0
})

const scopeValueIndex = computed(() => {
  const idx = scopeEnumList.indexOf(form.value.scope)
  return idx >= 0 ? idx : 0
})

function handleStatusChange(e) {
  form.value.status = statusEnumList[e.detail.value]
}

function handleScopeChange(e) {
  form.value.scope = scopeEnumList[e.detail.value]
}

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await articleDraftApi.detail(documentId.value)
    if (item) {
      form.value = {
        title: item.title || '',
        content: item.content || '',
        sourceUrl: item.sourceUrl || '',
        sourceTitle: item.sourceTitle || '',
        sourcePublishedAt: item.sourcePublishedAt ? item.sourcePublishedAt.substring(0, 10) : '',
        sourceAuthor: item.sourceAuthor || '',
        category: item.category || '',
        status: item.status || 'draft',
        aiProcessed: !!item.aiProcessed,
        aiSummary: item.aiSummary || '',
        aiOptimizedTitle: item.aiOptimizedTitle || '',
        scope: item.scope || 'current',
        scopeTenantId: item.scopeTenantId || '',
        publishedAt: item.publishedAt || ''
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.title || !form.value.content) {
    uni.showToast({ title: '请填写标题和正文', icon: 'none' })
    return
  }
  if (form.value.scope === 'tenant' && !form.value.scopeTenantId) {
    uni.showToast({ title: '请填写指定租户 ID', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  try {
    if (isEdit.value) {
      await articleDraftApi.update(documentId.value, payload)
    } else {
      const created = await articleDraftApi.create(payload)
      if (created?.documentId) {
        documentId.value = created.documentId
      }
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

async function handleGenerateSummary() {
  if (aiLoading.value) return
  aiLoading.value = true
  try {
    const result = await aiActionApi.generateSummary(documentId.value)
    form.value.aiSummary = result?.summary || ''
    form.value.aiProcessed = true
    uni.showToast({ title: '摘要已生成', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '生成摘要失败', icon: 'none' })
  } finally {
    aiLoading.value = false
  }
}

async function handleOptimizeTitle() {
  if (aiLoading.value) return
  aiLoading.value = true
  try {
    const result = await aiActionApi.optimizeTitle(documentId.value)
    form.value.aiOptimizedTitle = result?.optimizedTitle || ''
    uni.showToast({ title: '标题已优化', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '优化标题失败', icon: 'none' })
  } finally {
    aiLoading.value = false
  }
}

async function handleRewrite() {
  if (aiLoading.value) return
  uni.showModal({
    title: '改写内容',
    content: 'AI 将改写正文内容并覆盖当前内容，是否继续？',
    success: async (res) => {
      if (!res.confirm) return
      aiLoading.value = true
      try {
        const result = await aiActionApi.rewrite(documentId.value)
        if (result?.rewrittenContent) {
          form.value.content = result.rewrittenContent
          uni.showToast({ title: '内容已改写', icon: 'success' })
        } else {
          uni.showToast({ title: '未返回内容', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '改写失败', icon: 'none' })
      } finally {
        aiLoading.value = false
      }
    }
  })
}

async function handleConvert() {
  if (aiLoading.value) return
  aiLoading.value = true
  try {
    const result = await aiActionApi.convert(documentId.value)
    if (result?.convertedContent) {
      form.value.content = result.convertedContent
      uni.showToast({ title: '格式已转换', icon: 'success' })
    } else {
      uni.showToast({ title: '未返回内容', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '转换失败', icon: 'none' })
  } finally {
    aiLoading.value = false
  }
}

const showChat = ref(false)
const chatMessage = ref('')
const chatReply = ref('')

function openChat() {
  if (aiLoading.value) return
  showChat.value = true
  chatReply.value = ''
  chatMessage.value = ''
}

function closeChat() {
  showChat.value = false
}

async function handleChat() {
  if (!chatMessage.value.trim() || aiLoading.value) return
  const message = chatMessage.value
  aiLoading.value = true
  try {
    const result = await aiActionApi.chat(message)
    chatReply.value = typeof result === 'string'
      ? result
      : (result?.reply || result?.content || result?.message || result?.answer || JSON.stringify(result || {}))
  } catch (e) {
    chatReply.value = '对话失败：' + (e?.message || '未知错误')
  } finally {
    aiLoading.value = false
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

.form-picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 72rpx;
  padding: 0 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.arrow {
  font-size: 20rpx;
  color: #999;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-hint {
  padding: 20rpx;
  background: #fffbe6;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #999;
  text-align: center;
}

.ai-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.ai-btn {
  flex: 1;
  min-width: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 12rpx;
  background: #f0f7ff;
  border-radius: 8rpx;
}

.ai-btn.disabled {
  opacity: 0.5;
}

.ai-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.ai-label {
  font-size: 24rpx;
  color: #1989fa;
}

.chat-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.chat-box {
  width: 100%;
  background: #fff;
  border-radius: 16rpx 16rpx 0 0;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #eee;
}

.chat-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.chat-close {
  font-size: 40rpx;
  color: #999;
  padding: 0 12rpx;
}

.chat-body {
  min-height: 300rpx;
  max-height: 600rpx;
  padding: 24rpx;
}

.chat-msg {
  background: #f5f5f5;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  white-space: pre-wrap;
}

.chat-empty {
  text-align: center;
  color: #999;
  font-size: 26rpx;
  padding: 60rpx 0;
}

.chat-input-row {
  display: flex;
  gap: 16rpx;
  padding: 20rpx;
  border-top: 1rpx solid #eee;
}

.chat-input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.chat-send {
  background: #ff0000;
  color: #fff;
  font-size: 28rpx;
  padding: 0 32rpx;
  border-radius: 8rpx;
  border: none;
  line-height: 72rpx;
}
</style>
