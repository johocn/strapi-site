<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑用户应用角色' : '新增用户应用角色'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">角色配置</view>

        <view class="form-item">
          <text class="form-label">用户 documentId *</text>
          <input type="text" v-model="form.user" placeholder="请输入用户 documentId" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">应用编码 *</text>
          <input type="text" v-model="form.app_code" placeholder="请输入应用编码" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">角色 *</text>
          <input type="text" v-model="form.role" placeholder="请输入角色标识" class="form-input" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ssoUserRoleApi } from '../../../src/api/sso.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const form = ref({
  user: '',
  app_code: '',
  role: ''
})

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await ssoUserRoleApi.detail(documentId.value)
    if (item) {
      form.value = {
        user: item.user?.documentId || item.user || '',
        app_code: item.app_code || '',
        role: item.role || ''
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.user || !form.value.app_code || !form.value.role) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  try {
    if (isEdit.value) {
      await ssoUserRoleApi.update(documentId.value, payload)
    } else {
      await ssoUserRoleApi.create(payload)
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
</style>
