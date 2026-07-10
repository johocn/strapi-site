<template>
  <view class="page-container">
    <PageHeader title="站点配置" />

    <view v-if="loading" class="loading-bar">
      <text>加载中...</text>
    </view>

    <scroll-view scroll-y class="config-body">
      <!-- 配置作用域选择器 -->
      <view class="scope-selector">
        <view class="scope-label">配置作用域：</view>
        <radio-group @change="onScopeChange" class="scope-radio-group">
          <label class="scope-radio-item"><radio value="tenant" :checked="scope === 'tenant'" color="#667eea" /> 租户级</label>
          <label class="scope-radio-item"><radio value="channel" :checked="scope === 'channel'" color="#667eea" /> 渠道级</label>
        </radio-group>
        <view v-if="scope === 'channel'" class="channel-picker">
          <picker mode="selector" :range="channelList" range-key="name" @change="onChannelChange">
            <view class="form-picker">{{ currentChannel?.name || '请选择渠道' }} ▼</view>
          </picker>
        </view>
      </view>

      <!-- 模板信息 -->
      <view v-if="templateName" class="template-info-bar" @click="goToTemplate">
        <text class="template-info-text">当前模板: {{ templateName }}</text>
        <text class="template-info-link">查看模板</text>
      </view>

      <!-- 基本设置 -->
      <view class="form-section-title">基本设置</view>
      <view class="form-card">
        <view class="form-item" v-if="isFieldVisible('siteName')">
          <text class="form-label">站点名称</text>
          <input v-model="form.siteName" class="form-input" placeholder="请输入站点名称" :disabled="!isFieldEditable('siteName')" />
        </view>
        <view class="form-item" v-if="isFieldVisible('siteDescription')">
          <text class="form-label">站点描述</text>
          <textarea v-model="form.siteDescription" class="form-textarea" placeholder="请输入站点描述" :disabled="!isFieldEditable('siteDescription')" />
        </view>
        <view class="form-item" v-if="isFieldVisible('logo')">
          <text class="form-label">站点 Logo</text>
          <view class="media-select" @click="openMediaPicker('logo')">
            <image v-if="form.logoUrl" :src="form.logoUrl" mode="aspectFill" class="media-preview" />
            <view v-else class="media-placeholder"><text>+ 选择 Logo</text></view>
            <text v-if="form.logoUrl" class="media-remove" @click.stop="removeMedia('logo')">✕</text>
          </view>
        </view>
        <view class="form-item" v-if="isFieldVisible('favicon')">
          <text class="form-label">Favicon</text>
          <view class="media-select" @click="openMediaPicker('favicon')">
            <image v-if="form.faviconUrl" :src="form.faviconUrl" mode="aspectFill" class="media-preview" />
            <view v-else class="media-placeholder"><text>+ 选择图标</text></view>
            <text v-if="form.faviconUrl" class="media-remove" @click.stop="removeMedia('favicon')">✕</text>
          </view>
        </view>
        <view class="form-item" v-if="isFieldVisible('icpNumber')">
          <text class="form-label">备案号</text>
          <input v-model="form.icpNumber" class="form-input" placeholder="如：京ICP备xxxxxxxx号" :disabled="!isFieldEditable('icpNumber')" />
        </view>
        <view class="form-item" v-if="isFieldVisible('customerServiceUrl')">
          <text class="form-label">客服链接</text>
          <input v-model="form.customerServiceUrl" class="form-input" placeholder="如：https://work.weixin.qq.com/..." :disabled="!isFieldEditable('customerServiceUrl')" />
        </view>
      </view>

      <!-- SEO 设置 -->
      <view class="form-section-title">SEO 设置</view>
      <view class="form-card">
        <view class="form-item" v-if="isFieldVisible('seoKeywords')">
          <text class="form-label">SEO 关键词</text>
          <input v-model="form.seoKeywords" class="form-input" placeholder="多个关键词用逗号分隔" :disabled="!isFieldEditable('seoKeywords')" />
        </view>
        <view class="form-item" v-if="isFieldVisible('seoDescription')">
          <text class="form-label">SEO 描述</text>
          <textarea v-model="form.seoDescription" class="form-textarea" placeholder="搜索引擎展示的描述文字" :disabled="!isFieldEditable('seoDescription')" />
        </view>
      </view>

      <!-- 地图服务 -->
      <view class="form-section-title">地图服务</view>
      <view class="form-card">
        <view class="form-item" v-if="isFieldVisible('tencentMapKey')">
          <text class="form-label">腾讯地图 Key</text>
          <input v-model="form.tencentMapKey" class="form-input" placeholder="腾讯位置服务 Key" :disabled="!isFieldEditable('tencentMapKey')" />
        </view>
      </view>

      <!-- 分享设置 -->
      <view class="form-section-title">分享设置</view>
      <view class="form-card">
        <view class="form-item" v-if="isFieldVisible('shareTitle')">
          <text class="form-label">分享标题</text>
          <input v-model="form.shareTitle" class="form-input" placeholder="转发朋友圈时的标题" :disabled="!isFieldEditable('shareTitle')" />
        </view>
        <view class="form-item" v-if="isFieldVisible('shareDescription')">
          <text class="form-label">分享描述</text>
          <input v-model="form.shareDescription" class="form-input" placeholder="转发朋友圈时的描述" :disabled="!isFieldEditable('shareDescription')" />
        </view>
        <view class="form-item" v-if="isFieldVisible('shareImage')">
          <text class="form-label">分享封面图</text>
          <view class="media-select" @click="openMediaPicker('shareImage')">
            <image v-if="form.shareImageUrl" :src="form.shareImageUrl" mode="aspectFill" class="media-preview" />
            <view v-else class="media-placeholder"><text>+ 选择封面</text></view>
            <text v-if="form.shareImageUrl" class="media-remove" @click.stop="removeMedia('shareImage')">✕</text>
          </view>
        </view>
        <view class="form-item" v-if="isFieldVisible('sharePath')">
          <text class="form-label">分享路径</text>
          <input v-model="form.sharePath" class="form-input" placeholder="如：/pages/index/index" :disabled="!isFieldEditable('sharePath')" />
        </view>
      </view>

      <!-- 认证配置 -->
      <view class="form-section-title">认证配置</view>
      <view class="form-card">
        <view class="form-item" v-if="isFieldVisible('authMode')">
          <text class="form-label">认证模式</text>
          <picker v-if="isFieldEditable('authMode')" mode="selector" :range="authModeLabels" @change="onAuthModeChange" :value="authModeIndex">
            <view class="form-picker">{{ authModeLabels[authModeIndex] }} ▼</view>
          </picker>
          <view v-else class="form-picker disabled">{{ authModeLabels[authModeIndex] }} 🔒</view>
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('registerEnabled')">
          <text class="form-label">开放注册</text>
          <switch :checked="form.registerEnabled" @change="form.registerEnabled = $event.detail.value" :disabled="!isFieldEditable('registerEnabled')" color="#07c160" />
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('inviteCodeRequired')">
          <text class="form-label">注册需邀请码</text>
          <switch :checked="form.inviteCodeRequired" @change="form.inviteCodeRequired = $event.detail.value" :disabled="!isFieldEditable('inviteCodeRequired')" color="#07c160" />
        </view>
        <!-- SSO登录地址 -->
        <view class="form-item" v-if="isFieldVisible('ssoLoginUrl')">
          <text class="form-label">SSO登录地址</text>
          <input v-model="form.ssoLoginUrl" class="form-input" placeholder="如 https://sso.example.com/login" :disabled="!isFieldEditable('ssoLoginUrl')" />
          <text class="form-hint">SSO登录页面URL，启用SSO后必填</text>
        </view>
        <!-- 微信小程序登录 -->
        <view class="form-item switch-item" v-if="isFieldVisible('wechatMiniProgramEnabled')">
          <view>
            <text class="form-label">微信小程序登录</text>
            <text class="form-hint">需先在第三方配置中设置AppID</text>
          </view>
          <switch :checked="form.wechatMiniProgramEnabled" @change="form.wechatMiniProgramEnabled = $event.detail.value" :disabled="!isFieldEditable('wechatMiniProgramEnabled')" color="#07c160" />
        </view>
        <!-- 微信公众号登录 -->
        <view class="form-item switch-item" v-if="isFieldVisible('wechatOfficialAccountEnabled')">
          <view>
            <text class="form-label">微信公众号登录</text>
            <text class="form-hint">需先在第三方配置中设置AppID</text>
          </view>
          <switch :checked="form.wechatOfficialAccountEnabled" @change="form.wechatOfficialAccountEnabled = $event.detail.value" :disabled="!isFieldEditable('wechatOfficialAccountEnabled')" color="#07c160" />
        </view>
        <!-- 支付宝登录 -->
        <view class="form-item switch-item" v-if="isFieldVisible('alipayEnabled')">
          <view>
            <text class="form-label">支付宝登录</text>
            <text class="form-hint">需先在第三方配置中设置AppID</text>
          </view>
          <switch :checked="form.alipayEnabled" @change="form.alipayEnabled = $event.detail.value" :disabled="!isFieldEditable('alipayEnabled')" color="#07c160" />
        </view>
        <!-- 抖音登录 -->
        <view class="form-item switch-item" v-if="isFieldVisible('douyinEnabled')">
          <view>
            <text class="form-label">抖音登录</text>
            <text class="form-hint">需先在第三方配置中设置AppID</text>
          </view>
          <switch :checked="form.douyinEnabled" @change="form.douyinEnabled = $event.detail.value" :disabled="!isFieldEditable('douyinEnabled')" color="#07c160" />
        </view>
        <!-- 微信开放平台 -->
        <view class="form-item switch-item" v-if="isFieldVisible('wechatOpenPlatformEnabled')">
          <view>
            <text class="form-label">微信开放平台</text>
            <text class="form-hint">需先在第三方配置中设置AppID</text>
          </view>
          <switch :checked="form.wechatOpenPlatformEnabled" @change="form.wechatOpenPlatformEnabled = $event.detail.value" :disabled="!isFieldEditable('wechatOpenPlatformEnabled')" color="#07c160" />
        </view>
        <!-- 密码最小长度 -->
        <view class="form-item" v-if="isFieldVisible('passwordMinLength')">
          <text class="form-label">密码最小长度</text>
          <input type="number" v-model="form.passwordMinLength" class="form-input" :disabled="!isFieldEditable('passwordMinLength')" placeholder="建议6-12" />
          <text class="form-hint">密码最小长度，建议6-12</text>
        </view>
        <!-- 密码复杂度要求 -->
        <view class="form-item switch-item" v-if="isFieldVisible('passwordRequireComplexity')">
          <view>
            <text class="form-label">密码复杂度要求</text>
            <text class="form-hint">要求密码包含大小写+数字+特殊字符</text>
          </view>
          <switch :checked="form.passwordRequireComplexity" @change="form.passwordRequireComplexity = $event.detail.value" :disabled="!isFieldEditable('passwordRequireComplexity')" color="#07c160" />
        </view>
      </view>

      <!-- 渠道配置 -->
      <view class="form-section-title">渠道配置</view>
      <view class="form-card">
        <view class="form-item switch-item">
          <view>
            <text class="form-label">跨渠道总开关</text>
            <text class="form-hint">由租户管理员配置，此处不可修改</text>
          </view>
          <view :class="['readonly-badge', form.channelUsage !== 'site_only' ? 'enabled' : 'disabled']">
            {{ form.channelUsage !== 'site_only' ? '已开启' : '已关闭' }}
          </view>
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('allowCrossChannel')">
          <text class="form-label">跨渠道访问</text>
          <switch :checked="form.allowCrossChannel" @change="form.allowCrossChannel = $event.detail.value" :disabled="!isFieldEditable('allowCrossChannel') || form.channelUsage === 'site_only'" color="#07c160" />
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('allowCrossChannelPublish')">
          <view>
            <text class="form-label">允许发布跨渠道课程</text>
            <text class="form-hint">关闭后，课程发布时只能选择指定渠道，无法标记为全部渠道</text>
          </view>
          <switch :checked="form.allowCrossChannelPublish" @change="form.allowCrossChannelPublish = $event.detail.value" :disabled="!isFieldEditable('allowCrossChannelPublish') || form.channelUsage === 'site_only'" color="#07c160" />
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('channelInviteEnabled')">
          <text class="form-label">渠道邀请</text>
          <switch :checked="form.channelInviteEnabled" @change="form.channelInviteEnabled = $event.detail.value" :disabled="!isFieldEditable('channelInviteEnabled')" color="#07c160" />
        </view>
        <view class="form-item" v-if="isFieldVisible('defaultChannelScope')">
          <text class="form-label">默认渠道范围</text>
          <picker v-if="isFieldEditable('defaultChannelScope')" mode="selector" :range="channelScopeLabels" @change="onChannelScopeChange" :value="channelScopeIndex">
            <view class="form-picker">{{ channelScopeLabels[channelScopeIndex] }} ▼</view>
          </picker>
          <view v-else class="form-picker disabled">{{ channelScopeLabels[channelScopeIndex] }} 🔒</view>
        </view>
      </view>

      <!-- 积分配置 -->
      <view class="form-section-title">积分配置</view>
      <view class="form-card">
        <view class="form-item" v-if="isFieldVisible('signInPoints')">
          <text class="form-label">签到积分</text>
          <input type="number" v-model="form.signInPoints" class="form-input" :disabled="!isFieldEditable('signInPoints')" placeholder="每日签到获得积分" />
        </view>
        <view class="form-item" v-if="isFieldVisible('maxPointsPerDay')">
          <text class="form-label">每日上限</text>
          <input type="number" v-model="form.maxPointsPerDay" class="form-input" :disabled="!isFieldEditable('maxPointsPerDay')" placeholder="每日获取积分上限（0=不限）" />
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('redemptionEnabled')">
          <text class="form-label">积分兑换</text>
          <switch :checked="form.redemptionEnabled" @change="form.redemptionEnabled = $event.detail.value" :disabled="!isFieldEditable('redemptionEnabled')" color="#07c160" />
        </view>
        <!-- 积分过期天数 -->
        <view class="form-item" v-if="isFieldVisible('pointsExpireDays')">
          <text class="form-label">积分过期天数</text>
          <input type="number" v-model="form.pointsExpireDays" class="form-input" :disabled="!isFieldEditable('pointsExpireDays')" placeholder="0=永不过期" />
          <text class="form-hint">积分过期天数，0=永不过期</text>
        </view>
        <!-- 最低兑换门槛 -->
        <view class="form-item" v-if="isFieldVisible('pointsMinRedemption')">
          <text class="form-label">最低兑换门槛</text>
          <input type="number" v-model="form.pointsMinRedemption" class="form-input" :disabled="!isFieldEditable('pointsMinRedemption')" placeholder="最低兑换积分" />
          <text class="form-hint">最低兑换积分门槛</text>
        </view>
        <!-- 积分规则引擎 -->
        <view class="form-item switch-item" v-if="isFieldVisible('pointsRuleEnabled')">
          <view>
            <text class="form-label">积分规则引擎</text>
            <text class="form-hint">是否启用积分规则引擎</text>
          </view>
          <switch :checked="form.pointsRuleEnabled" @change="form.pointsRuleEnabled = $event.detail.value" :disabled="!isFieldEditable('pointsRuleEnabled')" color="#07c160" />
        </view>
      </view>

      <!-- 课程配置 -->
      <view class="form-section-title">课程配置</view>
      <view class="form-card">
        <view class="form-item switch-item" v-if="isFieldVisible('coursePreviewEnabled')">
          <text class="form-label">课程预览</text>
          <switch :checked="form.coursePreviewEnabled" @change="form.coursePreviewEnabled = $event.detail.value" :disabled="!isFieldEditable('coursePreviewEnabled')" color="#07c160" />
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('lessonProgressEnabled')">
          <text class="form-label">课时进度</text>
          <switch :checked="form.lessonProgressEnabled" @change="form.lessonProgressEnabled = $event.detail.value" :disabled="!isFieldEditable('lessonProgressEnabled')" color="#07c160" />
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('courseEnrollEnabled')">
          <text class="form-label">课程报名</text>
          <switch :checked="form.courseEnrollEnabled" @change="form.courseEnrollEnabled = $event.detail.value" :disabled="!isFieldEditable('courseEnrollEnabled')" color="#07c160" />
        </view>
        <!-- 课程评论 -->
        <view class="form-item switch-item" v-if="isFieldVisible('courseCommentEnabled')">
          <view>
            <text class="form-label">课程评论</text>
            <text class="form-hint">是否开放课程评论</text>
          </view>
          <switch :checked="form.courseCommentEnabled" @change="form.courseCommentEnabled = $event.detail.value" :disabled="!isFieldEditable('courseCommentEnabled')" color="#07c160" />
        </view>
        <!-- 课程评分 -->
        <view class="form-item switch-item" v-if="isFieldVisible('courseRatingEnabled')">
          <view>
            <text class="form-label">课程评分</text>
            <text class="form-hint">是否开放课程评分</text>
          </view>
          <switch :checked="form.courseRatingEnabled" @change="form.courseRatingEnabled = $event.detail.value" :disabled="!isFieldEditable('courseRatingEnabled')" color="#07c160" />
        </view>
      </view>

      <!-- 用户设置 -->
      <view class="form-section-title">用户设置</view>
      <view class="form-card">
        <view class="form-item switch-item" v-if="isFieldVisible('userAvatarRequired')">
          <view>
            <text class="form-label">头像必填</text>
            <text class="form-hint">注册时头像是否必填</text>
          </view>
          <switch :checked="form.userAvatarRequired" @change="form.userAvatarRequired = $event.detail.value" :disabled="!isFieldEditable('userAvatarRequired')" color="#07c160" />
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('userPhoneRequired')">
          <view>
            <text class="form-label">手机号必填</text>
            <text class="form-hint">注册时手机号是否必填</text>
          </view>
          <switch :checked="form.userPhoneRequired" @change="form.userPhoneRequired = $event.detail.value" :disabled="!isFieldEditable('userPhoneRequired')" color="#07c160" />
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('userEmailRequired')">
          <view>
            <text class="form-label">邮箱必填</text>
            <text class="form-hint">注册时邮箱是否必填</text>
          </view>
          <switch :checked="form.userEmailRequired" @change="form.userEmailRequired = $event.detail.value" :disabled="!isFieldEditable('userEmailRequired')" color="#07c160" />
        </view>
      </view>

      <!-- 支付与通知 -->
      <view class="form-section-title">支付与通知</view>
      <view class="form-card">
        <view class="form-item switch-item" v-if="isFieldVisible('paymentEnabled')">
          <view>
            <text class="form-label">在线支付</text>
            <text class="form-hint">是否启用在线支付</text>
          </view>
          <switch :checked="form.paymentEnabled" @change="form.paymentEnabled = $event.detail.value" :disabled="!isFieldEditable('paymentEnabled')" color="#07c160" />
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('smsEnabled')">
          <view>
            <text class="form-label">短信通知</text>
            <text class="form-hint">是否启用短信通知</text>
          </view>
          <switch :checked="form.smsEnabled" @change="form.smsEnabled = $event.detail.value" :disabled="!isFieldEditable('smsEnabled')" color="#07c160" />
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('emailEnabled')">
          <view>
            <text class="form-label">邮件通知</text>
            <text class="form-hint">是否启用邮件通知</text>
          </view>
          <switch :checked="form.emailEnabled" @change="form.emailEnabled = $event.detail.value" :disabled="!isFieldEditable('emailEnabled')" color="#07c160" />
        </view>
      </view>

      <!-- 安全设置 -->
      <view class="form-section-title">安全设置</view>
      <view class="form-card">
        <view class="form-item switch-item" v-if="isFieldVisible('captchaEnabled')">
          <view>
            <text class="form-label">验证码</text>
            <text class="form-hint">是否启用验证码</text>
          </view>
          <switch :checked="form.captchaEnabled" @change="form.captchaEnabled = $event.detail.value" :disabled="!isFieldEditable('captchaEnabled')" color="#07c160" />
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('rateLimitEnabled')">
          <view>
            <text class="form-label">接口限流</text>
            <text class="form-hint">是否启用接口限流</text>
          </view>
          <switch :checked="form.rateLimitEnabled" @change="form.rateLimitEnabled = $event.detail.value" :disabled="!isFieldEditable('rateLimitEnabled')" color="#07c160" />
        </view>
        <view class="form-item" v-if="isFieldVisible('loginAttemptLimit')">
          <text class="form-label">登录失败锁定阈值</text>
          <input type="number" v-model="form.loginAttemptLimit" class="form-input" :disabled="!isFieldEditable('loginAttemptLimit')" placeholder="建议5次" />
          <text class="form-hint">连续登录失败多少次后锁定，建议5次</text>
        </view>
        <view class="form-item" v-if="isFieldVisible('loginLockDuration')">
          <text class="form-label">登录锁定时长(分钟)</text>
          <input type="number" v-model="form.loginLockDuration" class="form-input" :disabled="!isFieldEditable('loginLockDuration')" placeholder="建议30" />
          <text class="form-hint">登录锁定时长(分钟)，建议30</text>
        </view>
        <view class="form-item" v-if="isFieldVisible('sessionTimeout')">
          <text class="form-label">会话超时(分钟)</text>
          <input type="number" v-model="form.sessionTimeout" class="form-input" :disabled="!isFieldEditable('sessionTimeout')" placeholder="建议120" />
          <text class="form-hint">会话超时时间(分钟)，建议120</text>
        </view>
      </view>

      <!-- 维护模式 -->
      <view class="form-section-title">维护模式</view>
      <view class="form-card">
        <view class="form-item switch-item" v-if="isFieldVisible('maintenanceMode')">
          <view>
            <text class="form-label">维护模式</text>
            <text class="form-hint">开启后C端显示维护页面</text>
          </view>
          <switch :checked="form.maintenanceMode" @change="form.maintenanceMode = $event.detail.value" :disabled="!isFieldEditable('maintenanceMode')" color="#ff4d4f" />
        </view>
        <view class="form-item switch-item" v-if="isFieldVisible('debugMode')">
          <view>
            <text class="form-label">调试模式</text>
            <text class="form-hint">开启后输出详细日志</text>
          </view>
          <switch :checked="form.debugMode" @change="form.debugMode = $event.detail.value" :disabled="!isFieldEditable('debugMode')" color="#ff9800" />
        </view>
      </view>

      <view style="height: 120rpx;"></view>
    </scroll-view>

    <view class="bottom-bar">
      <button class="btn-save" @click="handleSave" :loading="saving" :disabled="saving || loading">保存配置</button>
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
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getSiteConfig, updateSiteConfig } from '../../src/api/config.js'
import { getAdminChannelList } from '../../src/api/channel.js'
import { put } from '../../src/utils/request.js'
import { getMediaUrl } from '../../src/utils/format.js'
import PageHeader from '../../src/components/PageHeader.vue'
import MediaPicker from '../../src/components/MediaPicker.vue'

