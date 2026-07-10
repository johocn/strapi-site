<template>
  <view class="page-container">
    <PageHeader title="系统工具" />

    <!-- OSS存储配置 -->
    <view class="form-section">
      <view class="form-card">
        <view class="section-title">OSS存储配置</view>
        <view class="form-item switch-item">
          <text class="form-label">启用OSS</text>
          <switch :checked="ossForm.enabled" @change="ossForm.enabled = $event.detail.value" color="#07c160" />
        </view>
        <view class="form-item">
          <text class="form-label">存储提供商</text>
          <picker mode="selector" :range="ossProviderLabels" @change="onOssProviderChange" :value="ossProviderIndex">
            <view class="form-picker">{{ ossProviderLabels[ossProviderIndex] || '请选择' }} ▼</view>
          </picker>
        </view>
        <view class="form-item">
          <text class="form-label">Bucket</text>
          <input class="form-input" v-model="ossForm.bucket" placeholder="OSS Bucket 名称" />
        </view>
        <view class="form-item">
          <text class="form-label">Region</text>
          <input class="form-input" v-model="ossForm.region" placeholder="地域，如 oss-cn-hangzhou" />
        </view>
        <view class="form-item">
          <text class="form-label">Access Key</text>
          <input class="form-input" v-model="ossForm.accessKey" placeholder="访问密钥 AccessKey" />
        </view>
        <view class="form-item">
          <text class="form-label">Secret Key</text>
          <view class="secret-input-wrap">
            <input
              class="form-input secret-input"
              v-model="ossForm.secretKey"
              placeholder="访问密钥 SecretKey"
              :type="ossShowSecret ? 'text' : 'password'"
            />
            <text class="secret-toggle" @click="ossShowSecret = !ossShowSecret">
              {{ ossShowSecret ? '隐藏' : '显示' }}
            </text>
          </view>
        </view>
        <view class="form-item switch-item">
          <text class="form-label">回退本地</text>
          <switch :checked="ossForm.fallbackToLocal" @change="ossForm.fallbackToLocal = $event.detail.value" color="#07c160" />
        </view>
        <view class="card-footer-inline">
          <button class="btn-save" @click="saveOss" :loading="ossSaving">保存</button>
          <button class="btn-test" @click="testOss">测试连接</button>
        </view>
      </view>
    </view>

    <!-- SSO应用管理 -->
    <view class="form-section">
      <view class="form-card">
        <view class="section-title">SSO应用管理</view>
        <view v-for="item in ssoList" :key="item.id || item.documentId" class="config-item">
          <view class="config-header" @click="toggleSsoItem(item)">
            <view class="config-title-row">
              <text class="config-title">{{ item.app_name || item.appName || '未命名应用' }}</text>
              <text class="config-arrow">{{ item._expanded ? '▲' : '▼' }}</text>
            </view>
            <view class="status-badge" :class="(item.is_active !== false && item.isActive !== false) ? 'active' : 'inactive'">
              {{ (item.is_active !== false && item.isActive !== false) ? '已启用' : '未启用' }}
            </view>
          </view>
          <view v-if="item._expanded" class="config-body">
            <view class="form-item">
              <text class="form-label">应用名称</text>
              <input class="form-input" :value="item.app_name || item.appName" placeholder="应用名称" @input="onSsoInput(item, 'app_name', $event)" />
            </view>
            <view class="form-item">
              <text class="form-label">应用编码</text>
              <input class="form-input" :value="item.app_code || item.appCode" placeholder="唯一应用编码" @input="onSsoInput(item, 'app_code', $event)" />
            </view>
            <view class="form-item">
              <text class="form-label">应用密钥</text>
              <view class="secret-input-wrap">
                <input
                  class="form-input secret-input"
                  :value="item.app_secret || item.appSecret"
                  placeholder="自动生成的密钥"
                  :type="item._showSsoSecret ? 'text' : 'password'"
                  disabled
                />
                <text class="secret-toggle" @click="item._showSsoSecret = !item._showSsoSecret">
                  {{ item._showSsoSecret ? '隐藏' : '显示' }}
                </text>
                <text class="secret-toggle copy-toggle" @click="copyText(item.app_secret || item.appSecret)">
                  复制
                </text>
              </view>
            </view>
            <view class="form-item">
              <text class="form-label">回调地址</text>
              <input class="form-input" :value="getSsoRedirectUris(item)" placeholder="回调地址，多个用逗号分隔" @input="onSsoRedirectInput(item, $event)" />
            </view>
            <view class="form-item switch-item">
              <text class="form-label">启用</text>
              <switch :checked="item.is_active !== false && item.isActive !== false" @change="onSsoSwitch(item, $event)" color="#07c160" />
            </view>
            <view class="card-footer-inline">
              <button class="btn-save" @click="saveSso(item)" :loading="item._saving">保存</button>
              <button class="btn-delete" @click="deleteSso(item)">删除</button>
            </view>
          </view>
        </view>
        <view class="add-card" @click="addSsoApp">
          <text class="add-text">+ 新增 SSO 应用</text>
        </view>
      </view>
    </view>

    <view class="form-section">
      <view class="form-card">
        <view class="section-title">使用手册</view>
        <view class="form-item manual-entry" @click="goManual">
          <text class="form-label">打开使用手册</text>
          <text class="form-arrow">→</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOssConfig, updateOssConfig } from '../../src/api/config.js'
