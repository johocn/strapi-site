<template>
  <view class="page-container">
    <PageHeader title="全局配置">
      <button class="btn-primary" @click="handleSave" :disabled="saving">保存</button>
    </PageHeader>

    <view class="warning-banner">
      <text>⚠️ 全局关闭的模块，所有租户默认不可见，需在下方勾选授权的租户才能让其使用。channel-admin 无法绕过此设置。</text>
    </view>

    <view class="module-list">
      <view v-for="mod in MODULE_LIST" :key="mod.key" class="module-card">
        <view class="module-header">
          <text class="module-icon">{{ mod.icon }}</text>
          <text class="module-name">{{ mod.name }}</text>
          <switch
            :checked="form.moduleEnabled[mod.key]"
            @change="(e) => onSwitchChange(mod.key, e.detail.value)"
            color="#07c160"
          />
        </view>

        <view v-if="!form.moduleEnabled[mod.key]" class="tenant-grants">
          <text class="grant-label">已授权租户：</text>
          <view v-if="tenants.length === 0" class="empty-text">暂无租户</view>
          <view v-else class="tenant-grid">
            <view
              v-for="t in tenants"
              :key="t.documentId"
              class="tenant-item"
              :class="{ active: isGranted(mod.key, t.documentId) }"
              @click="toggleGrant(mod.key, t.documentId)"
            >
              <text>{{ t.siteName || t.domain || t.documentId }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getGlobalConfig, updateGlobalConfig } from '../../api/global-config.js'
import { clearConfigCache } from '../../utils/config-helper.js'
import { getSiteConfigList } from '../../api/site-config.js'
import PageHeader from '../../components/PageHeader.vue'

const MODULE_LIST = [
  { key: 'website', icon: '🌐', name: '官网中心' },
  { key: 'logistics', icon: '🚚', name: '物流中心' },
  { key: 'studio', icon: '📹', name: '媒体发布中心' },
  { key: 'points', icon: '💎', name: '积分中心' },
  { key: 'course', icon: '📚', name: '课程中心' },
  { key: 'quiz', icon: '📝', name: '题目中心' },
  { key: 'channel', icon: '📢', name: '渠道中心' },
  { key: 'sso', icon: '🔑', name: 'SSO 中心' },
  { key: 'thirdParty', icon: '🔌', name: '三方配置中心' },
  { key: 'oss', icon: '☁️', name: '存储中心' },
  { key: 'payment', icon: '💳', name: '支付中心' },
  { key: 'community', icon: '👥', name: '社区中心' },
  { key: 'forum', icon: '💬', name: '论坛中心' },
  { key: 'wealth', icon: '💰', name: '理财中心' },
  { key: 'exam', icon: '📝', name: '考试中心' },
  { key: 'activity', icon: '📍', name: '线下活动中心' },
]

const DEFAULT_MODULE_ENABLED = {
  website: false, logistics: false, studio: false,
  points: true, course: true, quiz: true, channel: true,
  sso: false, thirdParty: false, oss: false,
  payment: false, community: false, forum: false,
  wealth: false, exam: true, activity: true,
}

const saving = ref(false)
const tenants = ref([])
const form = ref({
  moduleEnabled: { ...DEFAULT_MODULE_ENABLED },
  moduleTenantGrants: {},
})

function isGranted(moduleKey, tenantDocId) {
  return form.value.moduleTenantGrants[moduleKey]?.includes(tenantDocId) ?? false
}

function onSwitchChange(moduleKey, value) {
  form.value.moduleEnabled[moduleKey] = value
}

function toggleGrant(moduleKey, tenantDocId) {
  if (!form.value.moduleTenantGrants[moduleKey]) {
    form.value.moduleTenantGrants[moduleKey] = []
  }
  const list = form.value.moduleTenantGrants[moduleKey]
  const idx = list.indexOf(tenantDocId)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(tenantDocId)
  }
}

async function loadConfig() {
  try {
    const res = await getGlobalConfig()
    if (res) {
      form.value.moduleEnabled = { ...DEFAULT_MODULE_ENABLED, ...(res.moduleEnabled || {}) }
      form.value.moduleTenantGrants = { ...(res.moduleTenantGrants || {}) }
    }
  } catch (e) {
    uni.showToast({ title: '加载配置失败', icon: 'none' })
  }
}

async function loadTenants() {
  try {
    const res = await getSiteConfigList({ pageSize: 200 })
    tenants.value = res?.list || []
  } catch (e) {
    // getSiteConfigList 在 site-config.js 中已存在（GET /zhao-common/v1/admin/config/sites）
    // 若失败则租户列表为空，不影响主流程
    tenants.value = []
  }
}

async function handleSave() {
  if (saving.value) return
  saving.value = true
  try {
    await updateGlobalConfig(form.value)
    clearConfigCache()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
  loadTenants()
})
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx; box-sizing: border-box; }

.warning-banner {
  background: #fff7e6;
  border: 1rpx solid #ffd591;
  border-radius: 8rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}
.warning-banner text { font-size: 26rpx; color: #ad6800; }

.module-list { display: flex; flex-direction: column; gap: 20rpx; }
.module-card { background: #fff; border-radius: 12rpx; padding: 24rpx; }
.module-header { display: flex; align-items: center; gap: 12rpx; }
.module-icon { font-size: 36rpx; }
.module-name { font-size: 30rpx; font-weight: bold; color: #333; flex: 1; }

.tenant-grants { margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid #f5f5f5; }
.grant-label { font-size: 26rpx; color: #999; display: block; margin-bottom: 12rpx; }
.empty-text { font-size: 26rpx; color: #ccc; }
.tenant-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.tenant-item {
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 6rpx;
  font-size: 26rpx;
  color: #666;
}
.tenant-item.active { background: #07c160; color: #fff; }

.btn-primary {
  background: #ff0000; color: #fff; padding: 16rpx 32rpx;
  font-size: 30rpx; border-radius: 8rpx; border: none; line-height: 1.2;
}
</style>
