<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑发布账号' : '新增发布账号'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">名称 *</text>
          <input type="text" v-model="form.name" placeholder="请输入账号名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">所属平台 *</text>
          <picker v-if="platformOptions.length" mode="selector" :range="platformOptions" :value="platformIndex" @change="handlePlatformChange">
            <view class="form-picker">
              <text>{{ platformOptions[platformIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
          <view v-else class="form-picker">
            <text class="placeholder">暂无可选平台</text>
          </view>
        </view>

        <view class="form-item form-row">
          <text class="form-label">启用状态</text>
          <switch :checked="form.isActive" @change="form.isActive = !form.isActive" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">配置</view>

        <view class="form-item">
          <text class="form-label">配置 (JSON)</text>
          <textarea v-model="form.config" placeholder='{"token":"","cookies":""}' class="form-textarea json-textarea" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { publishAccountApi, publishPlatformApi } from '../../../src/api/studio.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const platformList = ref([])
const platformIndex = ref(0)
const platformOptions = computed(() => platformList.value.map(p => p.name || p.documentId))

const form = ref({
  name: '',
  platformId: '',
  config: '',
  isActive: true
})

function handlePlatformChange(e) {
  platformIndex.value = e.detail.value
  const platform = platformList.value[e.detail.value]
  form.value.platformId = platform?.documentId || ''
}

async function loadPlatforms() {
  try {
    const { list } = await publishPlatformApi.list({ 'pagination[pageSize]': 100 })
    platformList.value = list || []
    if (platformList.value.length && form.value.platformId) {
      const idx = platformList.value.findIndex(p => p.documentId === form.value.platformId)
      platformIndex.value = idx >= 0 ? idx : 0
    }
  } catch (e) {
    platformList.value = []
  }
}

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await publishAccountApi.detail(documentId.value)
    if (item) {
      const platform = item.platform
      const platformId = platform && typeof platform === 'object' ? (platform.documentId || '') : (platform || '')
      form.value = {
        name: item.name || '',
        platformId,
        config: typeof item.config === 'string' ? item.config : JSON.stringify(item.config || '', null, 2),
        isActive: item.isActive !== false
      }
      if (platformId && platformList.value.length) {
        const idx = platformList.value.findIndex(p => p.documentId === platformId)
        platformIndex.value = idx >= 0 ? idx : 0
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.name) {
    uni.showToast({ title: '请填写名称', icon: 'none' })
    return
  }
  if (!form.value.platformId) {
    uni.showToast({ title: '请选择所属平台', icon: 'none' })
    return
  }
  const payload = {
    name: form.value.name,
    platform: form.value.platformId,
    config: form.value.config,
    isActive: form.value.isActive
  }
  try {
    if (isEdit.value) {
      await publishAccountApi.update(documentId.value, payload)
    } else {
      await publishAccountApi.create(payload)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

onLoad(async (options) => {
  await loadPlatforms()
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
  min-height: 240rpx;
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

.placeholder {
  color: #999;
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
