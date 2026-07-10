import { getPublicConfig } from '../api/config.js'

let cachedConfig = null
// 接口不可访问时的弹窗节流（30秒内只提示一次）
let lastUnavailableNotify = 0
const UNAVAILABLE_NOTIFY_INTERVAL = 30 * 1000

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