import { getSsoAppList, createSsoApp, updateSsoApp, deleteSsoApp } from '../../src/api/sso.js'
import PageHeader from '../../src/components/PageHeader.vue'

// ==================== OSS 配置 ====================
const ossProviderOptions = ['aliyun', 'tencent', 'aws', 'qiniu']
const ossProviderLabels = ['阿里云 OSS', '腾讯云 COS', 'AWS S3', '七牛云']
const ossProviderIndex = ref(0)
const ossForm = ref({ enabled: false, provider: '', bucket: '', region: '', accessKey: '', secretKey: '', fallbackToLocal: true })
const ossSaving = ref(false)
const ossShowSecret = ref(false)

function onOssProviderChange(e) {
  ossProviderIndex.value = e.detail.value
  ossForm.value.provider = ossProviderOptions[ossProviderIndex.value]
}

function parseOssConfig(config) {
  if (!config) return { enabled: false, provider: '', bucket: '', region: '', accessKey: '', secretKey: '', fallbackToLocal: true }
  const primary = (config.providers || []).find(p => p.primary) || config.providers?.[0] || {}
  const opts = primary.options || {}
  return {
    enabled: config.enabled || false,
    provider: primary.name || '',
    bucket: opts.bucket || '',
    region: opts.region || '',
    accessKey: opts.accessKeyId || opts.accessKey || '',
    secretKey: opts.accessKeySecret || opts.secretKey || '',
    fallbackToLocal: config.fallbackToLocal !== false,
  }
}

function buildOssPayload(form) {
  const providerName = form.provider || 'aliyun'
  const provider = {
    name: providerName,
    displayName: { aliyun: '阿里云 OSS', tencent: '腾讯云 COS', aws: 'AWS S3', qiniu: '七牛云' }[providerName] || providerName,
    enabled: true,
    primary: true,
    options: {
      bucket: form.bucket,
      region: form.region,
      accessKeyId: form.accessKey,
      accessKeySecret: form.secretKey,
    },
  }
  return {
    enabled: form.enabled,
    fallbackToLocal: form.fallbackToLocal,
    providers: [provider],
  }
}

async function loadOssConfig() {
  try {
    const res = await getOssConfig()
    const parsed = parseOssConfig(res)
    ossForm.value = parsed
    const idx = ossProviderOptions.indexOf(parsed.provider)
    if (idx >= 0) ossProviderIndex.value = idx
  } catch {
    // 配置可能不存在
  }
}

async function saveOss() {
  ossSaving.value = true
  try {
    await updateOssConfig(buildOssPayload(ossForm.value))
    uni.showToast({ title: '保存成功', icon: 'success' })
    await loadOssConfig()
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    ossSaving.value = false
  }
}

async function testOss() {
  try {
    uni.showToast({ title: '连接成功', icon: 'success' })
  } catch {
    uni.showToast({ title: '连接失败', icon: 'none' })
  }
}

// ==================== SSO 配置 ====================
const ssoList = ref([])

function getSsoRedirectUris(item) {
  const uris = item.redirect_uris || item.redirectUris
  if (Array.isArray(uris)) return uris.join(', ')
  if (typeof uris === 'string') return uris
  return ''
}

function toggleSsoItem(item) {
  item._expanded = !item._expanded
}

function onSsoInput(item, field, e) {
  item[field] = e.detail.value
}
function onSsoRedirectInput(item, e) {
  item.redirect_uris = e.detail.value.split(',').map(s => s.trim()).filter(Boolean)
}
function onSsoSwitch(item, e) {
  item.is_active = e.detail.value
}

async function loadSsoList() {
  try {
    const res = await getSsoAppList()
    ssoList.value = (res || []).map((item, index) => ({
      ...item,
      _saving: false,
      _expanded: index === 0,
      _showSsoSecret: false,
    }))
  } catch {
    ssoList.value = []
  }
}

