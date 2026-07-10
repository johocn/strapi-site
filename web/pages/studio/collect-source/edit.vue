<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑采集源' : '新增采集源'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">名称 *</text>
          <input type="text" v-model="form.name" placeholder="请输入采集源名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">URL *</text>
          <input type="text" v-model="form.url" placeholder="请输入采集地址" class="form-input" />
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
          <text class="form-label">模板</text>
          <input type="text" v-model="form.template" placeholder="采集模板名称" class="form-input" />
        </view>

        <view class="form-item form-row">
          <text class="form-label">启用状态</text>
          <switch :checked="form.isActive" @change="form.isActive = !form.isActive" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">选择器配置</view>

        <view class="form-item">
          <text class="form-label">标题选择器</text>
          <input type="text" v-model="form.titleSelector" placeholder="CSS 选择器" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">内容选择器</text>
          <input type="text" v-model="form.contentSelector" placeholder="CSS 选择器" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">作者选择器</text>
          <input type="text" v-model="form.authorSelector" placeholder="CSS 选择器" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">日期选择器</text>
          <input type="text" v-model="form.dateSelector" placeholder="CSS 选择器" class="form-input" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { collectSourceApi } from '../../../src/api/studio.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const typeEnumList = ['template', 'custom']
const typeLabelOptions = ['模板', '自定义']

const form = ref({
  name: '',
  url: '',
  type: 'template',
  template: '',
  titleSelector: '',
  contentSelector: '',
  authorSelector: '',
  dateSelector: '',
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
    const item = await collectSourceApi.detail(documentId.value)
    if (item) {
      form.value = {
        name: item.name || '',
        url: item.url || '',
        type: item.type || 'template',
        template: item.template || '',
        titleSelector: item.titleSelector || '',
        contentSelector: item.contentSelector || '',
        authorSelector: item.authorSelector || '',
        dateSelector: item.dateSelector || '',
        isActive: item.isActive !== false
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.name || !form.value.url) {
    uni.showToast({ title: '请填写名称和 URL', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  try {
    if (isEdit.value) {
      await collectSourceApi.update(documentId.value, payload)
    } else {
      await collectSourceApi.create(payload)
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
