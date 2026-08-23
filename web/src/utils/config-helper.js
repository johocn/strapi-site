import { getPublicConfig } from '../api/config.js'

let cachedConfig = null
// 接口不可访问时的弹窗节流（30秒内只提示一次）
let lastUnavailableNotify = 0
const UNAVAILABLE_NOTIFY_INTERVAL = 30 * 1000

// 模块可见性 key 列表（与后端 schema 保持一致）
const VISIBILITY_MODULES = [
  'website', 'logistics', 'studio', 'points', 'course', 'quiz',
  'channel', 'sso', 'thirdParty', 'oss', 'payment', 'community', 'forum', 'wealth'
]

// 默认模块可见性配置（每个模块对哪些角色可见）
const DEFAULT_MODULE_VISIBILITY = {
  website: ['channel-admin', 'plugin-manager', 'instructor', 'website-manager', 'website-editor', 'marketing-manager', 'marketing-editor', 'tag-manager', 'tag-editor'],
  logistics: ['channel-admin', 'plugin-manager', 'instructor', 'logistics-manager', 'logistics-editor'],
  studio: ['channel-admin', 'plugin-manager', 'instructor', 'studio-manager', 'studio-editor', 'marketing-manager', 'marketing-editor'],
  points: ['channel-admin', 'plugin-manager', 'instructor', 'point-manager', 'point-editor', 'wealth-manager', 'wealth-editor'],
  course: ['channel-admin', 'plugin-manager', 'instructor', 'course-manager', 'course-editor', 'study-manager', 'study-editor', 'tag-manager', 'tag-editor'],
  quiz: ['channel-admin', 'plugin-manager', 'instructor', 'quiz-manager', 'quiz-editor', 'course-manager', 'course-editor', 'tag-manager', 'tag-editor'],
  channel: ['channel-admin', 'plugin-manager', 'marketing-manager', 'marketing-editor'],
  sso: ['plugin-manager', 'system-manager', 'system-editor'],
  thirdParty: ['plugin-manager', 'system-manager', 'system-editor'],
  oss: ['plugin-manager', 'system-manager', 'system-editor'],
  payment: ['plugin-manager', 'wealth-manager', 'wealth-editor', 'system-manager', 'system-editor'],
  community: ['channel-admin', 'plugin-manager', 'instructor', 'marketing-manager', 'marketing-editor'],
  forum: ['channel-admin', 'plugin-manager', 'instructor', 'marketing-manager', 'marketing-editor'],
  wealth: ['channel-admin', 'plugin-manager', 'instructor', 'wealth-manager', 'wealth-editor'],
  exam: ['channel-admin', 'plugin-manager', 'instructor', 'quiz-manager', 'quiz-editor', 'course-manager', 'course-editor', 'tag-manager', 'tag-editor'],
  activity: ['channel-admin', 'plugin-manager', 'instructor', 'point-manager', 'point-editor'],
}

function notifyServiceUnavailable() {
  const now = Date.now()
  if (now - lastUnavailableNotify < UNAVAILABLE_NOTIFY_INTERVAL) return
  lastUnavailableNotify = now
  try {
    uni.showModal({
      title: '服务不可用',
      content: '无法连接到服务器（/api/zhao-common/v1/public/config），请检查后端 Strapi 服务是否已启动。',
      showCancel: false,
      confirmText: '我知道了'
    })
  } catch {
    // 非 uni 环境忽略
  }
}

export async function loadSiteConfig(siteId) {
  if (cachedConfig && !siteId) return cachedConfig

  try {
    const params = siteId ? { siteId } : {}
    const res = await getPublicConfig(params)
    cachedConfig = res ?? getDefaultConfig()
    return cachedConfig
  } catch (e) {
    console.warn('[config-helper] Failed to load config:', e)
    notifyServiceUnavailable()
    return getDefaultConfig()
  }
}

