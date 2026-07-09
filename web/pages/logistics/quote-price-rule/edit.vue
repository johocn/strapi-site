<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑报价规则' : '新增报价规则'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">路线 ID *</text>
          <input type="text" v-model="form.routeId" placeholder="请输入路线 ID" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">服务商 *</text>
          <input type="text" v-model="form.serviceProvider" placeholder="请输入服务商" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">最小重量 (kg) *</text>
          <input type="number" v-model="form.minWeight" placeholder="请输入最小重量" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">最大重量 (kg) *</text>
          <input type="number" v-model="form.maxWeight" placeholder="请输入最大重量" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">单价/kg *</text>
          <input type="number" v-model="form.pricePerKg" placeholder="请输入单价" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">币种 *</text>
          <input type="text" v-model="form.currency" placeholder="例: CNY" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">附加费用与规则</view>

        <view class="form-item">
          <text class="form-label">体积系数</text>
          <input type="number" v-model="form.volumetricFactor" placeholder="请输入体积系数" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">最低运费</text>
          <input type="number" v-model="form.minCharge" placeholder="请输入最低运费" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">附加费 (JSON)</text>
          <textarea v-model="form.surcharges" placeholder='[{"name":"燃油附加费","type":"percent","value":15}]' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">公式模板 ID</text>
          <input type="text" v-model="form.formula" placeholder="关联公式模板 documentId（可选）" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">有效期</view>

        <view class="form-item">
          <text class="form-label">生效日期 *</text>
          <picker mode="date" :value="form.effectiveFrom" @change="form.effectiveFrom = $event.detail.value">
            <view class="form-picker">
              <text>{{ form.effectiveFrom || '请选择生效日期' }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">失效日期</text>
          <picker mode="date" :value="form.effectiveTo" @change="form.effectiveTo = $event.detail.value">
            <view class="form-picker">
              <text>{{ form.effectiveTo || '长期有效' }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item form-row">
          <text class="form-label">是否启用 *</text>
          <switch :checked="form.isActive" @change="form.isActive = $event.detail.value" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { quotePriceRuleApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const form = ref({
  routeId: '',
  serviceProvider: '',
  minWeight: '',
  maxWeight: '',
  pricePerKg: '',
  currency: 'CNY',
  volumetricFactor: '',
  minCharge: '',
  surcharges: '',
  formula: '',
  effectiveFrom: '',
  effectiveTo: '',
  isActive: true
})

function goBack() {
  uni.navigateBack()
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await quotePriceRuleApi.detail(documentId.value)
    if (item) {
      form.value = {
        routeId: item.routeId || '',
        serviceProvider: item.serviceProvider || '',
        minWeight: item.minWeight ?? '',
        maxWeight: item.maxWeight ?? '',
        pricePerKg: item.pricePerKg ?? '',
        currency: item.currency || 'CNY',
        volumetricFactor: item.volumetricFactor ?? '',
        minCharge: item.minCharge ?? '',
        surcharges: typeof item.surcharges === 'string' ? item.surcharges : JSON.stringify(item.surcharges || '', null, 2),
        formula: item.formula?.documentId || item.formula || '',
        effectiveFrom: item.effectiveFrom ? item.effectiveFrom.substring(0, 10) : '',
        effectiveTo: item.effectiveTo ? item.effectiveTo.substring(0, 10) : '',
        isActive: item.isActive !== false
      }
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.routeId || !form.value.serviceProvider || !form.value.minWeight || !form.value.maxWeight || !form.value.pricePerKg || !form.value.currency || !form.value.effectiveFrom) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  const payload = { ...form.value }
  try {
    if (isEdit.value) {
      await quotePriceRuleApi.update(documentId.value, payload)
    } else {
      await quotePriceRuleApi.create(payload)
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
