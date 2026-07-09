<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑公式模板' : '新增公式模板'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">公式名称 *</text>
          <input type="text" v-model="form.name" placeholder="请输入公式名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">描述</text>
          <textarea v-model="form.description" placeholder="请输入公式描述" class="form-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">表达式 *</text>
          <textarea v-model="form.expression" placeholder="例: basePrice + (weight * pricePerKg) + surcharge" class="form-textarea mono-textarea" />
        </view>

        <view class="form-item form-row">
          <text class="form-label">是否启用 *</text>
          <switch :checked="form.isActive" @change="form.isActive = $event.detail.value" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">变量定义</view>

        <view class="form-item">
          <text class="form-label">变量 (JSON) *</text>
          <textarea v-model="form.variables" placeholder='[{"name":"weight","type":"number","label":"重量"},{"name":"pricePerKg","type":"number","label":"单价"}]' class="form-textarea json-textarea" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { quotePriceFormulaApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const form = ref({
  name: '',
  description: '',
  expression: '',
  variables: '',
  isActive: true
})

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await quotePriceFormulaApi.detail(documentId.value)
    if (item) {
      form.value = {
        name: item.name || '',
        description: item.description || '',
        expression: item.expression || '',
        variables: typeof item.variables === 'string' ? item.variables : JSON.stringify(item.variables || '', null, 2),
        isActive: item.isActive !== false
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.name || !form.value.expression) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  try {
    if (isEdit.value) {
      await quotePriceFormulaApi.update(documentId.value, payload)
    } else {
      await quotePriceFormulaApi.create(payload)
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
  min-height: 240rpx;
  font-family: monospace;
}

.mono-textarea {
  font-family: monospace;
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