const saving = ref(false)
const loading = ref(false)
const showMediaPicker = ref(false)
const mediaPickerTarget = ref('logo')

// 配置作用域：tenant=租户级，channel=渠道级
const scope = ref('tenant')
const channelList = ref([])
const currentChannel = ref(null)

async function loadChannels() {
  try {
    const result = await getAdminChannelList()
    channelList.value = result?.list || (Array.isArray(result) ? result : [])
  } catch (e) {
    // request.js 已处理错误展示
  }
}

function onScopeChange(e) {
  scope.value = e.detail.value
  if (scope.value === 'channel' && channelList.value.length === 0) {
    loadChannels()
  }
}

function onChannelChange(e) {
  currentChannel.value = channelList.value[e.detail.value]
}

// 模板约束
const fieldConstraints = ref({})
const templateName = ref('')

// 判断字段是否可见
function isFieldVisible(key) {
  const c = fieldConstraints.value[key]
  return !c || c.visible !== false
}

// 判断字段是否可编辑
function isFieldEditable(key) {
  const c = fieldConstraints.value[key]
  return !c || c.editable !== false
}

function goToTemplate() {
  uni.navigateTo({ url: '/pages/settings/site-template' })
}

const authModes = ['local', 'third', 'sso']
const authModeLabels = ['本地认证', '三方认证', 'SSO认证']
const authModeIndex = ref(0)

