<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑评价' : '新增评价'">
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission('logistics.review.create')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">评价者信息</view>

        <view class="form-item">
          <text class="form-label">评价者姓名 *</text>
          <input type="text" v-model="form.authorName" placeholder="请输入姓名" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">公司</text>
          <input type="text" v-model="form.authorCompany" placeholder="公司名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">职位</text>
          <input type="text" v-model="form.authorTitle" placeholder="职位" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">国家 *</text>
          <input type="text" v-model="form.authorCountry" placeholder="如 CN/US/JP" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">评价内容</view>

        <view class="form-item">
          <text class="form-label">评分 *</text>
          <input type="number" v-model="form.rating" placeholder="1-5" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">评价正文 *</text>
          <textarea v-model="form.content" placeholder="请输入评价内容" class="form-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">评价类型 *</text>
          <picker mode="selector" :range="testimonialTypeOptions" @change="(e) => form.testimonialType = testimonialTypeValues[e.detail.value]">
            <view class="form-input picker-value">{{ testimonialTypeText(form.testimonialType) }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">视频 URL</text>
          <input type="text" v-model="form.videoUrl" placeholder="视频地址" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">路线 ID</text>
          <input type="text" v-model="form.routeId" placeholder="如 cn-us-sea" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">服务商</text>
          <input type="text" v-model="form.serviceProvider" placeholder="服务商名称" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">订单号</text>
          <input type="text" v-model="form.orderRef" placeholder="关联订单号" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">状态与回复</view>

        <view class="form-item">
          <text class="form-label">状态 *</text>
          <picker mode="selector" :range="statusOptions" @change="(e) => form.status = statusValues[e.detail.value]">
            <view class="form-input picker-value">{{ statusText(form.status) }}</view>
          </picker>
        </view>

        <view class="form-item form-row">
          <text class="form-label">已验证</text>
          <switch :checked="form.isVerified" @change="(e) => form.isVerified = e.detail.value" />
        </view>

        <view class="form-item form-row">
          <text class="form-label">精选展示</text>
          <switch :checked="form.isFeatured" @change="(e) => form.isFeatured = e.detail.value" />
        </view>

        <view class="form-item">
          <text class="form-label">回复内容</text>
          <textarea v-model="form.replyContent" placeholder="官方回复内容" class="form-textarea" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { reviewApi } from '../../../src/api/logistics.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import { useUserStore } from '../../../src/store/user.js'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const testimonialTypeOptions = ['文本', '视频', '案例']
const testimonialTypeValues = ['text', 'video', 'case_study']
const testimonialTypeText = (v) => {
  const i = testimonialTypeValues.indexOf(v)
  return i >= 0 ? testimonialTypeOptions[i] : '请选择'
}

const statusOptions = ['待审核', '已通过', '已拒绝']
const statusValues = ['pending', 'approved', 'rejected']
const statusText = (v) => {
  const i = statusValues.indexOf(v)
  return i >= 0 ? statusOptions[i] : '请选择'
}

const form = ref({
  authorName: '',
  authorCompany: '',
  authorTitle: '',
  authorCountry: '',
  routeId: '',
  serviceProvider: '',
  rating: 5,
  content: '',
  videoUrl: '',
  testimonialType: 'text',
  isVerified: false,
  isFeatured: false,
  status: 'pending',
  replyContent: '',
  orderRef: ''
})

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await reviewApi.detail(documentId.value)
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

async function handleSubmit() {
  if (!form.value.authorName) return uni.showToast({ title: '请填写姓名', icon: 'none' })
  if (!form.value.authorCountry) return uni.showToast({ title: '请填写国家', icon: 'none' })
  if (!form.value.content) return uni.showToast({ title: '请填写正文', icon: 'none' })
  try {
    if (isEdit.value) {
      await reviewApi.update(documentId.value, form.value)
    } else {
      await reviewApi.create(form.value)
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
.form-row {
  display: flex; justify-content: space-between; align-items: center;
}
</style>
