<template>
  <view class="page-container">
    <view class="page-header">
      <view class="header-left" @click="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>
      <text class="page-title">{{ isEdit ? '编辑租户' : '新建租户' }}</text>
      <view class="header-right">
        <button class="btn-save" :disabled="saving || loading" @click="saveTenant(false)">{{ isEdit ? '保存' : '保存并继续' }}</button>
        <button v-if="isEdit" class="btn-save-return" :disabled="saving || loading" @click="saveTenant(true)">保存并返回</button>
      </view>
    </view>

    <scroll-view class="page-content" scroll-y>
      <view class="form-section">
        <text class="section-title">基本信息</text>
        <view class="form-item">
          <text class="form-label">租户名称 *</text>
          <input class="form-input" placeholder="请输入租户名称" v-model="formData.siteName" />
        </view>
        <view class="form-item">
          <text class="form-label">域名 *</text>
          <input class="form-input" placeholder="请输入域名（如：example.com）" v-model="formData.domain" />
        </view>
        <view class="form-item">
          <text class="form-label">租户描述</text>
          <textarea class="form-textarea" placeholder="请输入租户描述" v-model="formData.siteDescription" />
        </view>
        <view class="form-item">
          <text class="form-label">ICP备案号</text>
          <input class="form-input" placeholder="请输入ICP备案号" v-model="formData.icpNumber" />
        </view>
        <view class="form-item">
          <text class="form-label">客服链接</text>
          <input class="form-input" placeholder="如：https://work.weixin.qq.com/..." v-model="formData.customerServiceUrl" />
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">站点标识</text>
        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">站点 Logo</text>
            <view class="media-select" @click="openMediaPicker('logo')">
              <image v-if="formData.logoUrl" :src="formData.logoUrl" mode="aspectFill" class="media-preview" />
              <view v-else class="media-placeholder"><text>+ 选择 Logo</text></view>
              <text v-if="formData.logoUrl" class="media-remove" @click.stop="removeMedia('logo')">✕</text>
            </view>
          </view>
          <view class="form-item half">
            <text class="form-label">Favicon</text>
            <view class="media-select" @click="openMediaPicker('favicon')">
              <image v-if="formData.faviconUrl" :src="formData.faviconUrl" mode="aspectFill" class="media-preview" />
              <view v-else class="media-placeholder"><text>+ 选择图标</text></view>
              <text v-if="formData.faviconUrl" class="media-remove" @click.stop="removeMedia('favicon')">✕</text>
            </view>
          </view>
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">SEO 设置</text>
        <view class="form-item">
          <text class="form-label">SEO 关键词</text>
          <input class="form-input" placeholder="多个关键词用逗号分隔" v-model="formData.seoKeywords" />
        </view>
        <view class="form-item">
          <text class="form-label">SEO 描述</text>
          <textarea class="form-textarea" placeholder="搜索引擎展示的描述文字" v-model="formData.seoDescription" />
        </view>
        <view class="form-item">
          <text class="form-label">腾讯地图 Key</text>
          <input class="form-input" placeholder="腾讯位置服务 Key" v-model="formData.tencentMapKey" />
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">分享设置</text>
        <view class="form-item">
          <text class="form-label">分享标题</text>
          <input class="form-input" placeholder="转发朋友圈时的标题" v-model="formData.shareTitle" />
        </view>
        <view class="form-item">
          <text class="form-label">分享描述</text>
          <input class="form-input" placeholder="转发朋友圈时的描述" v-model="formData.shareDescription" />
        </view>
        <view class="form-item">
          <text class="form-label">分享封面图</text>
          <view class="media-select" @click="openMediaPicker('shareImage')">
            <image v-if="formData.shareImageUrl" :src="formData.shareImageUrl" mode="aspectFill" class="media-preview" />
            <view v-else class="media-placeholder"><text>+ 选择封面</text></view>
            <text v-if="formData.shareImageUrl" class="media-remove" @click.stop="removeMedia('shareImage')">✕</text>
          </view>
        </view>
        <view class="form-item">
          <text class="form-label">分享路径</text>
          <input class="form-input" placeholder="如：/pages/index/index" v-model="formData.sharePath" />
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">功能开关</text>
        <view class="feature-grid">
          <view
            v-for="(label, key) in featureLabels"
            :key="key"
            class="feature-item"
            @click="toggleFeature(key)"
          >
            <view :class="['feature-icon', formData.featureFlags?.[key] ? 'enabled' : 'disabled']">
              {{ formData.featureFlags?.[key] ? '✓' : '' }}
            </view>
            <text class="feature-label">{{ label }}</text>
          </view>
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">认证配置</text>

        <view class="form-item">
          <text class="form-label">认证模式 *</text>
          <view class="picker-value" @click="showAuthModePicker = true">
            <text>{{ currentAuthModeLabel || '请选择认证模式' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </view>

        <!-- 三方登录细分开关：authMode === 'third' 时显示 -->
        <view v-if="formData.authConfig.authMode === 'third'" class="sub-section">
          <text class="sub-section-title">三方登录平台</text>
          <view class="feature-grid">
            <view
              v-for="(label, key) in thirdPartyLabels"
              :key="key"
              class="feature-item"
              @click="toggleThirdParty(key)"
            >
              <view :class="['feature-icon', formData.authConfig[key] ? 'enabled' : 'disabled']">
                {{ formData.authConfig[key] ? '✓' : '' }}
              </view>
              <text class="feature-label">{{ label }}</text>
            </view>
          </view>
        </view>

        <!-- SSO 配置：authMode === 'sso' 时显示 -->
        <view v-if="formData.authConfig.authMode === 'sso'" class="sub-section">
          <view class="form-item">
            <text class="form-label">SSO 登录</text>
            <switch :checked="formData.featureFlags.sso" @change="formData.featureFlags.sso = !formData.featureFlags.sso" />
          </view>
          <view v-if="formData.featureFlags.sso" class="form-item">
            <text class="form-label">SSO 登录地址 *</text>
            <input class="form-input" placeholder="https://sso.example.com/login" v-model="formData.authConfig.ssoLoginUrl" />
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">允许注册</text>
          <switch :checked="formData.authConfig.registerEnabled" @change="formData.authConfig.registerEnabled = !formData.authConfig.registerEnabled" />
        </view>

        <view v-if="formData.authConfig.registerEnabled" class="form-item">
          <text class="form-label">必填邀请码</text>
          <switch :checked="formData.authConfig.inviteCodeRequired" @change="formData.authConfig.inviteCodeRequired = !formData.authConfig.inviteCodeRequired" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-header">
          <text class="section-title">渠道配置</text>
          <text class="section-hint">必选（只能选择你有权限的渠道）</text>
        </view>

        <view class="form-item switch-item">
          <view>
            <text class="form-label">是否允许跨渠道</text>
            <text class="form-hint" v-if="formData.channelUsage !== 'site_only'">开启后，用户可见跨渠道课程/分类，且可使用个人渠道数据</text>
            <text class="form-hint" v-else>关闭后，仅展示站点渠道数据，跨渠道内容全部屏蔽</text>
          </view>
          <switch :checked="formData.channelUsage !== 'site_only'" @change="toggleChannelUsage" color="#07c160" />
        </view>

        <view class="channel-list">
          <view 
            v-for="channel in selectedChannels" 
            :key="channel.id"
            class="channel-item"
          >
            <view class="channel-info">
              <text class="channel-name">{{ channel.name }}</text>
              <text class="channel-code">{{ channel.code }}</text>
            </view>
            <text class="remove-channel" @click="removeChannel(channel.id)">×</text>
          </view>
          
          <view v-if="selectedChannels.length === 0" class="empty-channel">
            <text class="empty-text">暂无关联渠道</text>
          </view>
        </view>
        
        <button class="btn-add-channel" @click="showChannelSelector = true">
          + 添加渠道
        </button>
      </view>

      <view class="form-section">
        <view class="section-header">
          <text class="section-title">三方登录配置</text>
          <text class="add-third-btn" @click="openThirdForm">+ 添加配置</text>
        </view>
        
        <view class="third-config-list">
          <view 
            v-for="config in thirdConfigs" 
            :key="config.documentId"
            class="third-config-item"
          >
            <view class="third-icon" :class="config.platform">
              {{ platformIcons[config.platform] || '🔗' }}
            </view>
            <view class="third-info">
              <text class="third-name">{{ config.name }}</text>
              <text class="third-type">{{ getAppTypeLabel(config.platform, config.appType) }}</text>
            </view>
            <view class="third-status" :class="config.enabled ? 'enabled' : 'disabled'">
              {{ config.enabled ? '启用' : '禁用' }}
            </view>
            <view class="third-actions">
              <text class="action-edit" @click="editThirdConfig(config)">编辑</text>
              <text class="action-delete" @click="deleteThirdConfig(config)">删除</text>
            </view>
          </view>
          
          <view v-if="thirdConfigs.length === 0" class="empty-third">
            <text class="empty-text">暂无三方登录配置</text>
          </view>
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">模板样式</text>
        <view class="form-item">
          <text class="form-label">预设模板</text>
          <picker mode="selector" :range="templateList" range-key="displayName" @change="onTemplateChange">
            <view class="picker-value">
              <text>{{ currentTemplate?.displayName || '请选择' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="form-item">
          <text class="form-label">主题色</text>
          <ColorPicker v-model="themeConfig.primaryColor" />
        </view>
        <view class="form-item">
          <text class="form-label">辅助色</text>
          <ColorPicker v-model="themeConfig.secondaryColor" />
        </view>
        <view class="form-item">
          <text class="form-label">导航样式</text>
          <radio-group @change="e => themeConfig.navStyle = e.detail.value">
            <label class="radio-label"><radio value="default" :checked="themeConfig.navStyle === 'default'" /> 默认</label>
            <label class="radio-label"><radio value="gradient" :checked="themeConfig.navStyle === 'gradient'" /> 渐变</label>
            <label class="radio-label"><radio value="custom" :checked="themeConfig.navStyle === 'custom'" /> 自定义</label>
          </radio-group>
        </view>
        <view class="form-item">
          <text class="form-label">tabBar 颜色</text>
          <ColorPicker v-model="themeConfig.tabBarColor" />
        </view>
        <view class="form-item">
          <text class="form-label">tabBar 激活色</text>
          <ColorPicker v-model="themeConfig.tabBarActiveColor" />
        </view>
      </view>
    </scroll-view>

    <view v-if="showChannelSelector" class="tag-picker-modal" @click="showChannelSelector = false">
      <view class="tag-picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择渠道（可多选）</text>
          <button class="picker-confirm-btn" @click="showChannelSelector = false">确定</button>
        </view>
        <scroll-view scroll-y class="tag-options">
          <view
            v-for="item in flatTree"
            :key="item.id"
            class="tag-option"
            :class="{ selected: isChannelSelected(item.id), 'tree-leaf': item.level > 0 }"
            :style="{ paddingLeft: (20 + item.level * 24) + 'rpx' }"
            @click="toggleChannelSelection(item)"
          >
            <text class="tree-indent" v-if="item.level > 0">└</text>
            <text>{{ item.name }}</text>
            <text v-if="isChannelSelected(item.id)" class="tag-check">✓</text>
          </view>
          <view v-if="flatTree.length === 0" class="empty-channel">
            <text class="empty-text">暂无可选渠道</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <view v-if="showThirdForm" class="tag-picker-modal" @click="closeThirdForm">
      <view class="tag-picker-content third-form-modal" @click.stop>
        <view class="picker-header">
          <text class="picker-title">{{ editingThirdConfig ? '编辑配置' : '添加三方配置' }}</text>
          <button class="picker-confirm-btn" @click="closeThirdForm">取消</button>
        </view>
        <scroll-view scroll-y class="tag-options">
          <view class="form-item">
            <text class="form-label">配置名称 *</text>
            <input class="form-input" placeholder="请输入配置名称" v-model="thirdForm.name" />
          </view>
          <view class="form-item">
            <text class="form-label">平台 *</text>
            <view class="picker-value" @click="showPlatformPicker = true">
              <text>{{ currentPlatform?.label || '请选择平台' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">应用类型 *</text>
            <view class="picker-value" @click="showAppTypePicker = true">
              <text>{{ currentAppType?.label || '请选择应用类型' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">{{ currentPlatform?.appIdLabel || 'App ID' }} *</text>
            <input class="form-input" placeholder="请输入" v-model="thirdForm.appId" />
          </view>
          <view class="form-item">
            <text class="form-label">{{ currentPlatform?.appSecretLabel || 'App Secret' }} *</text>
            <input class="form-input" placeholder="请输入" v-model="thirdForm.appSecret" password />
          </view>
          <view v-if="currentPlatform?.hasMerchantId" class="form-item">
            <text class="form-label">商户号</text>
            <input class="form-input" placeholder="请输入商户号" v-model="thirdForm.merchantId" />
          </view>
          <view v-if="currentPlatform?.hasToken" class="form-item">
            <text class="form-label">Token</text>
            <input class="form-input" placeholder="请输入Token" v-model="thirdForm.token" />
          </view>
          <view class="form-item">
            <text class="form-label">启用状态</text>
            <switch :checked="thirdForm.enabled" @change="thirdForm.enabled = !thirdForm.enabled" />
          </view>
        </scroll-view>
        <view class="picker-footer">
          <button class="btn-cancel" @click="closeThirdForm">取消</button>
          <button class="btn-confirm" :disabled="saving" @click="saveThirdConfig">保存</button>
        </view>
      </view>
    </view>

    <view v-if="showAuthModePicker" class="tag-picker-modal" @click="showAuthModePicker = false">
      <view class="tag-picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择认证模式</text>
          <button class="picker-confirm-btn" @click="showAuthModePicker = false">确定</button>
        </view>
        <scroll-view scroll-y class="tag-options">
          <view
            v-for="mode in authModeOptions"
            :key="mode.value"
            class="tag-option"
            :class="{ selected: formData.authConfig.authMode === mode.value }"
            @click="selectAuthMode(mode.value)"
          >
            <text>{{ mode.label }}</text>
            <text v-if="formData.authConfig.authMode === mode.value" class="tag-check">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <view v-if="showPlatformPicker" class="tag-picker-modal" @click="showPlatformPicker = false">
      <view class="tag-picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择平台</text>
          <button class="picker-confirm-btn" @click="showPlatformPicker = false">确定</button>
        </view>
        <scroll-view scroll-y class="tag-options">
          <view
            v-for="(platform, index) in platforms"
            :key="platform.value"
            class="tag-option"
            :class="{ selected: thirdForm.platform === platform.value }"
            @click="selectPlatform(platform, index)"
          >
            <text>{{ platform.label }}</text>
            <text v-if="thirdForm.platform === platform.value" class="tag-check">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <view v-if="showAppTypePicker" class="tag-picker-modal" @click="showAppTypePicker = false">
      <view class="tag-picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择应用类型</text>
          <button class="picker-confirm-btn" @click="showAppTypePicker = false">确定</button>
        </view>
        <scroll-view scroll-y class="tag-options">
          <view
            v-for="appType in currentAppTypes"
            :key="appType.value"
            class="tag-option"
            :class="{ selected: thirdForm.appType === appType.value }"
            @click="selectAppType(appType)"
          >
            <text>{{ appType.label }}</text>
            <text v-if="thirdForm.appType === appType.value" class="tag-check">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <MediaPicker
      :visible="showMediaPicker"
      :folder="mediaPickerTarget === 'favicon' ? '/site/favicons' : '/site/images'"
      accept="image/*"
      @select="onMediaSelected"
      @update:visible="showMediaPicker = $event"
    />
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getSiteConfigDetail, createSiteConfig, updateSiteConfig } from '../../src/api/site-config.js'
import { getAdminChannelList } from '../../src/api/channel.js'
import { getThirdPartyConfigList, createThirdPartyConfig, updateThirdPartyConfig, deleteThirdPartyConfig } from '../../src/api/third-party.js'
import { getMediaUrl, extractList, extractItem } from '../../src/utils/format.js'
import { BASE_API } from '../../src/config/env.js'
import MediaPicker from '../../src/components/MediaPicker.vue'
import ColorPicker from '../../src/components/ColorPicker.vue'
import { getTemplates } from '../../src/api/site-template.js'

const documentId = ref('')
const isEdit = ref(false)
const showChannelSelector = ref(false)
const showThirdForm = ref(false)
const showPlatformPicker = ref(false)
const showAppTypePicker = ref(false)
const showAuthModePicker = ref(false)
const showMediaPicker = ref(false)
const mediaPickerTarget = ref('logo')
const editingThirdConfig = ref(null)
const availableChannels = ref([])
const saving = ref(false)
const loading = ref(false)
const originalExtraConfig = ref({})

// schema 字段集（存入 site-config 列，非 extraConfig）
// 与后端 updateSiteById 的 SITE_FIELDS 保持一致
const SCHEMA_FIELDS = new Set([
  'siteName', 'siteDescription', 'logo', 'favicon', 'icpNumber',
  'seoKeywords', 'seoDescription', 'tencentMapKey', 'shareTitle',
  'shareDescription', 'shareImage', 'customerServiceUrl',
  'featureFlags', 'domain', 'template', 'themeConfig', 'channelUsage',
  'channels', 'extraConfig',
  'documentId', 'id', 'createdAt', 'updatedAt', 'publishedAt',
  'createdBy', 'updatedBy', 'locale', '_meta',
])

const authModeOptions = [
  { value: 'local', label: '本地登录（账号密码/手机验证码）' },
  { value: 'third', label: '三方登录（微信/支付宝/抖音）' },
  { value: 'sso', label: 'SSO 单点登录' }
]

const thirdPartyLabels = {
  wechatOfficialAccountEnabled: '微信公众号',
  wechatMiniProgramEnabled: '微信小程序',
  wechatOpenPlatformEnabled: '微信开放平台',
  alipayEnabled: '支付宝',
  douyinEnabled: '抖音'
}

const currentAuthModeLabel = computed(() =>
  authModeOptions.find(m => m.value === formData.authConfig.authMode)?.label || ''
)

const featureLabels = {
  sso: 'SSO登录',
  points: '积分系统',
  quiz: '题库管理',
  course: '课程管理',
  channel: '渠道管理',
  thirdParty: '三方登录',
  oss: 'OSS存储',
  website: '企业官网'
}

const platformIcons = {
  wechat: '💬',
  alipay: '💳',
  douyin: '🎵'
}

const platforms = [
  { value: 'wechat', label: '微信', appIdLabel: 'AppID', appSecretLabel: 'AppSecret', hasToken: true, hasMerchantId: false },
  { value: 'alipay', label: '支付宝', appIdLabel: 'AppID', appSecretLabel: '应用私钥', hasToken: false, hasMerchantId: true },
  { value: 'douyin', label: '抖音', appIdLabel: 'Client Key', appSecretLabel: 'Client Secret', hasToken: false, hasMerchantId: false }
]

const appTypes = {
  wechat: [
    { value: 'official_account', label: '公众号' },
    { value: 'mini_program', label: '小程序' },
    { value: 'open_platform', label: '开放平台' }
  ],
  alipay: [
    { value: 'alipay_life', label: '生活号' },
    { value: 'alipay_mini', label: '小程序' }
  ],
  douyin: [
    { value: 'douyin_open', label: '开放平台' },
    { value: 'douyin_mini', label: '小程序' }
  ]
}

const tierLabels = {
  root: '根渠道',
  core: '核心渠道',
  senior: '高级渠道',
  global: '全球渠道',
  authorized: '授权渠道',
  official: '官方渠道',
  partner: '合作伙伴',
  agent: '代理渠道',
  national: '全国',
  regional: '区域',
  city: '城市',
  county: '区县',
  local: '本地',
  store: '门店'
}

const currentPlatform = computed(() => platforms.find(p => p.value === thirdForm.platform))
const currentAppTypes = computed(() => appTypes[thirdForm.platform] || [])
const currentAppType = computed(() => currentAppTypes.value.find(at => at.value === thirdForm.appType))

// 渠道树形相关
const selectedChannelIds = computed(() => selectedChannels.value.map(ch => ch.id))

function extractParentId(parentChannelId) {
  if (parentChannelId == null) return null
  if (typeof parentChannelId === 'object') return parentChannelId.id ?? null
  return parentChannelId
}

function buildChannelTree(channels) {
  const map = new Map()
  const roots = []
  channels.forEach(ch => map.set(ch.id, { ...ch, children: [] }))
  channels.forEach(ch => {
    const parentId = extractParentId(ch.parentChannelId)
    const node = map.get(ch.id)
    if (parentId == null || !map.has(parentId)) {
      roots.push(node)
    } else {
      map.get(parentId).children.push(node)
    }
  })
  return roots
}

function flattenTree(nodes, level = 0, result = []) {
  nodes.forEach(node => {
    result.push({ ...node, level })
    if (node.children && node.children.length > 0) {
      flattenTree(node.children, level + 1, result)
    }
  })
  return result
}

const channelTree = computed(() => buildChannelTree(availableChannels.value))
const flatTree = computed(() => flattenTree(channelTree.value))

const formData = reactive({
  siteName: '',
  domain: '',
  siteDescription: '',
  icpNumber: '',
  customerServiceUrl: '',
  logoId: null,
  logoUrl: '',
  faviconId: null,
  faviconUrl: '',
  seoKeywords: '',
  seoDescription: '',
  tencentMapKey: '',
  shareTitle: '',
  shareDescription: '',
  shareImageId: null,
  shareImageUrl: '',
  sharePath: '/pages/index/index',
  channels: [],
  channelUsage: 'site_cross_user',
  featureFlags: {
    sso: false,
    points: true,
    quiz: true,
    course: true,
    channel: true,
    thirdParty: true,
    oss: false,
    website: true
  },
  authConfig: {
    authMode: 'local',
    wechatOfficialAccountEnabled: false,
    wechatMiniProgramEnabled: false,
    wechatOpenPlatformEnabled: false,
    alipayEnabled: false,
    douyinEnabled: false,
    ssoLoginUrl: '',
    registerEnabled: false,
    inviteCodeRequired: false
  }
})

const selectedChannels = ref([])
const thirdConfigs = ref([])

const templateList = ref([])
const currentTemplate = ref(null)
const themeConfig = ref({
  primaryColor: '#667eea',
  secondaryColor: '#f0f2f5',
  navStyle: 'default',
  cardStyle: 'default',
  tabBarColor: '#667eea',
  tabBarActiveColor: '#ffffff',
})

const thirdForm = reactive({
  name: '',
  platform: 'wechat',
  appType: 'official_account',
  appId: '',
  appSecret: '',
  merchantId: '',
  token: '',
  enabled: true,
  site: ''
})

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}

  if (options.documentId) {
    documentId.value = options.documentId
    isEdit.value = true
    await loadTemplates()
    await loadTenantDetail()
  }

  await loadChannels()
  await loadThirdConfigs()
})

async function loadTenantDetail() {
  loading.value = true
  try {
    const data = await getSiteConfigDetail(documentId.value)
    // 缓存原始 extraConfig，保存时与认证配置合并（保留其他未编辑字段）
    // 后端 getSiteOne 把 extraConfig 展开到顶层，响应可能无 extraConfig 字段；优先用 extraConfig，回退到展开的顶层
    const rawEc = data.extraConfig ?? data
    // 历史数据兼容：清理嵌套 extraConfig 字段
    const ec = { ...rawEc }
    if (ec.extraConfig && typeof ec.extraConfig === 'object') {
      Object.assign(ec, ec.extraConfig)
      delete ec.extraConfig
    }
    // 只保留真正的 extraConfig 字段（排除 schema 字段），避免保存时旧值覆盖 formData 新值
    const filteredEc = {}
    for (const [k, v] of Object.entries(ec)) {
      if (!SCHEMA_FIELDS.has(k)) filteredEc[k] = v
    }
    originalExtraConfig.value = filteredEc
    Object.assign(formData, {
      siteName: data.siteName || '',
      domain: data.domain || '',
      siteDescription: data.siteDescription || '',
      icpNumber: data.icpNumber || '',
      customerServiceUrl: data.customerServiceUrl || '',
      seoKeywords: data.seoKeywords || '',
      seoDescription: data.seoDescription || '',
      tencentMapKey: data.tencentMapKey || '',
      shareTitle: data.shareTitle || '',
      shareDescription: data.shareDescription || '',
      sharePath: data.sharePath || '/pages/index/index',
      featureFlags: data.featureFlags ?? formData.featureFlags,
      channelUsage: data.channelUsage || 'site_cross_user'
    })
    // 回填认证配置（按字段取默认值，避免覆盖 extraConfig 中其他字段）
    formData.authConfig = {
      authMode: ec.authMode ?? 'local',
      wechatOfficialAccountEnabled: ec.wechatOfficialAccountEnabled ?? false,
      wechatMiniProgramEnabled: ec.wechatMiniProgramEnabled ?? false,
      wechatOpenPlatformEnabled: ec.wechatOpenPlatformEnabled ?? false,
      alipayEnabled: ec.alipayEnabled ?? false,
      douyinEnabled: ec.douyinEnabled ?? false,
      ssoLoginUrl: ec.ssoLoginUrl ?? '',
      registerEnabled: ec.registerEnabled ?? false,
      inviteCodeRequired: ec.inviteCodeRequired ?? false
    }
    if (data.logo) {
      formData.logoId = data.logo.id
      formData.logoUrl = data.logo ? getMediaUrl(data.logo) : ''
    }
    if (data.favicon) {
      formData.faviconId = data.favicon.id
      formData.faviconUrl = data.favicon ? getMediaUrl(data.favicon) : ''
    }
    if (data.shareImage) {
      formData.shareImageId = data.shareImage.id
      formData.shareImageUrl = data.shareImage ? getMediaUrl(data.shareImage) : ''
    }
    selectedChannels.value = data.channels ?? []
    // 回填主题配置
    if (data.themeConfig) {
      try {
        const tc = typeof data.themeConfig === 'string' ? JSON.parse(data.themeConfig) : data.themeConfig
        themeConfig.value = { ...themeConfig.value, ...tc }
      } catch { /* ignore */ }
    }
    // 回填预设模板选中状态
    const tplId = data.template?.documentId ?? data.template
    currentTemplate.value = tplId ? (templateList.value.find(t => t.documentId === tplId) ?? null) : null
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadChannels() {
  try {
    // 始终加载全部渠道（用于选择器树形展示），传大 pageSize 避免分页截断
    const allResult = await getAdminChannelList({ page: 1, pageSize: 999 })
    availableChannels.value = allResult.list ?? []
  } catch (e) {
    console.error('加载渠道失败', e)
  }
}

async function loadThirdConfigs() {
  if (!documentId.value) return
  try {
    const result = await getThirdPartyConfigList({ site: documentId.value })
    thirdConfigs.value = result.list ?? []
  } catch (e) {
    console.error('加载三方配置失败', e)
  }
}

async function loadTemplates() {
  try {
    const result = await getTemplates({ pageSize: 999 })
    templateList.value = result.list ?? []
  } catch (e) {
    console.error('加载模板列表失败', e)
  }
}

function onTemplateChange(e) {
  const idx = e.detail.value
  currentTemplate.value = templateList.value[idx]
  if (currentTemplate.value?.themeConfig) {
    const config = typeof currentTemplate.value.themeConfig === 'string'
      ? JSON.parse(currentTemplate.value.themeConfig)
      : currentTemplate.value.themeConfig
    themeConfig.value = { ...themeConfig.value, ...config }
  }
}

function toggleFeature(key) {
  if (!formData.featureFlags) formData.featureFlags = {}
  formData.featureFlags[key] = !formData.featureFlags[key]
}

function selectAuthMode(value) {
  formData.authConfig.authMode = value
  showAuthModePicker.value = false
}

function toggleThirdParty(key) {
  formData.authConfig[key] = !formData.authConfig[key]
}

function isChannelSelected(channelId) {
  return selectedChannelIds.value.includes(channelId)
}

function toggleChannelSelection(channel) {
  const index = selectedChannels.value.findIndex(ch => ch.id === channel.id)
  if (index > -1) {
    selectedChannels.value.splice(index, 1)
  } else {
    selectedChannels.value.push(channel)
  }
}

function toggleChannelUsage(e) {
  formData.channelUsage = e.detail.value ? 'site_cross_user' : 'site_only'
}

function removeChannel(channelId) {
  const index = selectedChannels.value.findIndex(ch => ch.id === channelId)
  if (index > -1) {
    selectedChannels.value.splice(index, 1)
  }
}

function selectPlatform(platform, index) {
  thirdForm.platform = platform.value
  thirdForm.appType = appTypes[platform.value]?.[0]?.value || ''
  showPlatformPicker.value = false
}

function selectAppType(appType) {
  thirdForm.appType = appType.value
  showAppTypePicker.value = false
}

function openThirdForm() {
  if (!isEdit.value || !documentId.value) {
    uni.showToast({ title: '请先保存租户信息', icon: 'none' })
    return
  }
  editingThirdConfig.value = null
  thirdForm.name = ''
  thirdForm.platform = 'wechat'
  thirdForm.appType = 'official_account'
  thirdForm.appId = ''
  thirdForm.appSecret = ''
  thirdForm.merchantId = ''
  thirdForm.token = ''
  thirdForm.enabled = true
  thirdForm.site = documentId.value
  showThirdForm.value = true
}

function editThirdConfig(config) {
  editingThirdConfig.value = config
  thirdForm.name = config.name
  thirdForm.platform = config.platform
  thirdForm.appType = config.appType
  thirdForm.appId = config.appId || ''
  thirdForm.appSecret = config.appSecret || ''
  thirdForm.merchantId = config.merchantId || ''
  thirdForm.token = config.token || ''
  thirdForm.enabled = config.enabled
  thirdForm.site = documentId.value
  showThirdForm.value = true
}

async function deleteThirdConfig(config) {
  if (saving.value) return
  uni.showModal({
    title: '确认删除',
    content: `确定要删除配置 "${config.name}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        saving.value = true
        try {
          await deleteThirdPartyConfig(config.documentId)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadThirdConfigs()
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        } finally {
          saving.value = false
        }
      }
    }
  })
}

function closeThirdForm() {
  showThirdForm.value = false
  editingThirdConfig.value = null
  resetThirdForm()
}

function resetThirdForm() {
  thirdForm.name = ''
  thirdForm.platform = 'wechat'
  thirdForm.appType = 'official_account'
  thirdForm.appId = ''
  thirdForm.appSecret = ''
  thirdForm.merchantId = ''
  thirdForm.token = ''
  thirdForm.enabled = true
  thirdForm.site = documentId.value
}

async function saveThirdConfig() {
  if (saving.value) return
  if (!thirdForm.name || !thirdForm.platform || !thirdForm.appType || !thirdForm.appId || !thirdForm.appSecret) {
    uni.showToast({ title: '请填写必填字段', icon: 'none' })
    return
  }

  if (!documentId.value) {
    uni.showToast({ title: '请先保存租户', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const data = {
      ...thirdForm,
      site: documentId.value
    }
    if (editingThirdConfig.value) {
      await updateThirdPartyConfig(editingThirdConfig.value.documentId, data)
    } else {
      await createThirdPartyConfig(data)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    closeThirdForm()
    loadThirdConfigs()
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function openMediaPicker(target) {
  mediaPickerTarget.value = target
  showMediaPicker.value = true
}

function onMediaSelected(file) {
  const t = mediaPickerTarget.value
  if (t === 'logo') { formData.logoId = file.id; formData.logoUrl = file.url }
  else if (t === 'favicon') { formData.faviconId = file.id; formData.faviconUrl = file.url }
  else if (t === 'shareImage') { formData.shareImageId = file.id; formData.shareImageUrl = file.url }
  showMediaPicker.value = false
}

function removeMedia(target) {
  if (target === 'logo') { formData.logoId = null; formData.logoUrl = '' }
  else if (target === 'favicon') { formData.faviconId = null; formData.faviconUrl = '' }
  else if (target === 'shareImage') { formData.shareImageId = null; formData.shareImageUrl = '' }
}

async function saveTenant(goBack = false) {
  if (saving.value || loading.value) return
  if (!formData.siteName || !formData.domain) {
    uni.showToast({ title: '请填写租户名称和域名', icon: 'none' })
    return
  }

  if (selectedChannels.value.length === 0) {
    uni.showToast({ title: '请选择至少一个渠道', icon: 'none' })
    return
  }

  // SSO 校验：开启 SSO 登录时地址必填
  if (formData.authConfig.authMode === 'sso' && formData.featureFlags.sso && !formData.authConfig.ssoLoginUrl.trim()) {
    uni.showToast({ title: '请填写 SSO 登录地址', icon: 'none' })
    return
  }

  saving.value = true

  // 合并 extraConfig：保留原有未编辑字段，覆盖认证配置
  // 历史数据兼容：清理可能存在的嵌套 extraConfig 字段
  const cleanedOriginal = { ...originalExtraConfig.value }
  if (cleanedOriginal.extraConfig && typeof cleanedOriginal.extraConfig === 'object') {
    Object.assign(cleanedOriginal, cleanedOriginal.extraConfig)
    delete cleanedOriginal.extraConfig
  }
  const mergedExtraConfig = {
    ...cleanedOriginal,
    ...formData.authConfig
  }

  const data = {
    siteName: formData.siteName,
    domain: formData.domain,
    siteDescription: formData.siteDescription,
    icpNumber: formData.icpNumber,
    customerServiceUrl: formData.customerServiceUrl,
    logo: formData.logoId ?? undefined,
    favicon: formData.faviconId ?? undefined,
    seoKeywords: formData.seoKeywords,
    seoDescription: formData.seoDescription,
    tencentMapKey: formData.tencentMapKey,
    shareTitle: formData.shareTitle,
    shareDescription: formData.shareDescription,
    shareImage: formData.shareImageId ?? undefined,
    sharePath: formData.sharePath,
    channels: selectedChannels.value.map(ch => ch.documentId || ch.id),
    featureFlags: formData.featureFlags,
    channelUsage: formData.channelUsage,
    ...mergedExtraConfig,
    template: currentTemplate.value?.documentId ?? null,
    themeConfig: JSON.stringify(themeConfig.value)
  }

  try {
    let result
    if (isEdit.value) {
      result = await updateSiteConfig(documentId.value, data)
    } else {
      result = await createSiteConfig(data)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })

    if (!isEdit.value && result?.documentId) {
      documentId.value = result.documentId
      isEdit.value = true
      loadThirdConfigs()
    }

    if (goBack) {
      setTimeout(() => {
        uni.navigateBack()
      }, 500)
    }
  } catch (e) {
    // request.js 已处理错误展示
  } finally {
    saving.value = false
  }
}

function getTierLabel(tier) {
  return tierLabels[tier] || tier
}

function getAppTypeLabel(platform, appType) {
  const types = appTypes[platform] || []
  const type = types.find(t => t.value === appType)
  return type?.label || appType
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 8rpx;
    
    .back-icon {
      font-size: 36rpx;
      color: #303133;
    }
    
    .back-text {
      font-size: 28rpx;
      color: #303133;
    }
  }
  
  .page-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  .btn-save {
    background: linear-gradient(135deg, #409eff 0%, #667eea 100%);
    color: #fff;
    border: none;
    border-radius: 8rpx;
    padding: 16rpx 32rpx;
    font-size: 28rpx;
  }
  .btn-save-return {
    background: #fff;
    color: #667eea;
    border: 2rpx solid #667eea;
    border-radius: 8rpx;
    padding: 14rpx 28rpx;
    font-size: 26rpx;
    margin-left: 16rpx;
  }
}

.page-content {
  height: calc(100vh - 96rpx);
  padding: 24rpx;
}

.form-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .section-hint {
      font-size: 24rpx;
      color: #909399;
    }
    
    .add-third-btn {
      font-size: 26rpx;
      color: #409eff;
    }
  }
  
  .section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 24rpx;
    display: block;
  }
  
  .form-row {
    display: flex;
    gap: 20rpx;
  }
  
  .form-item {
    margin-bottom: 24rpx;
    
    &.half {
      flex: 1;
    }
    
    .form-label {
      font-size: 26rpx;
      color: #606266;
      margin-bottom: 12rpx;
      display: block;
    }
    
    .form-input {
      width: 100%;
      padding: 20rpx;
      border: 2rpx solid #e4e7ed;
      border-radius: 8rpx;
      font-size: 28rpx;
    }
    
    .form-textarea {
      width: 100%;
      padding: 20rpx;
      border: 2rpx solid #e4e7ed;
      border-radius: 8rpx;
      font-size: 28rpx;
      min-height: 160rpx;
    }
    
    .form-picker {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx;
      border: 2rpx solid #e4e7ed;
      border-radius: 8rpx;
      font-size: 28rpx;

      .picker-arrow {
        font-size: 20rpx;
        color: #909399;
      }
    }

    .picker-value {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx;
      border: 2rpx solid #e4e7ed;
      border-radius: 8rpx;
      font-size: 28rpx;

      .picker-arrow {
        font-size: 20rpx;
        color: #909399;
      }
    }

    .radio-label {
      margin-right: 24rpx;
      font-size: 28rpx;
      color: #303133;
    }
  }
  
  .sub-section {
    margin-top: 20rpx;
    padding: 20rpx;
    background: #f9fafc;
    border-radius: 12rpx;
  }

  .sub-section-title {
    display: block;
    font-size: 26rpx;
    color: #606266;
    margin-bottom: 16rpx;
  }

  .feature-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12rpx;
      padding: 20rpx;
      background: #f5f7fa;
      border-radius: 8rpx;
      border: 2rpx solid transparent;
      
      &:active {
        border-color: #409eff;
      }
      
      .feature-icon {
        width: 40rpx;
        height: 40rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24rpx;
        
        &.enabled {
          background: #409eff;
          color: #fff;
        }
        
        &.disabled {
          background: #e4e7ed;
          color: #909399;
        }
      }
      
      .feature-label {
        font-size: 26rpx;
        color: #303133;
      }
    }
  }
  
  .channel-list {
    margin-bottom: 20rpx;
    
    .channel-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx;
      background: #f5f7fa;
      border-radius: 8rpx;
      margin-bottom: 12rpx;
      
      .channel-info {
        display: flex;
        flex-direction: column;
        gap: 4rpx;
        
        .channel-name {
          font-size: 28rpx;
          color: #303133;
        }
        
        .channel-code {
          font-size: 22rpx;
          color: #909399;
        }
      }
      
      .remove-channel {
        font-size: 40rpx;
        color: #f56c6c;
        line-height: 1;
      }
    }
    
    .empty-channel {
      padding: 40rpx;
      text-align: center;
      
      .empty-text {
        font-size: 26rpx;
        color: #909399;
      }
    }
  }
  
  .btn-add-channel {
    width: 100%;
    padding: 20rpx;
    border: 2rpx dashed #d9d9d9;
    border-radius: 8rpx;
    color: #909399;
    font-size: 28rpx;
    background: #fff;
  }
  
  .third-config-list {
    .third-config-item {
      display: flex;
      align-items: center;
      padding: 20rpx;
      background: #f5f7fa;
      border-radius: 8rpx;
      margin-bottom: 12rpx;
      gap: 16rpx;
      
      .third-icon {
        width: 56rpx;
        height: 56rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28rpx;
        
        &.wechat { background: #07c160; color: #fff; }
        &.alipay { background: #1677ff; color: #fff; }
        &.douyin { background: #000; color: #fff; }
      }
      
      .third-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4rpx;
        
        .third-name {
          font-size: 28rpx;
          color: #303133;
        }
        
        .third-type {
          font-size: 22rpx;
          color: #909399;
        }
      }
      
      .third-status {
        padding: 6rpx 16rpx;
        border-radius: 20rpx;
        font-size: 22rpx;
        
        &.enabled { background: #f0f9eb; color: #67c23a; }
        &.disabled { background: #fef0f0; color: #f56c6c; }
      }
      
      .third-actions {
        display: flex;
        gap: 20rpx;
        
        .action-edit {
          font-size: 26rpx;
          color: #409eff;
        }
        
        .action-delete {
          font-size: 26rpx;
          color: #f56c6c;
        }
      }
    }
    
    .empty-third {
      padding: 40rpx;
      text-align: center;
      
      .empty-text {
        font-size: 26rpx;
        color: #909399;
      }
    }
  }
}

.tag-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.tag-picker-content {
  width: 100%;
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  
  &.third-form-modal {
    max-height: 85vh;
  }
  
  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #eee;
    
    .picker-title {
      font-size: 32rpx;
      font-weight: bold;
    }
    
    .picker-confirm-btn {
      background: #667eea;
      color: #fff;
      border: none;
      padding: 0 24rpx;
      height: 56rpx;
      border-radius: 8rpx;
      font-size: 28rpx;
      line-height: 56rpx;
    }
  }
  
  .tag-options {
    flex: 1;
    padding: 20rpx;
    max-height: 50vh;
    
    .tag-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 25rpx 20rpx;
      border-radius: 10rpx;
      margin-bottom: 10rpx;

      &.selected {
        background: #667eea;
        color: #fff;
      }

      &.tree-leaf {
        font-size: 26rpx;
        color: #606266;
      }

      .tree-indent {
        margin-right: 10rpx;
        color: #c0c4cc;
      }

      .tag-check {
        font-size: 28rpx;
      }
    }
    
    .picker-value {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 80rpx;
      border: 1rpx solid #ddd;
      border-radius: 10rpx;
      padding: 0 20rpx;
      font-size: 28rpx;
      
      .picker-arrow {
        font-size: 20rpx;
        color: #999;
      }
    }
  }
  
  .picker-footer {
    display: flex;
    gap: 20rpx;
    padding: 28rpx;
    border-top: 1rpx solid #f0f0f0;
    
    .btn-cancel {
      flex: 1;
      padding: 20rpx;
      border: 2rpx solid #d9d9d9;
      border-radius: 8rpx;
      font-size: 28rpx;
      color: #606266;
      background: #fff;
    }
    
    .btn-confirm {
      flex: 1;
      padding: 20rpx;
      background: #409eff;
      border: none;
      border-radius: 8rpx;
      font-size: 28rpx;
      color: #fff;
    }
  }
}

.media-select {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  overflow: hidden;
  background: #f5f5f5;
}
.media-preview { width: 100%; height: 100%; }
.media-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 24rpx; color: #999;
  border: 2rpx dashed #ddd; border-radius: 8rpx;
  box-sizing: border-box;
}
.media-remove {
  position: absolute; top: 4rpx; right: 4rpx;
  width: 36rpx; height: 36rpx;
  background: rgba(0,0,0,0.5); color: #fff;
  border-radius: 50%;
  font-size: 22rpx; text-align: center; line-height: 36rpx;
}
</style>