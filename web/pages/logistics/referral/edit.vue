<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑推荐' : '新增推荐'">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission('logistics.referral.create')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">推荐信息</view>

        <view class="form-item">
          <text class="form-label">推荐码 *</text>
          <input type="text" v-model="form.referralCode" placeholder="推荐码" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">推荐渠道 *</text>
          <picker mode="selector" :range="channelOptions" @change="(e) => form.referralChannel = channelValues[e.detail.value]">
            <view class="form-input picker-value">{{ channelText(form.referralChannel) }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">推荐来源</text>
          <input type="text" v-model="form.referralSource" placeholder="推荐来源" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">状态 *</text>
          <picker mode="selector" :range="statusOptions" @change="(e) => form.status = statusValues[e.detail.value]">
            <view class="form-input picker-value">{{ statusText(form.status) }}</view>
          </picker>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">推荐人</view>

        <view class="form-item">
          <text class="form-label">推荐人姓名 *</text>
          <input type="text" v-model="form.referrerName" placeholder="推荐人姓名" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">推荐人联系方式 *</text>
          <input type="text" v-model="form.referrerContact" placeholder="电话/邮箱/IM" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">推荐人客户 ID</text>
          <input type="text" v-model="form.referrerCustomerId" placeholder="关联客户档案" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">被推荐人</view>

        <view class="form-item">
          <text class="form-label">被推荐人姓名 *</text>
          <input type="text" v-model="form.refereeName" placeholder="被推荐人姓名" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">被推荐人联系方式 *</text>
          <input type="text" v-model="form.refereeContact" placeholder="电话/邮箱/IM" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">被推荐人客户 ID</text>
          <input type="text" v-model="form.refereeCustomerId" placeholder="关联客户档案" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">关联报价请求 ID</text>
          <input type="text" v-model="form.quoteRequestId" placeholder="关联报价请求" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">关联意向订单 ID</text>
          <input type="text" v-model="form.intentOrderId" placeholder="关联意向订单" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">奖励</view>

        <view class="form-item">
          <text class="form-label">奖励类型 *</text>
          <picker mode="selector" :range="rewardTypeOptions" @change="(e) => form.rewardType = rewardTypeValues[e.detail.value]">
            <view class="form-input picker-value">{{ rewardTypeText(form.rewardType) }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">奖励金额</text>
          <input type="number" v-model="form.rewardAmount" placeholder="奖励金额" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">奖励状态</text>
          <picker mode="selector" :range="rewardStatusOptions" @change="(e) => form.rewardStatus = rewardStatusValues[e.detail.value]">
            <view class="form-input picker-value">{{ rewardStatusText(form.rewardStatus) }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">奖励发放时间</text>
          <picker mode="date" :value="form.rewardIssuedAt" @change="(e) => form.rewardIssuedAt = e.detail.value">
            <view class="form-input picker-value">{{ form.rewardIssuedAt || '请选择日期' }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">转化价值</text>
          <input type="number" v-model="form.conversionValue" placeholder="转化价值" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">转化时间</text>
          <picker mode="date" :value="form.convertedAt" @change="(e) => form.convertedAt = e.detail.value">
            <view class="form-input picker-value">{{ form.convertedAt || '请选择日期' }}</view>
          </picker>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">备注</view>

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
import { referralApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const channelOptions = ['朋友', '社群', '展会', '合作伙伴', '其他']
const channelValues = ['friend', 'community', 'exhibition', 'partner', 'other']
function channelText(v) {
  const i = channelValues.indexOf(v)
  return i >= 0 ? channelOptions[i] : '请选择'
}

const statusOptions = ['待处理', '已联系', '已合格', '已转化', '已奖励', '无效']
const statusValues = ['pending', 'contacted', 'qualified', 'converted', 'rewarded', 'invalid']
function statusText(v) {
  const i = statusValues.indexOf(v)
  return i >= 0 ? statusOptions[i] : '请选择'
}

const rewardTypeOptions = ['积分', '现金', '折扣', '礼品']
const rewardTypeValues = ['points', 'cash', 'discount', 'gift']
function rewardTypeText(v) {
  const i = rewardTypeValues.indexOf(v)
  return i >= 0 ? rewardTypeOptions[i] : '请选择'
}

const rewardStatusOptions = ['待发放', '已发放', '已领取']
const rewardStatusValues = ['pending', 'issued', 'claimed']
function rewardStatusText(v) {
  const i = rewardStatusValues.indexOf(v)
  return i >= 0 ? rewardStatusOptions[i] : '请选择'
}

const form = ref({
  referralCode: '',
  referrerName: '',
  referrerContact: '',
  referrerCustomerId: '',
  refereeName: '',
  refereeContact: '',
  refereeCustomerId: '',
  referralChannel: 'friend',
  referralSource: '',
  status: 'pending',
  quoteRequestId: '',
  intentOrderId: '',
  rewardType: 'points',
  rewardAmount: 0,
  rewardStatus: 'pending',
  rewardIssuedAt: '',
  conversionValue: 0,
  convertedAt: '',
  remark: ''
})

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await referralApi.detail(documentId.value)
    if (item) {
      Object.keys(form.value).forEach(key => {
        if (item[key] !== undefined && item[key] !== null) {
          form.value[key] = item[key]
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
  if (!form.value.referralCode) return uni.showToast({ title: '请填写推荐码', icon: 'none' })
  if (!form.value.referrerName) return uni.showToast({ title: '请填写推荐人姓名', icon: 'none' })
  if (!form.value.refereeName) return uni.showToast({ title: '请填写被推荐人姓名', icon: 'none' })
  try {
    if (isEdit.value) {
      await referralApi.update(documentId.value, form.value)
    } else {
      await referralApi.create(form.value)
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
.picker-value {
  display: flex; align-items: center;
  color: #333;
}
</style>