const channelScopes = ['all', 'own', 'invited']
const channelScopeLabels = ['全部渠道', '仅自己渠道', '受邀渠道']
const channelScopeIndex = ref(0)

const form = ref({
  siteName: '',
  siteDescription: '',
  logoId: null,
  logoUrl: '',
  faviconId: null,
  faviconUrl: '',
  icpNumber: '',
  customerServiceUrl: '',
  seoKeywords: '',
  seoDescription: '',
  tencentMapKey: '',
  shareTitle: '',
  shareDescription: '',
  shareImageId: null,
  shareImageUrl: '',
  sharePath: '/pages/index/index',
  authMode: 'local',
  registerEnabled: true,
  inviteCodeRequired: false,
  allowCrossChannel: false,
  allowCrossChannelPublish: false,
  channelUsage: 'site_cross_user',
  channelInviteEnabled: true,
  defaultChannelScope: 'all',
  signInPoints: 10,
  maxPointsPerDay: 0,
  redemptionEnabled: true,
  coursePreviewEnabled: true,
  lessonProgressEnabled: true,
  courseEnrollEnabled: true,
  ssoLoginUrl: '',
  wechatMiniProgramEnabled: false,
  wechatOfficialAccountEnabled: false,
  wechatOpenPlatformEnabled: false,
  alipayEnabled: false,
  douyinEnabled: false,
  passwordMinLength: 6,
  passwordRequireComplexity: false,
  pointsExpireDays: 0,
  pointsMinRedemption: 100,
  pointsRuleEnabled: true,
  courseCommentEnabled: false,
  courseRatingEnabled: false,
  userAvatarRequired: false,
  userPhoneRequired: true,
  userEmailRequired: false,
  paymentEnabled: false,
  smsEnabled: false,
  emailEnabled: false,
  captchaEnabled: false,
  rateLimitEnabled: true,
  loginAttemptLimit: 5,
  loginLockDuration: 30,
  sessionTimeout: 120,
  maintenanceMode: false,
  debugMode: false,
})

