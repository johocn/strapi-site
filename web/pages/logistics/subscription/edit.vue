<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑订阅' : '新增订阅'">
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission('logistics.subscription.create')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">订阅配置</view>

        <view class="form-item">
          <text class="form-label">订阅类型 *</text>
          <picker mode="selector" :range="typeOptions" @change="(e) => form.subscriberType = typeValues[e.detail.value]">
            <view class="form-input picker-value">{{ typeText(form.subscriberType) }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">通知渠道 *</text>
          <picker mode="selector" :range="channelOptions" @change="(e) => form.channel = channelValues[e.detail.value]">
            <view class="form-input picker-value">{{ channelText(form.channel) }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">订阅目标 *</text>
          <input type="text" v-model="form.channelTarget" placeholder="邮箱/手机号/IM 账号" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">频率 *</text>
          <picker mode="selector" :range="freqOptions" @change="(e) => form.frequency = freqValues[e.detail.value]">
            <view class="form-input picker-value">{{ freqText(form.frequency) }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">语言 *</text>
          <input type="text" v-model="form.language" placeholder="如 zh-CN/en-US/ja-JP" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">关联信息</view>

        <view class="form-item">
          <text class="form-label">物流单号</text>
          <input type="text" v-model="form.trackingNo" placeholder="关联物流单号" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">报价单 ID</text>
          <input type="text" v-model="form.quoteRequestId" placeholder="关联报价单" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">事件过滤 (JSON)</text>
          <textarea v-model="form.eventFilter" placeholder='{"eventTypes":["shipped","delivered"]}' class="form-textarea json-textarea" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">状态信息</view>

        <view class="form-item form-row">
          <text class="form-label">是否激活 *</text>
          <switch :checked="form.isActive" @change="(e) => form.isActive = e.detail.value" />
        </view>

        <view class="form-item">
          <text class="form-label">订阅时间 *</text>
          <input type="text" v-model="form.subscribedAt" placeholder="YYYY-MM-DD HH:mm:ss" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">取消订阅时间</text>
          <input type="text" v-model="form.unsubscribedAt" placeholder="YYYY-MM-DD HH:mm:ss" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">最后通知时间</text>
          <input type="text" v-model="form.lastNotifiedAt" placeholder="YYYY-MM-DD HH:mm:ss" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">通知次数</text>
          <input type="number" v-model="form.notifyCount" placeholder="0" class="form-input" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { subscriptionApi } from '../../../src/api/logistics.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import { useUserStore } from '../../../src/store/user.js'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const typeOptions = ['物流更新', '报价回复', '促销', '资讯']
const typeValues = ['tracking_update', 'quote_reply', 'promotion', 'newsletter']
const typeText = (v) => {
  const i = typeValues.indexOf(v)
  return i >= 0 ? typeOptions[i] : '请选择'
}

const channelOptions = ['邮件', 'Line', 'Kakao', 'Zalo', '微信', '短信']
const channelValues = ['email', 'line', 'kakao', 'zalo', 'wechat', 'sms']
const channelText = (v) => {
  const i = channelValues.indexOf(v)
  return i >= 0 ? channelOptions[i] : '请选择'
}

const freqOptions = ['实时', '每日', '每周']
const freqValues = ['realtime', 'daily', 'weekly']
const freqText = (v) => {
  const i = freqValues.indexOf(v)
  return i >= 0 ? freqOptions[i] : '请选择'
}

const form = ref({
  subscriberType: 'tracking_update',
  channel: 'email',
  channelTarget: '',
  trackingNo: '',
  quoteRequestId: '',
  eventFilter: '',
  frequency: 'realtime',
  isActive: true,
  subscribedAt: '',
  unsubscribedAt: '',
  language: 'zh-CN',
  lastNotifiedAt: '',
  notifyCount: 0
})

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await subscriptionApi.detail(documentId.value)
    if (item) {
      Object.keys(form.value).forEach(key => {
        if (item[key] !== undefined && item[key] !== null) {
          form.value[key] = typeof item[key] === 'object' ? JSON.stringify(item[key], null, 2) : item[key]
        }
      })
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.channelTarget) return uni.showToast({ title: '请填写订阅目标', icon: 'none' })
  if (!form.value.language) return uni.showToast({ title: '请填写语言', icon: 'none' })
  const payload = { ...form.value }
  if (payload.eventFilter && typeof payload.eventFilter === 'string') {
    try { payload.eventFilter = JSON.parse(payload.eventFilter) } catch (e) {
      return uni.showToast({ title: 'eventFilter JSON 格式错误', icon: 'none' })
    }
  }
  try {
    if (isEdit.value) {
      await subscriptionApi.update(documentId.value, payload)
    } else {
      await subscriptionApi.create(payload)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
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
page { background: #f5f5f5; }
.page-container { min-height: 100vh; display: flex; flex-direction: column; }
.form-scroll { flex: 1; padding: 20rpx; box-sizing: border-box; }

.btn-primary {
  background: #ff0000; color: #ffffff;
  padding: 16rpx 32rpx; font-size: 30rpx;
  border-radius: 8rpx; border: none; line-height: 1.2;
}

.form-section {
  background: #fff; border-radius: 12rpx;
  padding: 24rpx; margin-bottom: 20rpx;
}
.section-title {
  font-size: 30rpx; font-weight: bold; color: #333;
  margin-bottom: 24rpx; padding-left: 8rpx;
  border-left: 6rpx solid #ff0000;
}
.form-item { margin-bottom: 24rpx; }
.form-label {
  display: block; font-size: 26rpx; color: #666;
  margin-bottom: 12rpx;
}
.form-input {
  width: 100%; height: 72rpx; padding: 0 20rpx;
  background: #f5f5f5; border-radius: 8rpx;
  font-size: 28rpx; box-sizing: border-box;
}
.form-textarea {
  width: 100%; min-height: 160rpx; padding: 20rpx;
  background: #f5f5f5; border-radius: 8rpx;
  font-size: 28rpx; box-sizing: border-box;
}
.json-textarea { min-height: 200rpx; font-family: monospace; }
.picker-value { display: flex; align-items: center; color: #333; }
.form-row {
  display: flex; justify-content: space-between; align-items: center;
}
</style>
