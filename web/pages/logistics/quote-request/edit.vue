<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑询价单' : '新增询价单'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">运单号</text>
          <input type="text" v-model="form.trackingNo" placeholder="请输入运单号" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">路线 ID *</text>
          <input type="text" v-model="form.routeId" placeholder="请输入路线 ID" class="form-input" />
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

        <view class="form-item">
          <text class="form-label">货物类型 *</text>
          <input type="text" v-model="form.cargoType" placeholder="请输入货物类型" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">重量 (kg) *</text>
          <input type="number" v-model="form.weight" placeholder="请输入重量" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">体积 (m³)</text>
          <input type="number" v-model="form.volume" placeholder="请输入体积" class="form-input" />
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
      </view>

      <view class="form-section">
        <view class="section-title">客户信息</view>

        <view class="form-item">
          <text class="form-label">客户名称 *</text>
          <input type="text" v-model="form.customerName" placeholder="请输入客户名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">客户联系方式 *</text>
          <input type="text" v-model="form.customerContact" placeholder="请输入客户联系方式" class="form-input" />
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
          <text class="form-label">线索 ID</text>
          <input type="text" v-model="form.leadId" placeholder="请输入线索 ID" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">语言 *</text>
          <input type="text" v-model="form.lang" placeholder="例: zh-CN" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">表单与报价数据</view>

        <view class="form-item">
          <text class="form-label">表单数据 (JSON) *</text>
          <textarea v-model="form.formData" placeholder='{}' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">报价数据 (JSON)</text>
          <textarea v-model="form.quotedPrice" placeholder='{}' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">备注</text>
          <textarea v-model="form.remark" placeholder="请输入备注" class="form-textarea" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">UTM 与有效期</view>

        <view class="form-item">
          <text class="form-label">UTM Source</text>
          <input type="text" v-model="form.utmSource" placeholder="请输入 UTM Source" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">UTM Medium</text>
          <input type="text" v-model="form.utmMedium" placeholder="请输入 UTM Medium" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">UTM Campaign</text>
          <input type="text" v-model="form.utmCampaign" placeholder="请输入 UTM Campaign" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">过期时间</text>
          <picker mode="date" :value="form.expiresAt" @change="form.expiresAt = $event.detail.value">
            <view class="form-picker">
              <text>{{ form.expiresAt || '请选择过期时间' }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { quoteRequestApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const statusEnumList = ['draft', 'submitted', 'quoted', 'accepted', 'rejected', 'expired']
const statusLabelOptions = ['草稿', '已提交', '已报价', '已接受', '已拒绝', '已过期']

const customerTypeEnumList = ['individual', 'business', 'fba_seller']
const customerTypeLabelOptions = ['个人', '企业', 'FBA 卖家']

const form = ref({
  trackingNo: '',
  routeId: '',
  origin: '',
  destination: '',
  serviceProvider: '',
  cargoType: '',
  weight: '',
  volume: '',
  formData: '',
  quotedPrice: '',
  status: 'submitted',
  leadId: '',
  customerName: '',
  customerContact: '',
  customerType: '',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  lang: 'zh-CN',
  remark: '',
  expiresAt: ''
})

const statusValueIndex = computed(() => {
  const idx = statusEnumList.indexOf(form.value.status)
  return idx >= 0 ? idx : 0
})

const customerTypeValueIndex = computed(() => {
  const idx = customerTypeEnumList.indexOf(form.value.customerType)
  return idx >= 0 ? idx : 0
})

function handleStatusChange(e) {
  form.value.status = statusEnumList[e.detail.value]
}

function handleCustomerTypeChange(e) {
  form.value.customerType = customerTypeEnumList[e.detail.value]
}

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await quoteRequestApi.detail(documentId.value)
    if (item) {
      form.value = {
        trackingNo: item.trackingNo || '',
        routeId: item.routeId || '',
        origin: item.origin || '',
        destination: item.destination || '',
        serviceProvider: item.serviceProvider || '',
        cargoType: item.cargoType || '',
        weight: item.weight ?? '',
        volume: item.volume ?? '',
        formData: typeof item.formData === 'string' ? item.formData : JSON.stringify(item.formData || '', null, 2),
        quotedPrice: typeof item.quotedPrice === 'string' ? item.quotedPrice : JSON.stringify(item.quotedPrice || '', null, 2),
        status: item.status || 'submitted',
        leadId: item.leadId || '',
        customerName: item.customerName || '',
        customerContact: item.customerContact || '',
        customerType: item.customerType || '',
        utmSource: item.utmSource || '',
        utmMedium: item.utmMedium || '',
        utmCampaign: item.utmCampaign || '',
        lang: item.lang || 'zh-CN',
        remark: item.remark || '',
        expiresAt: item.expiresAt ? item.expiresAt.substring(0, 10) : ''
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.routeId || !form.value.origin || !form.value.destination || !form.value.cargoType || !form.value.weight) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  if (!form.value.customerName || !form.value.customerContact || !form.value.lang) {
    uni.showToast({ title: '请填写客户信息', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  try {
    if (isEdit.value) {
      await quoteRequestApi.update(documentId.value, payload)
    } else {
      await quoteRequestApi.create(payload)
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
</style>
