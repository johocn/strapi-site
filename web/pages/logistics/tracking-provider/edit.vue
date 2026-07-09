<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑服务商配置' : '新增服务商配置'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">服务商名称 *</text>
          <input type="text" v-model="form.name" placeholder="请输入服务商名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">服务商类型 *</text>
          <picker mode="selector" :range="providerTypeLabelOptions" :value="providerTypeValueIndex" @change="handleProviderTypeChange">
            <view class="form-picker">
              <text>{{ providerTypeLabelOptions[providerTypeValueIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">API Key *</text>
          <input type="text" v-model="form.apiKey" placeholder="请输入 API Key" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">API Secret</text>
          <input type="text" v-model="form.apiSecret" placeholder="请输入 API Secret" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">接口地址</text>
          <input type="text" v-model="form.endpoint" placeholder="请输入接口地址" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">速率限制 (次/小时)</text>
          <input type="number" v-model="form.rateLimit" placeholder="请输入速率限制" class="form-input" />
        </view>

        <view class="form-item form-row">
          <text class="form-label">是否启用 *</text>
          <switch :checked="form.isEnabled" @change="form.isEnabled = $event.detail.value" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">扩展配置</view>

        <view class="form-item">
          <text class="form-label">支持的承运商 (JSON)</text>
          <textarea v-model="form.supportedCarriers" placeholder='["dhl","fedex","ups"]' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">额外配置 (JSON)</text>
          <textarea v-model="form.extraConfig" placeholder='{"timeout":5000,"retry":3}' class="form-textarea json-textarea" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { trackingProviderApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const providerTypeEnumList = ['track17', 'afterShip', 'kuaidi100', 'customApi']
const providerTypeLabelOptions = ['17Track', 'AfterShip', '快递100', '自定义 API']

const form = ref({
  name: '',
  providerType: 'track17',
  apiKey: '',
  apiSecret: '',
  endpoint: '',
  isEnabled: true,
  rateLimit: '',
  supportedCarriers: '',
  extraConfig: ''
})

const providerTypeValueIndex = computed(() => {
  const idx = providerTypeEnumList.indexOf(form.value.providerType)
  return idx >= 0 ? idx : 0
})

function handleProviderTypeChange(e) {
  form.value.providerType = providerTypeEnumList[e.detail.value]
}

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await trackingProviderApi.detail(documentId.value)
    if (item) {
      form.value = {
        name: item.name || '',
        providerType: item.providerType || 'track17',
        apiKey: item.apiKey || '',
        apiSecret: item.apiSecret || '',
        endpoint: item.endpoint || '',
        isEnabled: item.isEnabled !== false,
        rateLimit: item.rateLimit ?? '',
        supportedCarriers: typeof item.supportedCarriers === 'string' ? item.supportedCarriers : JSON.stringify(item.supportedCarriers || '', null, 2),
        extraConfig: typeof item.extraConfig === 'string' ? item.extraConfig : JSON.stringify(item.extraConfig || '', null, 2)
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.name || !form.value.providerType || !form.value.apiKey) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  try {
    if (isEdit.value) {
      await trackingProviderApi.update(documentId.value, payload)
    } else {
      await trackingProviderApi.create(payload)
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

.json-textarea {
  min-height: 200rpx;
  font-family: monospace;
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

.form-row .form-label {
  margin-bottom: 0;
}
</style>
