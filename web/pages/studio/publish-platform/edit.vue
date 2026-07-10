<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑发布平台' : '新增发布平台'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">名称 *</text>
          <input type="text" v-model="form.name" placeholder="请输入平台名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">类型 *</text>
          <picker mode="selector" :range="typeLabelOptions" :value="typeValueIndex" @change="handleTypeChange">
            <view class="form-picker">
              <text>{{ typeLabelOptions[typeValueIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">描述</text>
          <textarea v-model="form.description" placeholder="请输入平台描述" class="form-textarea" />
        </view>

        <view class="form-item form-row">
          <text class="form-label">启用状态</text>
          <switch :checked="form.isActive" @change="form.isActive = !form.isActive" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { publishPlatformApi } from '../../../src/api/studio.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const typeEnumList = ['toutiao', 'xiaohongshu', 'wechat', 'custom', 'internal']
const typeLabelOptions = ['头条', '小红书', '微信', '自定义', '内部']

const form = ref({
  name: '',
  type: 'toutiao',
  description: '',
  isActive: true
})

const typeValueIndex = computed(() => {
  const idx = typeEnumList.indexOf(form.value.type)
  return idx >= 0 ? idx : 0
})

function handleTypeChange(e) {
  form.value.type = typeEnumList[e.detail.value]
}

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await publishPlatformApi.detail(documentId.value)
    if (item) {
      form.value = {
        name: item.name || '',
        type: item.type || 'toutiao',
        description: item.description || '',
        isActive: item.isActive !== false
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.name || !form.value.type) {
    uni.showToast({ title: '请填写名称和类型', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  try {
    if (isEdit.value) {
      await publishPlatformApi.update(documentId.value, payload)
    } else {
      await publishPlatformApi.create(payload)
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
</style>
