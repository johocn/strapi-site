<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑运单' : '新增运单'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">运单号 *</text>
          <input type="text" v-model="form.trackingNo" placeholder="请输入运单号" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">订单 ID</text>
          <input type="text" v-model="form.orderId" placeholder="请输入订单 ID" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">状态 *</text>
          <picker mode="selector" :range="statusLabelOptions" :value="statusValueIndex" @change="handleStatusChange">
            <view class="form-picker">
              <text>{{ statusLabelOptions[statusValueIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">起始地 *</text>
          <input type="text" v-model="form.origin" placeholder="请输入起始地" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">目的地 *</text>
          <input type="text" v-model="form.destination" placeholder="请输入目的地" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">服务商</text>
          <input type="text" v-model="form.serviceProvider" placeholder="请输入服务商" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">客户信息</view>

        <view class="form-item">
          <text class="form-label">客户名称</text>
          <input type="text" v-model="form.customerName" placeholder="请输入客户名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">客户联系方式</text>
          <input type="text" v-model="form.customerContact" placeholder="请输入客户联系方式" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">时间信息</view>

        <view class="form-item">
          <text class="form-label">预计到达时间</text>
          <picker mode="date" :value="form.eta" @change="form.eta = $event.detail.value">
            <view class="form-picker">
              <text>{{ form.eta || '请选择预计到达时间' }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">实际签收时间</text>
          <picker mode="date" :value="form.actualDelivery" @change="form.actualDelivery = $event.detail.value">
            <view class="form-picker">
              <text>{{ form.actualDelivery || '请选择实际签收时间' }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">最后同步时间</text>
          <picker mode="date" :value="form.lastSyncAt" @change="form.lastSyncAt = $event.detail.value">
            <view class="form-picker">
              <text>{{ form.lastSyncAt || '请选择最后同步时间' }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">同步服务商 ID</text>
          <input type="text" v-model="form.syncProvider" placeholder="关联追踪服务商 documentId（可选）" class="form-input" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { trackingShipmentApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const statusEnumList = ['pending', 'in_transit', 'customs', 'hold', 'delivered', 'exception', 'returned']
const statusLabelOptions = ['待发货', '运输中', '清关中', '滞留', '已签收', '异常', '已退回']

const form = ref({
  trackingNo: '',
  orderId: '',
  status: 'pending',
  origin: '',
  destination: '',
  serviceProvider: '',
  eta: '',
  actualDelivery: '',
  customerName: '',
  customerContact: '',
  lastSyncAt: '',
  syncProvider: ''
})

const statusValueIndex = computed(() => {
  const idx = statusEnumList.indexOf(form.value.status)
  return idx >= 0 ? idx : 0
})

function handleStatusChange(e) {
  form.value.status = statusEnumList[e.detail.value]
}

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await trackingShipmentApi.detail(documentId.value)
    if (item) {
      form.value = {
        trackingNo: item.trackingNo || '',
        orderId: item.orderId || '',
        status: item.status || 'pending',
        origin: item.origin || '',
        destination: item.destination || '',
        serviceProvider: item.serviceProvider || '',
        eta: item.eta ? item.eta.substring(0, 10) : '',
        actualDelivery: item.actualDelivery ? item.actualDelivery.substring(0, 10) : '',
        customerName: item.customerName || '',
        customerContact: item.customerContact || '',
        lastSyncAt: item.lastSyncAt ? item.lastSyncAt.substring(0, 10) : '',
        syncProvider: item.syncProvider?.documentId || item.syncProvider || ''
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.trackingNo || !form.value.origin || !form.value.destination) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  try {
    if (isEdit.value) {
      await trackingShipmentApi.update(documentId.value, payload)
    } else {
      await trackingShipmentApi.create(payload)
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
</style>
