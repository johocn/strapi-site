<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑广告位' : '新增广告位'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">名称 *</text>
          <input type="text" v-model="form.name" placeholder="请输入广告位名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">编码 *</text>
          <input type="text" v-model="form.code" placeholder="请输入唯一编码" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">位置</text>
          <picker mode="selector" :range="positionLabelOptions" :value="positionValueIndex" @change="handlePositionChange">
            <view class="form-picker">
              <text>{{ positionLabelOptions[positionValueIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">类型</text>
          <picker mode="selector" :range="typeLabelOptions" :value="typeValueIndex" @change="handleTypeChange">
            <view class="form-picker">
              <text>{{ typeLabelOptions[typeValueIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">是否启用</text>
          <view class="form-switch-row">
            <switch :checked="form.isActive" @change="form.isActive = $event.detail.value" />
            <text class="switch-text">{{ form.isActive ? '启用' : '停用' }}</text>
          </view>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">链接与资源</view>

        <view class="form-item">
          <text class="form-label">目标链接</text>
          <input type="text" v-model="form.targetUrl" placeholder="请输入目标 URL" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">商品 ID</text>
          <input type="text" v-model="form.productId" placeholder="请输入商品 ID" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">图片 URL</text>
          <input type="text" v-model="form.imageUrl" placeholder="请输入图片 URL" class="form-input" />
        </view>

        <view class="form-item" v-if="form.imageUrl">
          <text class="form-label">图片预览</text>
          <image :src="form.imageUrl" mode="aspectFit" class="image-preview" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { adSlotApi } from '../../../src/api/studio.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const positionEnumList = ['article-content', 'sidebar', 'footer', 'header', 'list-page', 'home-page']
const positionLabelOptions = ['文章内容', '侧边栏', '页脚', '页头', '列表页', '首页']

const typeEnumList = ['product-link', 'banner', 'popup', 'native']
const typeLabelOptions = ['商品链接', '横幅', '弹窗', '原生']

const form = ref({
  name: '',
  code: '',
  position: 'article-content',
  type: 'product-link',
  targetUrl: '',
  productId: '',
  imageUrl: '',
  isActive: true
})

const positionValueIndex = computed(() => {
  const idx = positionEnumList.indexOf(form.value.position)
  return idx >= 0 ? idx : 0
})

const typeValueIndex = computed(() => {
  const idx = typeEnumList.indexOf(form.value.type)
  return idx >= 0 ? idx : 0
})

function handlePositionChange(e) {
  form.value.position = positionEnumList[e.detail.value]
}

function handleTypeChange(e) {
  form.value.type = typeEnumList[e.detail.value]
}

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await adSlotApi.detail(documentId.value)
    if (item) {
      form.value = {
        name: item.name || '',
        code: item.code || '',
        position: item.position || 'article-content',
        type: item.type || 'product-link',
        targetUrl: item.targetUrl || '',
        productId: item.productId || '',
        imageUrl: item.imageUrl || '',
        isActive: item.isActive !== false
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.name || !form.value.code) {
    uni.showToast({ title: '请填写名称和编码', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  try {
    if (isEdit.value) {
      await adSlotApi.update(documentId.value, payload)
    } else {
      await adSlotApi.create(payload)
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

.form-switch-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.switch-text {
  font-size: 28rpx;
  color: #666;
}

.image-preview {
  width: 100%;
  height: 300rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
}

.arrow {
  font-size: 20rpx;
  color: #999;
}
</style>
