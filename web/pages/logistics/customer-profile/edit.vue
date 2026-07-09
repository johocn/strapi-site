<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑客户档案' : '新增客户档案'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission('logistics.customer-profile.create')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">姓名 *</text>
          <input type="text" v-model="form.name" placeholder="客户姓名" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">电话 *</text>
          <input type="text" v-model="form.contactPhone" placeholder="联系电话" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">邮箱</text>
          <input type="text" v-model="form.contactEmail" placeholder="邮箱地址" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">公司</text>
          <input type="text" v-model="form.company" placeholder="公司名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">职位</text>
          <input type="text" v-model="form.title" placeholder="职位" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">客户类型 *</text>
          <picker mode="selector" :range="customerTypeOptions" @change="(e) => form.customerType = customerTypeValues[e.detail.value]">
            <view class="form-input picker-value">{{ customerTypeText(form.customerType) }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">国家 *</text>
          <input type="text" v-model="form.country" placeholder="如 CN/US/JP" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">偏好语言</text>
          <input type="text" v-model="form.preferredLang" placeholder="如 zh-CN / en-US" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">生命周期阶段 *</text>
          <picker mode="selector" :range="stageOptions" @change="(e) => form.lifecycleStage = stageValues[e.detail.value]">
            <view class="form-input picker-value">{{ stageText(form.lifecycleStage) }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">负责跟进人 ID</text>
          <input type="text" v-model="form.assignedTo" placeholder="管理员 documentId" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">IM 联系方式</view>

        <view class="form-item">
          <text class="form-label">Line</text>
          <input type="text" v-model="form.contactLine" placeholder="Line 账号" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">微信</text>
          <input type="text" v-model="form.contactWechat" placeholder="微信号" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">Kakao</text>
          <input type="text" v-model="form.contactKakao" placeholder="Kakao 账号" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">Zalo</text>
          <input type="text" v-model="form.contactZalo" placeholder="Zalo 账号" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">偏好与统计</view>

        <view class="form-item">
          <text class="form-label">偏好路线 (JSON)</text>
          <textarea v-model="form.preferredRoute" placeholder='["cn-us-sea"]' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">偏好服务 (JSON)</text>
          <textarea v-model="form.preferredService" placeholder='["fba","ddp"]' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">标签 (JSON)</text>
          <textarea v-model="form.tags" placeholder='["vip","fba"]' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">报价总数</text>
          <input type="number" v-model="form.totalQuoteCount" placeholder="报价总数" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">订单总数</text>
          <input type="number" v-model="form.totalOrderCount" placeholder="订单总数" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">订单总额</text>
          <input type="number" v-model="form.totalOrderValue" placeholder="订单总额" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">最后报价时间</text>
          <picker mode="date" :value="form.lastQuoteAt" @change="(e) => form.lastQuoteAt = e.detail.value">
            <view class="form-input picker-value">{{ form.lastQuoteAt || '请选择日期' }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">最后下单时间</text>
          <picker mode="date" :value="form.lastOrderAt" @change="(e) => form.lastOrderAt = e.detail.value">
            <view class="form-input picker-value">{{ form.lastOrderAt || '请选择日期' }}</view>
          </picker>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">来源与关联</view>

        <view class="form-item">
          <text class="form-label">来源渠道</text>
          <input type="text" v-model="form.sourceChannel" placeholder="来源渠道" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">UTM Source</text>
          <input type="text" v-model="form.utmSource" placeholder="utm_source" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">关联线索 IDs (JSON)</text>
          <textarea v-model="form.relatedLeadIds" placeholder='["lead-id-1"]' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">关联报价 IDs (JSON)</text>
          <textarea v-model="form.relatedQuoteIds" placeholder='["quote-id-1"]' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">关联订单 IDs (JSON)</text>
          <textarea v-model="form.relatedOrderIds" placeholder='["order-id-1"]' class="form-textarea json-textarea" />
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
import { customerProfileApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const customerTypeOptions = ['个人', '企业', 'FBA 卖家']
const customerTypeValues = ['individual', 'business', 'fba_seller']
function customerTypeText(v) {
  const i = customerTypeValues.indexOf(v)
  return i >= 0 ? customerTypeOptions[i] : '请选择'
}

const stageOptions = ['线索', '活跃', '复购', 'VIP', '流失']
const stageValues = ['lead', 'active', 'repeat', 'vip', 'churned']
function stageText(v) {
  const i = stageValues.indexOf(v)
  return i >= 0 ? stageOptions[i] : '请选择'
}

const jsonFields = ['preferredRoute', 'preferredService', 'tags', 'relatedLeadIds', 'relatedQuoteIds', 'relatedOrderIds']

const form = ref({
  name: '',
  contactPhone: '',
  contactEmail: '',
  contactLine: '',
  contactWechat: '',
  contactKakao: '',
  contactZalo: '',
  company: '',
  title: '',
  customerType: 'individual',
  country: '',
  preferredLang: '',
  preferredRoute: '',
  preferredService: '',
  totalQuoteCount: 0,
  totalOrderCount: 0,
  totalOrderValue: 0,
  lastQuoteAt: '',
  lastOrderAt: '',
  lifecycleStage: 'lead',
  tags: '',
  assignedTo: '',
  sourceChannel: '',
  utmSource: '',
  remark: '',
  relatedLeadIds: '',
  relatedQuoteIds: '',
  relatedOrderIds: ''
})

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await customerProfileApi.detail(documentId.value)
    if (item) {
      Object.keys(form.value).forEach(key => {
        if (item[key] !== undefined && item[key] !== null) {
          const val = item[key]
          if (jsonFields.includes(key)) {
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
  if (!form.value.name) return uni.showToast({ title: '请填写姓名', icon: 'none' })
  if (!form.value.contactPhone) return uni.showToast({ title: '请填写电话', icon: 'none' })
  if (!form.value.country) return uni.showToast({ title: '请填写国家', icon: 'none' })
  try {
    if (isEdit.value) {
      await customerProfileApi.update(documentId.value, form.value)
    } else {
      await customerProfileApi.create(form.value)
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
  min-height: 120rpx; font-family: monospace;
}
.picker-value {
  display: flex; align-items: center;
  color: #333;
}
</style>