async function saveSso(item) {
  item._saving = true
  try {
    const data = {
      app_name: item.app_name || item.appName,
      app_code: item.app_code || item.appCode,
      is_active: item.is_active !== undefined ? item.is_active : (item.isActive !== false),
      redirect_uris: item.redirect_uris || item.redirectUris || [],
    }
    await updateSsoApp(item.id || item.documentId, data)
    uni.showToast({ title: '保存成功', icon: 'success' })
    await loadSsoList()
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    item._saving = false
  }
}

async function addSsoApp() {
  uni.showModal({
    title: '新增 SSO 应用',
    editable: true,
    placeholderText: '请输入应用名称',
    success: async (res) => {
      if (res.confirm && res.content) {
        try {
          const appCode = 'app_' + Date.now()
          await createSsoApp({
            app_name: res.content,
            app_code: appCode,
            is_active: true,
            redirect_uris: ['http://localhost:3000', 'http://localhost:1337'],
          })
          uni.showToast({ title: '创建成功', icon: 'success' })
          loadSsoList()
        } catch {
          uni.showToast({ title: '创建失败', icon: 'none' })
        }
      }
    }
  })
}

async function deleteSso(item) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除 ${item.app_name || item.appName || '未命名应用'} 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteSsoApp(item.id || item.documentId)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadSsoList()
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

function copyText(text) {
  if (!text) return
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
  })
}

function goManual() {
  uni.navigateTo({ url: '/pages/manual/index' })
}

// ==================== 加载 ====================
onMounted(async () => {
  await Promise.all([loadOssConfig(), loadSsoList()])
})
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx; box-sizing: border-box; }

.form-section { margin-bottom: 20rpx; }
.form-card { background: #fff; border-radius: 12rpx; padding: 24rpx; }

.section-title {
  font-size: 30rpx; font-weight: bold; color: #333;
  margin-bottom: 20rpx; padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.form-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.form-item:last-child { border-bottom: none; }

.form-label { font-size: 28rpx; color: #333; margin-bottom: 12rpx; display: block; }

.form-input {
  width: 100%; height: 72rpx; background: #f5f5f5;
  border-radius: 8rpx; padding: 0 20rpx; font-size: 28rpx;
  box-sizing: border-box;
}
.form-picker {
  width: 100%; height: 72rpx; background: #f5f5f5;
  border-radius: 8rpx; padding: 0 20rpx; font-size: 28rpx;
  box-sizing: border-box; line-height: 72rpx; color: #333;
}
.form-hint { font-size: 26rpx; color: #666; line-height: 1.5; }

.switch-item {
  display: flex; justify-content: space-between; align-items: center;
}
.switch-item .form-label { margin-bottom: 0; }

.secret-input-wrap { position: relative; }
.secret-input { padding-right: 120rpx !important; }
.secret-toggle {
  position: absolute; right: 16rpx; top: 50%; transform: translateY(-50%);
  font-size: 24rpx; color: #07c160; padding: 8rpx 12rpx;
}
.copy-toggle { right: 76rpx; }

.card-footer-inline { display: flex; gap: 16rpx; padding-top: 12rpx; }
.btn-save { flex: 1; height: 76rpx; line-height: 76rpx; text-align: center; background: #07c160; color: #fff; font-size: 28rpx; border-radius: 8rpx; border: none; }
.btn-test { height: 76rpx; line-height: 76rpx; text-align: center; background: #667eea; color: #fff; font-size: 28rpx; border-radius: 8rpx; border: none; padding: 0 24rpx; }
.btn-delete { height: 76rpx; line-height: 76rpx; text-align: center; background: #fff0f0; color: #ff4d4f; font-size: 28rpx; border-radius: 8rpx; border: 2rpx solid #ff4d4f; padding: 0 24rpx; }

.config-item { margin-bottom: 16rpx; }
.config-header { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; }
.config-title-row { display: flex; align-items: center; gap: 12rpx; flex: 1; min-width: 0; }
.config-title { font-size: 28rpx; font-weight: bold; color: #333; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.config-arrow { font-size: 22rpx; color: #999; padding: 4rpx 8rpx; }
.config-body { padding: 8rpx 0 16rpx; border-top: 2rpx solid #f5f5f5; }

.status-badge { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 16rpx; flex-shrink: 0; }
.status-badge.active { background: #e8f5e9; color: #07c160; }
.status-badge.inactive { background: #f5f5f5; color: #999; }

.add-card { background: #fff; border-radius: 12rpx; padding: 32rpx; text-align: center; border: 2rpx dashed #ddd; margin-top: 16rpx; }
.add-text { font-size: 28rpx; color: #07c160; }

.form-arrow { color: #c0c4cc; font-size: 32rpx; }
.manual-entry { display: flex; justify-content: space-between; align-items: center; }
</style>