function onAuthModeChange(e) {
  authModeIndex.value = e.detail.value
  form.value.authMode = authModes[authModeIndex.value]
}
function onChannelScopeChange(e) {
  channelScopeIndex.value = e.detail.value
  form.value.defaultChannelScope = channelScopes[channelScopeIndex.value]
}

function openMediaPicker(target) {
  if (!isFieldEditable(target)) return
  mediaPickerTarget.value = target
  showMediaPicker.value = true
}

function onMediaSelected(file) {
  const t = mediaPickerTarget.value
  if (t === 'logo') { form.value.logoId = file.id; form.value.logoUrl = file.url }
  else if (t === 'favicon') { form.value.faviconId = file.id; form.value.faviconUrl = file.url }
  else if (t === 'shareImage') { form.value.shareImageId = file.id; form.value.shareImageUrl = file.url }
  showMediaPicker.value = false
}

function removeMedia(target) {
  if (!isFieldEditable(target)) return
  if (target === 'logo') { form.value.logoId = null; form.value.logoUrl = '' }
  else if (target === 'favicon') { form.value.faviconId = null; form.value.faviconUrl = '' }
  else if (target === 'shareImage') { form.value.shareImageId = null; form.value.shareImageUrl = '' }
}

async function loadConfig() {
  loading.value = true
  try {
    const data = await getSiteConfig()
    if (data) {
      form.value = {
        siteName: data.siteName ?? '',
        siteDescription: data.siteDescription ?? '',
        logoId: data.logo?.id ?? null,
        logoUrl: data.logo ? getMediaUrl(data.logo) : '',
        faviconId: data.favicon?.id ?? null,
        faviconUrl: data.favicon ? getMediaUrl(data.favicon) : '',
        icpNumber: data.icpNumber ?? '',
        customerServiceUrl: data.customerServiceUrl ?? '',
        seoKeywords: data.seoKeywords ?? '',
        seoDescription: data.seoDescription ?? '',
        tencentMapKey: data.tencentMapKey ?? '',
        shareTitle: data.shareTitle ?? '',
        shareDescription: data.shareDescription ?? '',
        shareImageId: data.shareImage?.id ?? null,
        shareImageUrl: data.shareImage ? getMediaUrl(data.shareImage) : '',
        sharePath: data.sharePath ?? '/pages/index/index',
        authMode: data.authMode ?? 'local',
        registerEnabled: data.registerEnabled ?? true,
        inviteCodeRequired: data.inviteCodeRequired ?? false,
        allowCrossChannel: data.allowCrossChannel ?? false,
        channelUsage: data.channelUsage ?? 'site_cross_user',
        channelInviteEnabled: data.channelInviteEnabled ?? true,
        defaultChannelScope: data.defaultChannelScope ?? 'all',
        signInPoints: data.signInPoints ?? 10,
        maxPointsPerDay: data.maxPointsPerDay ?? 0,
        redemptionEnabled: data.redemptionEnabled ?? true,
        coursePreviewEnabled: data.coursePreviewEnabled ?? true,
        lessonProgressEnabled: data.lessonProgressEnabled ?? true,
        courseEnrollEnabled: data.courseEnrollEnabled ?? true,
        ssoLoginUrl: data.ssoLoginUrl ?? '',
        wechatMiniProgramEnabled: data.wechatMiniProgramEnabled ?? false,
        wechatOfficialAccountEnabled: data.wechatOfficialAccountEnabled ?? false,
        wechatOpenPlatformEnabled: data.wechatOpenPlatformEnabled ?? false,
        alipayEnabled: data.alipayEnabled ?? false,
        douyinEnabled: data.douyinEnabled ?? false,
        passwordMinLength: data.passwordMinLength ?? 6,
        passwordRequireComplexity: data.passwordRequireComplexity ?? false,
        pointsExpireDays: data.pointsExpireDays ?? 0,
        pointsMinRedemption: data.pointsMinRedemption ?? 100,
        pointsRuleEnabled: data.pointsRuleEnabled ?? true,
        courseCommentEnabled: data.courseCommentEnabled ?? false,
        courseRatingEnabled: data.courseRatingEnabled ?? false,
        userAvatarRequired: data.userAvatarRequired ?? false,
        userPhoneRequired: data.userPhoneRequired ?? true,
        userEmailRequired: data.userEmailRequired ?? false,
        paymentEnabled: data.paymentEnabled ?? false,
        smsEnabled: data.smsEnabled ?? false,
        emailEnabled: data.emailEnabled ?? false,
        captchaEnabled: data.captchaEnabled ?? false,
        rateLimitEnabled: data.rateLimitEnabled ?? true,
        loginAttemptLimit: data.loginAttemptLimit ?? 5,
        loginLockDuration: data.loginLockDuration ?? 30,
        sessionTimeout: data.sessionTimeout ?? 120,
        maintenanceMode: data.maintenanceMode ?? false,
        debugMode: data.debugMode ?? false,
      }
      authModeIndex.value = Math.max(0, authModes.indexOf(form.value.authMode))
      channelScopeIndex.value = Math.max(0, channelScopes.indexOf(form.value.defaultChannelScope))
    }
    // 保存模板约束
    if (data?._meta?.fieldConstraints) {
      fieldConstraints.value = data._meta.fieldConstraints
    } else {
      fieldConstraints.value = {}
    }
    // 保存模板名称
    if (data?._meta?.templateName) {
      templateName.value = data._meta.templateName
    } else {
      templateName.value = ''
    }
  } catch (e) {
    // request.js 已处理错误展示
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (saving.value) return
  // 渠道级配置：只保存 extraConfig 到指定渠道
  if (scope.value === 'channel') {
    if (!currentChannel.value?.id) {
      uni.showToast({ title: '请选择渠道', icon: 'none' })
      return
    }
    saving.value = true
    try {
      await put(`/zhao-channel/v1/admin/channels/${currentChannel.value.id}/config`, {
        data: { extraConfig: form.value }
      })
      uni.showToast({ title: '保存成功', icon: 'success' })
    } catch (e) {
      // request.js 已处理错误展示
    } finally {
      saving.value = false
    }
    return
  }
  // 租户级配置：原保存逻辑
  saving.value = true
  try {
    const data = {
      siteName: form.value.siteName ?? undefined,
      siteDescription: form.value.siteDescription ?? undefined,
      logo: form.value.logoId,
      favicon: form.value.faviconId,
      icpNumber: form.value.icpNumber ?? undefined,
      customerServiceUrl: form.value.customerServiceUrl ?? undefined,
      seoKeywords: form.value.seoKeywords ?? undefined,
      seoDescription: form.value.seoDescription ?? undefined,
      tencentMapKey: form.value.tencentMapKey ?? undefined,
      shareTitle: form.value.shareTitle ?? undefined,
      shareDescription: form.value.shareDescription ?? undefined,
      shareImage: form.value.shareImageId,
      sharePath: form.value.sharePath ?? undefined,
      authMode: form.value.authMode ?? undefined,
      registerEnabled: form.value.registerEnabled,
      inviteCodeRequired: form.value.inviteCodeRequired,
      allowCrossChannel: form.value.allowCrossChannel,
      channelInviteEnabled: form.value.channelInviteEnabled,
      defaultChannelScope: form.value.defaultChannelScope ?? undefined,
      signInPoints: (form.value.signInPoints === '' || form.value.signInPoints == null) ? 10 : Number(form.value.signInPoints),
      maxPointsPerDay: (form.value.maxPointsPerDay === '' || form.value.maxPointsPerDay == null) ? 0 : Number(form.value.maxPointsPerDay),
      redemptionEnabled: form.value.redemptionEnabled,
      coursePreviewEnabled: form.value.coursePreviewEnabled,
      lessonProgressEnabled: form.value.lessonProgressEnabled,
      courseEnrollEnabled: form.value.courseEnrollEnabled,
      ssoLoginUrl: form.value.ssoLoginUrl ?? undefined,
      wechatMiniProgramEnabled: form.value.wechatMiniProgramEnabled,
      wechatOfficialAccountEnabled: form.value.wechatOfficialAccountEnabled,
      wechatOpenPlatformEnabled: form.value.wechatOpenPlatformEnabled,
      alipayEnabled: form.value.alipayEnabled,
      douyinEnabled: form.value.douyinEnabled,
      passwordMinLength: (form.value.passwordMinLength === '' || form.value.passwordMinLength == null) ? 6 : Number(form.value.passwordMinLength),
      passwordRequireComplexity: form.value.passwordRequireComplexity,
      pointsExpireDays: (form.value.pointsExpireDays === '' || form.value.pointsExpireDays == null) ? 0 : Number(form.value.pointsExpireDays),
      pointsMinRedemption: (form.value.pointsMinRedemption === '' || form.value.pointsMinRedemption == null) ? 100 : Number(form.value.pointsMinRedemption),
      pointsRuleEnabled: form.value.pointsRuleEnabled,
      courseCommentEnabled: form.value.courseCommentEnabled,
      courseRatingEnabled: form.value.courseRatingEnabled,
      userAvatarRequired: form.value.userAvatarRequired,
      userPhoneRequired: form.value.userPhoneRequired,
      userEmailRequired: form.value.userEmailRequired,
      paymentEnabled: form.value.paymentEnabled,
      smsEnabled: form.value.smsEnabled,
      emailEnabled: form.value.emailEnabled,
      captchaEnabled: form.value.captchaEnabled,
      rateLimitEnabled: form.value.rateLimitEnabled,
      loginAttemptLimit: (form.value.loginAttemptLimit === '' || form.value.loginAttemptLimit == null) ? 5 : Number(form.value.loginAttemptLimit),
      loginLockDuration: (form.value.loginLockDuration === '' || form.value.loginLockDuration == null) ? 30 : Number(form.value.loginLockDuration),
      sessionTimeout: (form.value.sessionTimeout === '' || form.value.sessionTimeout == null) ? 120 : Number(form.value.sessionTimeout),
      maintenanceMode: form.value.maintenanceMode,
      debugMode: form.value.debugMode,
    }
    await updateSiteConfig(data)
    uni.showToast({ title: '保存成功', icon: 'success' })
    await loadConfig()
  } catch (e) {
    // request.js 已处理错误展示
  } finally {
    saving.value = false
  }
}

onShow(() => {
  loadConfig()
  loadChannels()
})
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding-bottom: 120rpx; box-sizing: border-box; }

