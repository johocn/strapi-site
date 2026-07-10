<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑 OAuth 配置' : '新增 OAuth 配置'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">Provider *</text>
          <input type="text" v-model="form.provider" placeholder="如: wechat / google / github" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">App ID *</text>
          <input type="text" v-model="form.app_id" placeholder="请输入 App ID" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">App Secret *</text>
          <input type="password" v-model="form.app_secret" placeholder="请输入 App Secret" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">Scope</text>
          <input type="text" v-model="form.scope" placeholder="如: snsapi_userinfo" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">描述</text>
          <input type="text" v-model="form.description" placeholder="请输入描述" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">配置详情</view>

        <view class="form-item">
          <text class="form-label">额外配置 (JSON)</text>
          <textarea v-model="form.extra_config" placeholder='{}' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">回调地址 (JSON 数组)</text>
          <textarea v-model="form.redirect_uris" placeholder='["https://example.com/callback"]' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">启用状态</text>
          <view class="form-switch-row">
            <switch :checked="form.is_enabled" @change="form.is_enabled = $event.detail.value" />
            <text class="switch-label">{{ form.is_enabled ? '已启用' : '已禁用' }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ssoOauthConfigApi } from '../../../src/api/sso.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const form = ref({
  provider: '',
  app_id: '',
  app_secret: '',
  scope: '',
  extra_config: '',
  redirect_uris: '',
  is_enabled: true,
  description: ''
})

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await ssoOauthConfigApi.detail(documentId.value)
    if (item) {
      form.value = {
        provider: item.provider || '',
        app_id: item.app_id || '',
        app_secret: '',
        scope: item.scope || '',
        extra_config: typeof item.extra_config === 'string' ? item.extra_config : JSON.stringify(item.extra_config || {}, null, 2),
        redirect_uris: typeof item.redirect_uris === 'string' ? item.redirect_uris : JSON.stringify(item.redirect_uris || [], null, 2),
        is_enabled: item.is_enabled ?? true,
        description: item.description || ''
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.provider || !form.value.app_id) {
    uni.showToast({ title: '请填写 Provider 和 App ID', icon: 'none' })
    return
  }
  if (!isEdit.value && !form.value.app_secret) {
    uni.showToast({ title: '请填写 App Secret', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  if (isEdit.value && !payload.app_secret) {
    delete payload.app_secret
  }
  try {
    if (isEdit.value) {
      await ssoOauthConfigApi.update(documentId.value, payload)
    } else {
      await ssoOauthConfigApi.create(payload)
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

.form-switch-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.switch-label {
  font-size: 28rpx;
  color: #666;
}
</style>
