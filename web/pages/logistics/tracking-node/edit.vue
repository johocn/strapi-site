<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑追踪节点' : '新增追踪节点'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">运单 ID *</text>
          <input type="text" v-model="form.shipment" placeholder="关联运单 documentId" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">节点状态 *</text>
          <picker mode="selector" :range="nodeStatusLabelOptions" :value="nodeStatusValueIndex" @change="handleNodeStatusChange">
            <view class="form-picker">
              <text>{{ nodeStatusLabelOptions[nodeStatusValueIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">节点类型 *</text>
          <picker mode="selector" :range="nodeTypeLabelOptions" :value="nodeTypeValueIndex" @change="handleNodeTypeChange">
            <view class="form-picker">
              <text>{{ nodeTypeLabelOptions[nodeTypeValueIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">数据来源 *</text>
          <picker mode="selector" :range="dataSourceLabelOptions" :value="dataSourceValueIndex" @change="handleDataSourceChange">
            <view class="form-picker">
              <text>{{ dataSourceLabelOptions[dataSourceValueIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">节点详情</view>

        <view class="form-item">
          <text class="form-label">位置</text>
          <input type="text" v-model="form.location" placeholder="请输入位置" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">事件时间 *</text>
          <picker mode="date" :value="form.eventTimeDate" @change="form.eventTimeDate = $event.detail.value">
            <view class="form-picker">
              <text>{{ form.eventTimeDate || '请选择日期' }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
          <input type="text" v-model="form.eventTimeTime" placeholder="时间 (HH:mm:ss)" class="form-input time-input" />
        </view>

        <view class="form-item">
          <text class="form-label">描述 *</text>
          <textarea v-model="form.description" placeholder="请输入节点描述" class="form-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">服务商引用</text>
          <input type="text" v-model="form.providerRef" placeholder="请输入服务商引用" class="form-input" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { trackingNodeApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const nodeStatusEnumList = ['done', 'active', 'pending', 'alert']
const nodeStatusLabelOptions = ['已完成', '进行中', '待处理', '异常']

const nodeTypeEnumList = ['picked_up', 'export', 'import', 'customs', 'hold', 'delivery', 'delivered', 'exception']
const nodeTypeLabelOptions = ['已揽收', '出口', '进口', '清关', '滞留', '派送', '已签收', '异常']

const dataSourceEnumList = ['internal', 'external']
const dataSourceLabelOptions = ['内部', '外部']

const form = ref({
  shipment: '',
  nodeStatus: 'done',
  nodeType: 'picked_up',
  location: '',
  eventTimeDate: '',
  eventTimeTime: '',
  description: '',
  dataSource: 'internal',
  providerRef: ''
})

const nodeStatusValueIndex = computed(() => {
  const idx = nodeStatusEnumList.indexOf(form.value.nodeStatus)
  return idx >= 0 ? idx : 0
})

const nodeTypeValueIndex = computed(() => {
  const idx = nodeTypeEnumList.indexOf(form.value.nodeType)
  return idx >= 0 ? idx : 0
})

const dataSourceValueIndex = computed(() => {
  const idx = dataSourceEnumList.indexOf(form.value.dataSource)
  return idx >= 0 ? idx : 0
})

function handleNodeStatusChange(e) {
  form.value.nodeStatus = nodeStatusEnumList[e.detail.value]
}

function handleNodeTypeChange(e) {
  form.value.nodeType = nodeTypeEnumList[e.detail.value]
}

function handleDataSourceChange(e) {
  form.value.dataSource = dataSourceEnumList[e.detail.value]
}

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await trackingNodeApi.detail(documentId.value)
    if (item) {
      const eventTime = item.eventTime || ''
      form.value = {
        shipment: item.shipment?.documentId || item.shipment || '',
        nodeStatus: item.nodeStatus || 'done',
        nodeType: item.nodeType || 'picked_up',
        location: item.location || '',
        eventTimeDate: eventTime ? eventTime.substring(0, 10) : '',
        eventTimeTime: eventTime ? eventTime.substring(11, 19) : '',
        description: item.description || '',
        dataSource: item.dataSource || 'internal',
        providerRef: item.providerRef || ''
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.shipment || !form.value.description) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  const eventTime = form.value.eventTimeDate && form.value.eventTimeTime
    ? `${form.value.eventTimeDate}T${form.value.eventTimeTime}`
    : form.value.eventTimeDate ? `${form.value.eventTimeDate}T00:00:00` : ''
  if (!eventTime) {
    uni.showToast({ title: '请选择事件时间', icon: 'none' })
    return
  }
  const payload = {
    shipment: form.value.shipment,
    nodeStatus: form.value.nodeStatus,
    nodeType: form.value.nodeType,
    location: form.value.location,
    eventTime,
    description: form.value.description,
    dataSource: form.value.dataSource,
    providerRef: form.value.providerRef
  }
  try {
    if (isEdit.value) {
      await trackingNodeApi.update(documentId.value, payload)
    } else {
      await trackingNodeApi.create(payload)
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

.time-input {
  margin-top: 12rpx;
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
</style>
