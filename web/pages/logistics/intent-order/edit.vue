<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑意向订单' : '新增意向订单'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission('logistics.intent-order.create')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">订单信息</view>

        <view class="form-item">
          <text class="form-label">订单号 *</text>
          <input type="text" v-model="form.orderNo" placeholder="请输入订单号" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">报价请求 ID *</text>
          <input type="text" v-model="form.quoteRequestId" placeholder="关联报价请求" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">线索 ID</text>
          <input type="text" v-model="form.leadId" placeholder="关联线索" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">状态 *</text>
          <picker mode="selector" :range="statusOptions" @change="(e) => form.status = statusValues[e.detail.value]">
            <view class="form-input picker-value">{{ statusText(form.status) }}</view>
          </picker>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">客户信息</view>

        <view class="form-item">
          <text class="form-label">客户名称 *</text>
          <input type="text" v-model="form.customerName" placeholder="客户名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">联系方式 *</text>
          <input type="text" v-model="form.customerContact" placeholder="电话/邮箱/IM" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">客户类型</text>
          <picker mode="selector" :range="customerTypeOptions" @change="(e) => form.customerType = customerTypeValues[e.detail.value]">
            <view class="form-input picker-value">{{ customerTypeText(form.customerType) }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">负责跟进人 ID</text>
          <input type="text" v-model="form.assignedTo" placeholder="管理员 documentId" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">货物与路线</view>

        <view class="form-item">
          <text class="form-label">确认价格 (JSON) *</text>
          <textarea v-model="form.confirmedPrice" placeholder='{"amount":1000,"currency":"USD"}' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">货物摘要 (JSON) *</text>
          <textarea v-model="form.cargoSummary" placeholder='{"weight":100,"volume":1}' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">路线摘要 (JSON) *</text>
          <textarea v-model="form.routeSummary" placeholder='{"origin":"CN","destination":"US"}' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">计划发货日期</text>
          <picker mode="date" :value="form.plannedShipDate" @change="(e) => form.plannedShipDate = e.detail.value">
            <view class="form-input picker-value">{{ form.plannedShipDate || '请选择日期' }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">实际发货日期</text>
          <picker mode="date" :value="form.actualShipDate" @change="(e) => form.actualShipDate = e.detail.value">
            <view class="form-input picker-value">{{ form.actualShipDate || '请选择日期' }}</view>
          </picker>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">合同与定金</view>

        <view class="form-item form-row">
          <text class="form-label">已签合同</text>
          <switch :checked="form.contractSigned" @change="(e) => form.contractSigned = e.detail.value" />
        </view>

        <view class="form-item form-row">
          <text class="form-label">已付定金</text>
          <switch :checked="form.depositPaid" @change="(e) => form.depositPaid = e.detail.value" />
        </view>

        <view class="form-item">
          <text class="form-label">定金金额</text>
          <input type="number" v-model="form.depositAmount" placeholder="定金金额" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">已转正式订单 ID</text>
          <input type="text" v-model="form.convertedToOrderId" placeholder="转换后的正式订单 ID" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">跟进与备注</view>

        <view class="form-item">
          <text class="form-label">跟进记录 (JSON)</text>
          <textarea v-model="form.followUpRecords" placeholder='[{"at":"2026-01-01","note":"跟进"}]' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">备注</text>
          <textarea v-model="form.remark" placeholder="备注" class="form-textarea" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { intentOrderApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const statusOptions = ['意向', '已确认', '运输中', '已交付', '已取消']
const statusValues = ['intent', 'confirmed', 'shipping', 'delivered', 'cancelled']
const statusMap = { intent: '意向', confirmed: '已确认', shipping: '运输中', delivered: '已交付', cancelled: '已取消' }
function statusText(v) {
  const i = statusValues.indexOf(v)
  return i >= 0 ? statusOptions[i] : '请选择'
}

const customerTypeOptions = ['个人', '企业', 'FBA 卖家']
const customerTypeValues = ['individual', 'business', 'fba_seller']
function customerTypeText(v) {
  const i = customerTypeValues.indexOf(v)
  return i >= 0 ? customerTypeOptions[i] : '请选择'
}

const form = ref({
  orderNo: '',
  quoteRequestId: '',
  customerName: '',
  customerContact: '',
  customerType: 'individual',
  confirmedPrice: '',
  cargoSummary: '',
  routeSummary: '',
  plannedShipDate: '',
  actualShipDate: '',
  status: 'intent',
  assignedTo: '',
  followUpRecords: '',
  contractSigned: false,
  depositPaid: false,
  depositAmount: 0,
  convertedToOrderId: '',
  remark: '',
  leadId: ''
})

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await intentOrderApi.detail(documentId.value)
    if (item) {
      Object.keys(form.value).forEach(key => {
        if (item[key] !== undefined && item[key] !== null) {
          const val = item[key]
          if (typeof val === 'object' && key !== 'assignedTo') {
            form.value[key] = typeof val === 'string' ? val : JSON.stringify(val, null, 2)
          } else if (key === 'assignedTo' && typeof val === 'object') {
            form.value[key] = val.documentId || ''
          } else {
            form.value[key] = val
          }
        }
      })
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function goBack() {
  uni.navigateBack()
}

async function handleSubmit() {
  if (!form.value.orderNo) return uni.showToast({ title: '请填写订单号', icon: 'none' })
  if (!form.value.customerName) return uni.showToast({ title: '请填写客户名称', icon: 'none' })
  if (!form.value.customerContact) return uni.showToast({ title: '请填写联系方式', icon: 'none' })
  try {
    if (isEdit.value) {
      await intentOrderApi.update(documentId.value, form.value)
    } else {
      await intentOrderApi.create(form.value)
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
page { background: #f5f5f5; }
.page-container { min-height: 100vh; display: flex; flex-direction: column; }
.form-scroll { flex: 1; padding: 20rpx; box-sizing: border-box; }

.btn-primary {
  background: #ff0000; color: #ffffff;
  padding: 16rpx 32rpx; font-size: 30rpx;
  border-radius: 8rpx; border: none; line-height: 1.2;
  margin-left: 12rpx;
}
.btn-secondary {
  background: #f5f5f5; color: #333;
  padding: 16rpx 32rpx; font-size: 30rpx;
  border-radius: 8rpx; border: none; line-height: 1.2;
}

.form-section {
  background: #fff; border-radius: 12rpx;
  padding: 24rpx; margin-bottom: 20rpx;
}
.section-title {
  font-size: 30rpx; font-weight: bold; color: #333;
  margin-bottom: 24rpx; padding-left: 8rpx;
  border-left: 6rpx solid #ff0000;
}
.form-item { margin-bottom: 24rpx; }
.form-label {
  display: block; font-size: 26rpx; color: #666;
  margin-bottom: 12rpx;
}
.form-input {
  width: 100%; height: 72rpx; padding: 0 20rpx;
  background: #f5f5f5; border-radius: 8rpx;
  font-size: 28rpx; box-sizing: border-box;
}
.form-textarea {
  width: 100%; min-height: 160rpx; padding: 20rpx;
  background: #f5f5f5; border-radius: 8rpx;
  font-size: 28rpx; box-sizing: border-box;
}
.json-textarea {
  min-height: 200rpx; font-family: monospace;
}
.picker-value {
  display: flex; align-items: center;
  color: #333;
}
.form-row {
  display: flex; justify-content: space-between; align-items: center;
}
</style>
