<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑落地页' : '新建落地页'">
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission('logistics.landing-page.create')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <view class="form-item">
          <text class="form-label">标题 *</text>
          <input type="text" v-model="form.title" placeholder="落地页标题" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">slug *</text>
          <input type="text" v-model="form.slug" placeholder="URL 别名" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">活动名称 *</text>
          <input type="text" v-model="form.campaignName" placeholder="如 2026 春节促销" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">转化目标 *</text>
          <picker mode="selector" :range="goalOptions" @change="(e) => form.conversionGoal = goalValues[e.detail.value]">
            <view class="form-input picker-value">{{ goalText(form.conversionGoal) }}</view>
          </picker>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">UTM 参数</view>

        <view class="form-item">
          <text class="form-label">utm_source *</text>
          <input type="text" v-model="form.utmSource" placeholder="如 google / facebook" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">utm_medium *</text>
          <input type="text" v-model="form.utmMedium" placeholder="如 cpc / email" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">utm_campaign *</text>
          <input type="text" v-model="form.utmCampaign" placeholder="活动标识" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">utm_content</text>
          <input type="text" v-model="form.utmContent" placeholder="内容标识" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">utm_term</text>
          <input type="text" v-model="form.utmTerm" placeholder="关键词" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">页面内容</view>

        <view class="form-item">
          <text class="form-label">Hero 内容 (JSON) *</text>
          <textarea v-model="form.heroContent" placeholder='{"title":"主标题","subtitle":"副标题","cta":"立即咨询"}' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">页面区块 (JSON) *</text>
          <textarea v-model="form.sections" placeholder='[{"type":"features","data":{}}]' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">表单配置 (JSON)</text>
          <textarea v-model="form.formConfig" placeholder='{"fields":[],"submitUrl":""}' class="form-textarea json-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">变体标识</text>
          <input type="text" v-model="form.variant" placeholder="A/B 测试变体（如 A/B）" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">父页面 ID</text>
          <input type="text" v-model="form.parentPageId" placeholder="父落地页 ID" class="form-input" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">SEO 与状态</view>

        <view class="form-item">
          <text class="form-label">SEO 标题</text>
          <input type="text" v-model="form.seoTitle" placeholder="SEO 标题" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">SEO 描述</text>
          <textarea v-model="form.seoDescription" placeholder="SEO 描述" class="form-textarea" />
        </view>

        <view class="form-item">
          <text class="form-label">状态 *</text>
          <picker mode="selector" :range="statusOptions" @change="(e) => form.status = statusValues[e.detail.value]">
            <view class="form-input picker-value">{{ statusText(form.status) }}</view>
          </picker>
        </view>

        <view class="form-item form-row">
          <text class="form-label">是否上线 *</text>
          <switch :checked="form.isActive" @change="(e) => form.isActive = e.detail.value" />
        </view>

        <view class="form-item">
          <text class="form-label">开始时间</text>
          <input type="text" v-model="form.startAt" placeholder="YYYY-MM-DD HH:mm:ss" class="form-input" />
        </view>

        <view class="form-item">
          <text class="form-label">结束时间</text>
          <input type="text" v-model="form.endAt" placeholder="YYYY-MM-DD HH:mm:ss" class="form-input" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { landingPageApi } from '../../../src/api/logistics.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import { useUserStore } from '../../../src/store/user.js'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const documentId = ref('')
const isEdit = computed(() => !!documentId.value)

const goalOptions = ['报价提交', '联系点击', '电话拨打', '下载']
const goalValues = ['quote_submit', 'contact_click', 'phone_call', 'download']
const goalText = (v) => {
  const i = goalValues.indexOf(v)
  return i >= 0 ? goalOptions[i] : '请选择'
}

const statusOptions = ['草稿', '已发布', '已下架']
const statusValues = ['draft', 'published', 'archived']
const statusText = (v) => {
  const i = statusValues.indexOf(v)
  return i >= 0 ? statusOptions[i] : '请选择'
}

const form = ref({
  slug: '',
  title: '',
  campaignName: '',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmContent: '',
  utmTerm: '',
  conversionGoal: 'quote_submit',
  heroContent: '',
  sections: '',
  formConfig: '',
  seoTitle: '',
  seoDescription: '',
  variant: '',
  parentPageId: '',
  isActive: true,
  startAt: '',
  endAt: '',
  status: 'draft'
})

function safeStringify(v) {
  if (!v) return ''
  if (typeof v === 'string') return v
  try { return JSON.stringify(v, null, 2) } catch (e) { return '' }
}

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await landingPageApi.detail(documentId.value)
    if (item) {
      Object.keys(form.value).forEach(key => {
        if (item[key] !== undefined && item[key] !== null) {
          const val = item[key]
          if (['heroContent', 'sections', 'formConfig'].includes(key)) {
            form.value[key] = safeStringify(val)
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

async function handleSubmit() {
  if (!form.value.title) return uni.showToast({ title: '请填写标题', icon: 'none' })
  if (!form.value.slug) return uni.showToast({ title: '请填写 slug', icon: 'none' })
  const payload = { ...form.value }
  for (const key of ['heroContent', 'sections', 'formConfig']) {
    if (payload[key] && typeof payload[key] === 'string') {
      try { payload[key] = JSON.parse(payload[key]) } catch (e) {
        return uni.showToast({ title: `${key} JSON 格式错误`, icon: 'none' })
      }
    }
  }
  try {
    if (isEdit.value) {
      await landingPageApi.update(documentId.value, payload)
    } else {
      await landingPageApi.create(payload)
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
.json-textarea { min-height: 220rpx; font-family: monospace; }
.picker-value { display: flex; align-items: center; color: #333; }
.form-row {
  display: flex; justify-content: space-between; align-items: center;
}
</style>
