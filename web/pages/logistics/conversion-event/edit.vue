<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑事件' : '新增事件'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission('logistics.conversion-event.create')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">漏斗 ID *</text>
          <input type="text" v-model="form.funnel" placeholder="关联漏斗 documentId" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">事件名称 *</text>
          <input type="text" v-model="form.eventName" placeholder="如 view_page / submit_quote" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">步骤序号 *</text>
          <input type="number" v-model="form.step" placeholder="步骤序号" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">访客 ID *</text>
          <input type="text" v-model="form.visitorId" placeholder="访客标识" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">用户 ID</text>
          <input type="text" v-model="form.user" placeholder="关联用户 documentId" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">会话 ID</text>
          <input type="text" v-model="form.sessionId" placeholder="会话标识" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">发生时间 *</text>
          <picker mode="date" :value="form.occurredAt" @change="(e) => form.occurredAt = e.detail.value">
            <view class="form-input picker-value">{{ form.occurredAt || '请选择日期' }}</view>
          </picker>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">来源与上下文</view>

        <view class="form-item">
          <text class="form-label">落地页 ID</text>
          <input type="text" v-model="form.landingPageId" placeholder="落地页标识" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">报价请求 ID</text>
          <input type="text" v-model="form.quoteRequestId" placeholder="关联报价请求" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">语言</text>
          <input type="text" v-model="form.lang" placeholder="如 zh-CN / en-US" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">UTM Source</text>
          <input type="text" v-model="form.utmSource" placeholder="utm_source" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">UTM Medium</text>
          <input type="text" v-model="form.utmMedium" placeholder="utm_medium" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">UTM Campaign</text>
          <input type="text" v-model="form.utmCampaign" placeholder="utm_campaign" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">IP 地址</text>
          <input type="text" v-model="form.ipAddress" placeholder="访客 IP" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">User Agent</text>
          <textarea v-model="form.userAgent" placeholder="浏览器 UA" class="form-textarea" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { conversionEventApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const form = ref({
  funnel: '',
  eventName: '',
  step: 1,
  visitorId: '',
  user: '',
  sessionId: '',
  landingPageId: '',
  quoteRequestId: '',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  lang: '',
  ipAddress: '',
  userAgent: '',
  occurredAt: ''
})

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await conversionEventApi.detail(documentId.value)
    if (item) {
      Object.keys(form.value).forEach(key => {
        if (item[key] !== undefined && item[key] !== null) {
          form.value[key] = typeof item[key] === 'object' ? item[key].documentId || '' : item[key]
        }
      })
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function goBack() {
  uni.navigateBack()
}

async function handleSubmit() {
  if (!form.value.eventName) return uni.showToast({ title: '请填写事件名称', icon: 'none' })
  if (!form.value.visitorId) return uni.showToast({ title: '请填写访客 ID', icon: 'none' })
  if (!form.value.occurredAt) return uni.showToast({ title: '请选择发生时间', icon: 'none' })
  try {
    if (isEdit.value) {
      await conversionEventApi.update(documentId.value, form.value)
    } else {
      await conversionEventApi.create(form.value)
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
  margin-left: 12rpx;
}
.btn-secondary {
  background: #f5f5f5; color: #333;
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
.picker-value {
  display: flex; align-items: center;
  color: #333;
}
</style>
