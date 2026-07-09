<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑字段规则' : '新增字段规则'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">规则名称 *</text>
          <input type="text" v-model="form.name" placeholder="请输入规则名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">路线 ID</text>
          <input type="text" v-model="form.routeId" placeholder="请输入路线 ID" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">服务商</text>
          <input type="text" v-model="form.serviceProvider" placeholder="请输入服务商" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">客户类型</text>
          <picker mode="selector" :range="customerTypeLabelOptions" :value="customerTypeValueIndex" @change="handleCustomerTypeChange">
            <view class="form-picker">
              <text>{{ customerTypeLabelOptions[customerTypeValueIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">优先级</text>
          <input type="number" v-model="form.priority" placeholder="请输入优先级（数字越大越优先）" class="form-input" />
        </view>

        <view class="form-item form-row">
          <text class="form-label">是否启用 *</text>
          <switch :checked="form.isActive" @change="form.isActive = $event.detail.value" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">字段配置</view>

        <view class="form-item">
          <text class="form-label">字段定义 (JSON) *</text>
          <textarea v-model="form.fields" placeholder='[{"name":"weight","type":"number","label":"重量","required":true}]' class="form-textarea json-textarea" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { quoteFieldRuleApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const customerTypeEnumList = ['', 'individual', 'business', 'fba_seller']
const customerTypeLabelOptions = ['不限', '个人', '企业', 'FBA 卖家']

const form = ref({
  name: '',
  routeId: '',
  serviceProvider: '',
  customerType: '',
  isActive: true,
  priority: 0,
  fields: ''
})

const customerTypeValueIndex = computed(() => {
  const idx = customerTypeEnumList.indexOf(form.value.customerType)
  return idx >= 0 ? idx : 0
})

function handleCustomerTypeChange(e) {
  form.value.customerType = customerTypeEnumList[e.detail.value]
}

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await quoteFieldRuleApi.detail(documentId.value)
    if (item) {
      form.value = {
        name: item.name || '',
        routeId: item.routeId || '',
        serviceProvider: item.serviceProvider || '',
        customerType: item.customerType || '',
        isActive: item.isActive !== false,
        priority: item.priority ?? 0,
        fields: typeof item.fields === 'string' ? item.fields : JSON.stringify(item.fields || '', null, 2)
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.name) {
    uni.showToast({ title: '请填写规则名称', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  try {
    if (isEdit.value) {
      await quoteFieldRuleApi.update(documentId.value, payload)
    } else {
      await quoteFieldRuleApi.create(payload)
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
