<template>
  <view class="page-container">
    <PageHeader title="品牌信息">
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission('brand-info.update')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基础品牌</view>
        <view class="form-item"><text class="form-label">品牌名称 *</text><input type="text" v-model="form.brandName" placeholder="品牌名称" class="form-input" /></view>
        <view class="form-item"><text class="form-label">Slogan</text><input type="text" v-model="form.slogan" placeholder="品牌标语" class="form-input" /></view>
        <view class="form-item"><text class="form-label">Logo URL</text><input type="text" v-model="form.logo" placeholder="https://..." class="form-input" /></view>
      </view>

      <view class="form-section">
        <view class="section-title">联系方式</view>
        <view class="form-item"><text class="form-label">联系邮箱</text><input type="text" v-model="form.contactEmail" placeholder="contact@example.com" class="form-input" /></view>
        <view class="form-item"><text class="form-label">联系电话</text><input type="text" v-model="form.contactPhone" placeholder="400-xxx-xxxx" class="form-input" /></view>
        <view class="form-item"><text class="form-label">联系地址</text><textarea v-model="form.contactAddress" placeholder="公司地址" class="form-textarea" /></view>
      </view>

      <view class="form-section">
        <view class="section-title">资质备案</view>
        <view class="form-item"><text class="form-label">ICP 备案号</text><input type="text" v-model="form.icpRecord" placeholder="京ICP备xxxxxx号" class="form-input" /></view>
        <view class="form-item"><text class="form-label">营业执照编号</text><input type="text" v-model="form.businessLicense" placeholder="统一社会信用代码" class="form-input" /></view>
      </view>

      <view class="form-section">
        <view class="section-title">社交链接</view>
        <view class="form-item"><text class="form-label">社交链接 (JSON)</text><textarea v-model="form.socialLinks" placeholder='{"wechat":"xxx","weibo":"xxx"}' class="form-textarea json-textarea" /></view>
        <JsonExampleBlock
          fieldLabel="社交链接"
          fieldName="socialLinks"
          :exampleJson="socialLinksExample"
          @fill="handleFillExample"
        />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { brandInfoApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import JsonExampleBlock from '../../../src/components/JsonExampleBlock.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const form = ref({
  documentId: '', brandName: '', slogan: '', logo: '',
  contactEmail: '', contactPhone: '', contactAddress: '',
  icpRecord: '', businessLicense: '', socialLinks: '',
})

const socialLinksExample = JSON.stringify({
  "wechat": { "qrcode": "https://example.com/wechat-qr.png", "accountId": "gh_xxxx" },
  "weibo": { "url": "https://weibo.com/your-company", "label": "官方微博" },
  "douyin": { "url": "https://douyin.com/user/your-company", "label": "抖音" },
  "linkedin": { "url": "https://linkedin.com/company/your-company", "label": "LinkedIn" },
  "github": { "url": "https://github.com/your-company", "label": "GitHub" }
}, null, 2)

function handleFillExample({ fieldName, exampleJson }) {
  if (form.value[fieldName] && form.value[fieldName].trim()) {
    uni.showModal({
      title: '确认覆盖',
      content: `字段「${fieldName}」已有内容，确定用示例覆盖吗？`,
      success: (res) => {
        if (res.confirm) {
          form.value[fieldName] = exampleJson
          uni.showToast({ title: '已填入示例', icon: 'success' })
        }
      }
    })
  } else {
    form.value[fieldName] = exampleJson
    uni.showToast({ title: '已填入示例', icon: 'success' })
  }
}

async function loadData() {
  try {
    const item = await brandInfoApi.get()
    if (item) {
      form.value = {
        documentId: item.documentId || '',
        brandName: item.brandName || '', slogan: item.slogan || '', logo: item.logo || '',
        contactEmail: item.contactEmail || '', contactPhone: item.contactPhone || '',
        contactAddress: item.contactAddress || '',
        icpRecord: item.icpRecord || '', businessLicense: item.businessLicense || '',
        socialLinks: typeof item.socialLinks === 'string' ? item.socialLinks : JSON.stringify(item.socialLinks || '', null, 2),
      }
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleSubmit() {
  if (!form.value.brandName) { uni.showToast({ title: '请填写品牌名称', icon: 'none' }); return }
  try {
    await brandInfoApi.save(form.value)
    uni.showToast({ title: '保存成功', icon: 'success' })
    loadData()
  } catch (e) { uni.showToast({ title: '保存失败', icon: 'none' }) }
}

onShow(() => loadData())
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; display: flex; flex-direction: column; }
.form-scroll { flex: 1; padding: 20rpx; box-sizing: border-box; }
.btn-primary { background: #ff0000; color: #ffffff; padding: 16rpx 32rpx; font-size: 30rpx; border-radius: 8rpx; border: none; line-height: 1.2; }
.form-section { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 24rpx; padding-left: 8rpx; border-left: 6rpx solid #ff0000; }
.form-item { margin-bottom: 24rpx; }
.form-label { display: block; font-size: 26rpx; color: #666; margin-bottom: 12rpx; }
.form-input { width: 100%; height: 72rpx; padding: 0 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
.form-textarea { width: 100%; min-height: 120rpx; padding: 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
.json-textarea { min-height: 240rpx; font-family: monospace; }
</style>
