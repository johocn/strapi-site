<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑联系渠道' : '新增联系渠道'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">语言 *</text>
          <picker mode="selector" :range="langLabelOptions" :value="langValueIndex" @change="handleLangChange">
            <view class="form-picker">
              <text>{{ langLabelOptions[langValueIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">国旗标识 *</text>
          <input type="text" v-model="form.flag" placeholder="例: 🇨🇳" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">简称 *</text>
          <input type="text" v-model="form.short" placeholder="例: CN" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">邮箱 *</text>
          <input type="text" v-model="form.email" placeholder="请输入邮箱" class="form-input" />
        </view>

        <view class="form-item form-row">
          <text class="form-label">是否启用 *</text>
          <switch :checked="form.isActive" @change="form.isActive = $event.detail.value" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">联系配置</view>

        <view class="form-item">
          <text class="form-label">主要联系方式 (JSON) *</text>
          <textarea v-model="form.primary" placeholder='{"phone":"+86-400-xxx","email":"support@xxx.com"}' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">联系渠道 (JSON) *</text>
          <textarea v-model="form.channels" placeholder='[{"type":"wechat","label":"微信","value":"xxx"}]' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">热线 (JSON) *</text>
          <textarea v-model="form.hotline" placeholder='{"phone":"400-xxx","hours":"9:00-18:00"}' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">回拨提示</text>
          <textarea v-model="form.callbackNote" placeholder="请输入回拨提示文案" class="form-textarea" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { contactMatrixApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const langEnumList = ['cn', 'jp', 'kr', 'vn']
const langLabelOptions = ['中文', '日文', '韩文', '越南文']

const form = ref({
  lang: 'cn',
  flag: '',
  short: '',
  primary: '',
  channels: '',
  hotline: '',
  email: '',
  callbackNote: '',
  isActive: true
})

const langValueIndex = computed(() => {
  const idx = langEnumList.indexOf(form.value.lang)
  return idx >= 0 ? idx : 0
})

function handleLangChange(e) {
  form.value.lang = langEnumList[e.detail.value]
}

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await contactMatrixApi.detail(documentId.value)
    if (item) {
      form.value = {
        lang: item.lang || 'cn',
        flag: item.flag || '',
        short: item.short || '',
        primary: typeof item.primary === 'string' ? item.primary : JSON.stringify(item.primary || '', null, 2),
        channels: typeof item.channels === 'string' ? item.channels : JSON.stringify(item.channels || '', null, 2),
        hotline: typeof item.hotline === 'string' ? item.hotline : JSON.stringify(item.hotline || '', null, 2),
        email: item.email || '',
        callbackNote: item.callbackNote || '',
        isActive: item.isActive !== false
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.lang || !form.value.flag || !form.value.short || !form.value.email) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  try {
    if (isEdit.value) {
      await contactMatrixApi.update(documentId.value, payload)
    } else {
      await contactMatrixApi.create(payload)
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