export function getDefaultConfig() {
  return {
    site: {
      siteName: '',
      siteDescription: '',
      logo: '',
      favicon: '',
      shareTitle: '',
      shareDescription: '',
      shareImage: '',
      sharePath: '/pages/index/index',
      domain: '',
    },
    auth: {
      mode: 'local',
      methods: ['password', 'sms'],
      thirdPartyEnabled: false,
      ssoEnabled: false,
      ssoLoginUrl: null,
      registerEnabled: true,
      inviteCodeRequired: false,
    },
    featureFlags: {
      // 粗粒度模块总开关
      sso: true,
      points: true,
      quiz: true,
      course: true,
      channel: true,
      thirdParty: true,
      oss: false,
      website: true,
      logistics: true,
      studio: true,
      wealth: false,
      exam: true,
      activity: true,
      roleGate: false,
      // 细粒度默认值
      pointsEnabled: true,
      coursePreviewEnabled: true,
      lessonProgressEnabled: true,
      courseEnrollEnabled: true,
      channelInviteEnabled: true,
      allowCrossChannel: false,
      allowCrossChannelPublish: false,
      redemptionEnabled: true,
      courseCommentEnabled: false,
      courseRatingEnabled: false,
      paymentEnabled: false,
      smsEnabled: false,
      emailEnabled: false,
      captchaEnabled: false,
      rateLimitEnabled: true,
      maintenanceMode: false,
      debugMode: false,
    },
    points: {
      moduleEnabled: true,
      earnEnabled: true,
      redeemEnabled: true,
      signInEnabled: true,
      tasksEnabled: true,
      signInPoints: 10,
      maxPointsPerDay: 0,
    },
    theme: {
      primaryColor: '#667eea',
      secondaryColor: '#f0f2f5',
      navStyle: 'default',
      cardStyle: 'default',
      tabBarColor: '#667eea',
      tabBarActiveColor: '#ffffff',
    },
    moduleEnabled: {
      website: false, logistics: false, studio: false,
      points: true, course: true, quiz: true, channel: true,
      sso: false, thirdParty: false, oss: false,
      payment: false, community: false, forum: false,
      wealth: false, exam: true, activity: true,
    },
    moduleGrantedForCurrentTenant: {
      website: false, logistics: false, studio: false,
      points: true, course: true, quiz: true, channel: true,
      sso: false, thirdParty: false, oss: false,
      payment: false, community: false, forum: false,
      wealth: false, exam: true, activity: true,
    },
    moduleVisibility: DEFAULT_MODULE_VISIBILITY,
  }
}

// 细粒度 key → 粗粒度模块 key 映射
const FEATURE_TO_MODULE = {
  pointsEnabled: 'points',
  coursePreviewEnabled: 'course',
  lessonProgressEnabled: 'course',
  courseEnrollEnabled: 'course',
  channelInviteEnabled: 'channel',
  redemptionEnabled: 'points',
  courseCommentEnabled: 'course',
  courseRatingEnabled: 'course',
  paymentEnabled: 'points',
  allowCrossChannelPublish: 'channel',
}

export function isFeatureEnabled(key) {
  // 1. 检查粗粒度模块总开关
  const moduleKey = FEATURE_TO_MODULE[key]
  if (moduleKey && cachedConfig?.featureFlags?.[moduleKey] === false) {
    return false
  }
  // 2. 检查细粒度开关（兼容 featureFlags 嵌套和 points 顶层两种结构）
  return cachedConfig?.featureFlags?.[key] === true ||
         cachedConfig?.points?.[key] === true
}

export function clearConfigCache() {
  cachedConfig = null
}

export function getConfigValue(key, defaultValue = null) {
  return cachedConfig?.[key] ?? defaultValue
}

/**
 * 模块可见性判定（三层校验）
 *
 * 层 1：admin 角色 → 永远可见
 * 层 2：当前租户授权检查（读后端预计算的 moduleGrantedForCurrentTenant 布尔映射）
 * 层 3：租户级角色可见性（moduleVisibility）
 *
 * @param {string} moduleKey - 模块 key
 * @param {string[]} userRoles - 当前用户角色数组
 * @param {string} currentTenantDocId - 当前租户 documentId（保留参数兼容，实际未使用）
 * @returns {boolean}
 */
export function isModuleVisible(moduleKey, userRoles = [], currentTenantDocId = '') {
  // 层 1：admin 永远可见
  if (userRoles.includes('admin')) return true

  // 层 2：当前租户授权检查（后端预计算的布尔值）
  const isGranted = cachedConfig?.moduleGrantedForCurrentTenant?.[moduleKey] ?? false
  if (!isGranted) return false

  // 层 3：租户级角色可见性
  const visibility = cachedConfig?.moduleVisibility ?? DEFAULT_MODULE_VISIBILITY
  const allowedRoles = visibility[moduleKey] ?? DEFAULT_MODULE_VISIBILITY[moduleKey] ?? []
  if (userRoles.length === 0 || userRoles.every(r => r === 'user')) return false
  return userRoles.some(role => allowedRoles.includes(role))
}

/**
 * 判断某模块是否被全局授权给当前租户（前端 UI 灰显用）
 */
export function isModuleGloballyGranted(moduleKey, currentTenantDocId = '') {
  return cachedConfig?.moduleGrantedForCurrentTenant?.[moduleKey] ?? false
}