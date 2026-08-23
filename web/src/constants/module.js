/**
 * 模块共享常量
 * 与后端 VISIBILITY_MODULES 对齐（移除 payment/community/forum，无对应权限树）
 * tenant/detail 和 module-visibility 页面共用
 */

// 11 个有效模块（含 channel 和 wealth，用于 featureFlags 开关）
export const MODULE_LIST = [
  { key: 'website', label: '企业官网', icon: '🌐' },
  { key: 'logistics', label: '物流中心', icon: '🚚' },
  { key: 'studio', label: '媒体发布中心', icon: '📹' },
  { key: 'points', label: '积分中心', icon: '💎' },
  { key: 'course', label: '课程中心', icon: '📚' },
  { key: 'quiz', label: '题目中心', icon: '📝' },
  { key: 'channel', label: '渠道管理', icon: '🔗' },
  { key: 'sso', label: 'SSO 登录', icon: '🔑' },
  { key: 'thirdParty', label: '三方登录', icon: '🔌' },
  { key: 'oss', label: 'OSS 存储', icon: '☁️' },
  { key: 'wealth', label: '理财中心', icon: '💰' },
]

// 新建租户时 featureFlags 的默认值
export const DEFAULT_FEATURE_FLAGS = {
  website: true,
  logistics: true,
  studio: true,
  points: true,
  course: true,
  quiz: true,
  channel: true,
  sso: false,
  thirdParty: true,
  oss: false,
  wealth: false,
  exam: true,
  activity: true,
  roleGate: false,
}
