<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑实体' : '新增实体'">
      <button class="btn-primary" @click="handleSubmit" v-if="hasPermission(isEdit ? 'knowledge-entity.update' : 'knowledge-entity.create')">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        <view class="form-item"><text class="form-label">名称 *</text><input type="text" v-model="form.name" placeholder="实体名称" class="form-input" /></view>
        <view class="form-item">
          <text class="form-label">类型</text>
          <picker mode="selector" :range="typeOptions" @change="(e) => form.type = typeOptions[e.detail.value]">
            <view class="form-input picker-display">{{ form.type || '请选择' }}</view>
          </picker>
        </view>
        <view class="form-item"><text class="form-label">别名（逗号分隔）</text><input type="text" v-model="aliasesInput" placeholder="别名1,别名2" class="form-input" /></view>
        <view class="form-item"><text class="form-label">描述</text><textarea v-model="form.description" placeholder="实体描述" class="form-textarea" /></view>
      </view>

      <view class="form-section">
        <view class="section-title">实体属性</view>
        <view class="form-item">
          <text class="form-label">sameAs (JSON 数组)</text>
          <textarea v-model="form.sameAs" placeholder='["https://..."]' class="form-textarea json-textarea" />
        </view>
        <JsonExampleBlock
          fieldLabel="sameAs"
          fieldName="sameAs"
          :exampleJson="sameAsExample"
          @fill="handleFillExample"
        />
        <view class="form-item">
          <text class="form-label">属性 (JSON 对象)</text>
          <textarea v-model="form.properties" placeholder='{"foundingDate":"..."}' class="form-textarea json-textarea" />
        </view>
        <JsonExampleBlock
          fieldLabel="属性"
          fieldName="properties"
          :exampleJson="propertiesExample"
          @fill="handleFillExample"
        />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { knowledgeGraphApi } from '../../../src/api/website.js'
import { useUserStore } from '../../../src/store/user.js'
import PageHeader from '../../../src/components/PageHeader.vue'
import JsonExampleBlock from '../../../src/components/JsonExampleBlock.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const typeOptions = ['concept', 'person', 'organization', 'product', 'location', 'event', 'other']
const documentId = ref('')
const isEdit = computed(() => !!documentId.value)
const aliasesInput = ref('')
const form = ref({ name: '', type: '', aliases: [], description: '', sameAs: '', properties: '' })

const sameAsExample = JSON.stringify([
  "https://zh.wikipedia.org/wiki/你的公司",
  "https://www.crunchbase.com/organization/your-company"
], null, 2)

const propertiesExample = JSON.stringify({
  "foundingDate": "2015-01-01",
  "foundingLocation": "北京",
  "numberOfEmployees": "50-200",
  "naics": "541511",
  "isicV4": "6201"
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

async function loadDetail() {
  if (!documentId.value) return
  try {
    const item = await knowledgeGraphApi.listEntities({ 'filters[documentId]': documentId.value }).then(res => res.list?.[0]) || null
    if (item) {
      const toString = (v) => typeof v === 'string' ? v : JSON.stringify(v || '', null, 2)
      form.value = {
        name: item.name || '', type: item.type || '', aliases: item.aliases || [], description: item.description || '',
        sameAs: toString(item.sameAs), properties: toString(item.properties),
      }
      aliasesInput.value = Array.isArray(item.aliases) ? item.aliases.join(',') : (item.aliases || '')
    }
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }) }
}

async function handleSubmit() {
  if (!form.value.name) { uni.showToast({ title: '请填写名称', icon: 'none' }); return }
  const payload = { ...form.value, aliases: aliasesInput.value ? aliasesInput.value.split(',').map(s => s.trim()).filter(Boolean) : [] }
  try {
    if (isEdit.value) await knowledgeGraphApi.updateEntity(documentId.value, payload)
    else await knowledgeGraphApi.createEntity(payload)
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (e) { uni.showToast({ title: '保存失败', icon: 'none' }) }
}

onLoad((options) => { if (options?.documentId) { documentId.value = options.documentId; loadDetail() } })
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
.picker-display { display: flex; align-items: center; line-height: 72rpx; }
.form-textarea { width: 100%; min-height: 160rpx; padding: 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
.json-textarea { min-height: 240rpx; font-family: monospace; }
</style>
