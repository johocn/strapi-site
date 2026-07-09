<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑漏斗' : '新建漏斗'">
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission('logistics.conversion-funnel.create')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">漏斗名称 *</text>
          <input type="text" v-model="form.name" placeholder="如 CN-询盘-下单漏斗" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">语言</text>
          <input type="text" v-model="form.lang" placeholder="如 zh-CN/en-US" class="form-input" />
        </view>

        <view class="form-item form-row">
          <text class="form-label">是否启用 *</text>
          <switch :checked="form.isActive" @change="(e) => form.isActive = e.detail.value" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">漏斗步骤</view>

        <view class="form-item">
          <text class="form-label">步骤定义 (JSON) *</text>
          <textarea v-model="form.steps" placeholder='[{"step":1,"name":"访问首页"},{"step":2,"name":"查看报价"}]' class="form-textarea json-textarea" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { conversionFunnelApi } from '../../../src/api/logistics.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import { useUserStore } from '../../../src/store/user.js'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const form = ref({
  name: '',
  lang: '',
  steps: '',
  isActive: true
})

function safeStringify(v) {
  if (!v) return ''
  if (typeof v === 'string') return v
  try { return JSON.stringify(v, null, 2) } catch (e) { return '' }
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await conversionFunnelApi.detail(documentId.value)
    if (item) {
      form.value.name = item.name || ''
      form.value.lang = item.lang || ''
      form.value.steps = safeStringify(item.steps)
      form.value.isActive = item.isActive !== false
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.name) return uni.showToast({ title: '请填写漏斗名称', icon: 'none' })
  if (!form.value.steps) return uni.showToast({ title: '请填写步骤定义', icon: 'none' })
  const payload = { ...form.value }
  if (payload.steps && typeof payload.steps === 'string') {
    try { payload.steps = JSON.parse(payload.steps) } catch (e) {
      return uni.showToast({ title: 'steps JSON 格式错误', icon: 'none' })
    }
  }
  try {
    if (isEdit.value) {
      await conversionFunnelApi.update(documentId.value, payload)
    } else {
      await conversionFunnelApi.create(payload)
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
.json-textarea { min-height: 240rpx; font-family: monospace; }
.form-row {
  display: flex; justify-content: space-between; align-items: center;
}
</style>
