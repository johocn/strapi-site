<template>
  <view class="page-container">
    <PageHeader title="新增邀请码">
      <button class="btn-secondary" @click="goBack">取消</button>
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">邀请码 *</text>
          <input type="text" v-model="form.code" placeholder="请输入邀请码（留空则自动生成）" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">邀请类型 *</text>
          <picker mode="selector" :range="inviteTypeLabels" :value="inviteTypeIndex" @change="handleTypeChange">
            <view class="form-picker">
              <text>{{ inviteTypeLabels[inviteTypeIndex] }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">创建者 documentId</text>
          <input type="text" v-model="form.creator" placeholder="请输入创建者 documentId" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">使用限制</view>

        <view class="form-item">
          <text class="form-label">最大使用次数</text>
          <input type="number" v-model="form.max_uses" placeholder="留空表示不限" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">单用户限制</text>
          <input type="number" v-model="form.per_user_limit" placeholder="默认 1" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">生效时间</text>
          <input type="text" v-model="form.valid_from" placeholder="YYYY-MM-DDTHH:mm:ss" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">失效时间</text>
          <input type="text" v-model="form.valid_until" placeholder="YYYY-MM-DDTHH:mm:ss" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">其他配置</view>

        <view class="form-item">
          <text class="form-label">奖励标签 (JSON)</text>
          <textarea v-model="form.bonus_tags" placeholder='["newuser","bonus"]' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">启用状态</text>
          <view class="form-switch-row">
            <switch :checked="form.is_active" @change="form.is_active = $event.detail.value" />
            <text class="switch-label">{{ form.is_active ? '启用' : '禁用' }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ssoInviteCodeApi } from '../../../src/api/sso.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const inviteTypeEnumList = ['system', 'user_campaign']
const inviteTypeLabels = ['系统', '用户活动']
const inviteTypeIndex = ref(0)

const form = ref({
  code: '',
  creator: '',
  invite_type: 'system',
  max_uses: '',
  per_user_limit: 1,
  valid_from: '',
  valid_until: '',
  bonus_tags: '',
  is_active: true
})

function handleTypeChange(e) {
  inviteTypeIndex.value = e.detail.value
  form.value.invite_type = inviteTypeEnumList[e.detail.value]
}

function goBack() {
  uni.navigateBack()
}

async function handleSubmit() {
  if (!form.value.code) {
    uni.showToast({ title: '请填写邀请码', icon: 'none' })
    return
  }
  const payload = {
    code: form.value.code,
    invite_type: form.value.invite_type,
    per_user_limit: form.value.per_user_limit ? Number(form.value.per_user_limit) : 1,
    is_active: form.value.is_active
  }
  if (form.value.creator) payload.creator = form.value.creator
  if (form.value.max_uses) payload.max_uses = Number(form.value.max_uses)
  if (form.value.valid_from) payload.valid_from = form.value.valid_from
  if (form.value.valid_until) payload.valid_until = form.value.valid_until
  if (form.value.bonus_tags) payload.bonus_tags = form.value.bonus_tags

  try {
    await ssoInviteCodeApi.create(payload)
    uni.showToast({ title: '创建成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (e) {
    uni.showToast({ title: '创建失败', icon: 'none' })
  }
}

onLoad(() => {})
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

.form-switch-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.switch-label {
  font-size: 28rpx;
  color: #666;
}
</style>