.config-body { padding: 20rpx; }

.loading-bar { padding: 16rpx 24rpx; background: #e6f7ff; text-align: center; font-size: 26rpx; color: #1890ff; }

.scope-selector {
  background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 20rpx;
}
.scope-label { font-size: 28rpx; color: #333; font-weight: bold; margin-bottom: 12rpx; display: block; }
.scope-radio-group { display: flex; flex-direction: row; align-items: center; }
.scope-radio-item { font-size: 28rpx; color: #333; margin-right: 40rpx; display: flex; align-items: center; }
.channel-picker { margin-top: 16rpx; }

.template-info-bar {
  display: flex; justify-content: space-between; align-items: center;
  background: #e6f7ff; border-radius: 12rpx; padding: 20rpx 24rpx; margin-bottom: 20rpx;
}
.template-info-text { font-size: 26rpx; color: #1890ff; }
.template-info-link { font-size: 26rpx; color: #1890ff; text-decoration: underline; }

.form-section-title {
  font-size: 28rpx; font-weight: bold; color: #333;
  margin: 24rpx 0 16rpx; padding-bottom: 8rpx;
  border-bottom: 2rpx solid #667eea;
}

.form-card {
  background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 16rpx;
}

.readonly-badge {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  &.enabled {
    background: #f0f9eb;
    color: #67c23a;
  }
  &.disabled {
    background: #fef0f0;
    color: #f56c6c;
  }
}

.form-item { margin-bottom: 24rpx; }
.form-label { font-size: 28rpx; color: #333; margin-bottom: 10rpx; display: block; }
.form-hint {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
  display: block;
}

.form-input {
  width: 100%; height: 76rpx; background: #f5f5f5; border-radius: 8rpx;
  padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box;
}
.form-picker {
  width: 100%; height: 76rpx; background: #f5f5f5; border-radius: 8rpx;
  padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box;
  line-height: 76rpx; color: #333;
}
.form-textarea {
  width: 100%; min-height: 120rpx; background: #f5f5f5; border-radius: 8rpx;
  padding: 20rpx; font-size: 28rpx; box-sizing: border-box;
}
.switch-item {
  display: flex; justify-content: space-between; align-items: center;
}
.switch-item .form-label { margin-bottom: 0; }

.form-picker.disabled {
  color: #999; background: #eee; cursor: not-allowed;
}

.media-select {
  position: relative; width: 160rpx; height: 160rpx;
  border-radius: 8rpx; overflow: hidden; background: #f5f5f5;
}
.media-preview { width: 100%; height: 100%; }
.media-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 24rpx; color: #999; border: 2rpx dashed #ddd; border-radius: 8rpx; box-sizing: border-box;
}
.media-remove {
  position: absolute; top: 4rpx; right: 4rpx; width: 36rpx; height: 36rpx;
  background: rgba(0,0,0,0.5); color: #fff; border-radius: 50%;
  font-size: 22rpx; text-align: center; line-height: 36rpx;
}

.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 20rpx 30rpx; background: #fff;
  border-top: 1rpx solid #f0f0f0; z-index: 100;
}
.btn-save {
  width: 100%; height: 88rpx; line-height: 88rpx; text-align: center;
  background: #667eea; color: #fff; font-size: 30rpx; border-radius: 8rpx; border: none;
}
</style>
