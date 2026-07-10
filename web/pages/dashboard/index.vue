<template>
  <view class="dashboard">
    <view class="header">
      <view class="header-title">控制台</view>
      <TenantSwitcher v-if="userStore.tenantList && userStore.tenantList.length > 0" />
      <view class="header-user" @click="goProfile">
        <text>{{ userStore.userInfo?.username || '管理员' }}</text>
      </view>
    </view>
    
    <view class="stats-grid">
      <view class="stat-card" @click="navigateTo('/pages/channel/list')">
        <view class="stat-icon" style="background: #e3f2fd;">📢</view>
        <view class="stat-info">
          <view class="stat-value">{{ stats.channels }}</view>
          <view class="stat-label">渠道数量</view>
        </view>
      </view>
      
      <view class="stat-card" @click="navigateTo('/pages/course/list')">
        <view class="stat-icon" style="background: #e8f5e9;">📚</view>
        <view class="stat-info">
          <view class="stat-value">{{ stats.courses }}</view>
          <view class="stat-label">课程数量</view>
        </view>
      </view>
      
      <view class="stat-card" @click="navigateTo('/pages/quiz/list')">
        <view class="stat-icon" style="background: #fff3e0;">📝</view>
        <view class="stat-info">
          <view class="stat-value">{{ stats.questions }}</view>
          <view class="stat-label">题目数量</view>
        </view>
      </view>
      
      <view class="stat-card" v-if="pointsEnabled" @click="navigateTo('/pages/points/records')">
        <view class="stat-icon" style="background: #fce4ec;">💎</view>
        <view class="stat-info">
          <view class="stat-value">{{ stats.points }}</view>
          <view class="stat-label">积分记录</view>
        </view>
      </view>

      <view class="stat-card" @click="navigateTo('/pages/course/auth/list')">
        <view class="stat-icon" style="background: #e1f5fe;">🎓</view>
        <view class="stat-info">
          <view class="stat-value">{{ stats.students }}</view>
          <view class="stat-label">学员数</view>
        </view>
      </view>

      <view class="stat-card" @click="navigateTo('/pages/study/progress')">
        <view class="stat-icon" style="background: #e8eaf6;">✅</view>
        <view class="stat-info">
          <view class="stat-value">{{ stats.completedCourses }}</view>
          <view class="stat-label">课程完成数</view>
        </view>
      </view>

      <view class="stat-card" v-if="websiteEnabled" @click="navigateTo('/pages/website/article/list')">
        <view class="stat-icon" style="background: #ede7f6;">📄</view>
        <view class="stat-info">
          <view class="stat-value">{{ stats.articles }}</view>
          <view class="stat-label">资讯文章</view>
        </view>
      </view>

      <view class="stat-card" v-if="websiteEnabled" @click="navigateTo('/pages/website/product/list')">
        <view class="stat-icon" style="background: #e8eaf6;">📦</view>
        <view class="stat-info">
          <view class="stat-value">{{ stats.products }}</view>
          <view class="stat-label">产品方案</view>
        </view>
      </view>

      <view class="stat-card" v-if="websiteEnabled" @click="navigateTo('/pages/website/case/list')">
        <view class="stat-icon" style="background: #e0f7fa;">🏆</view>
        <view class="stat-info">
          <view class="stat-value">{{ stats.cases }}</view>
          <view class="stat-label">落地案例</view>
        </view>
      </view>

      <view class="stat-card" v-if="websiteEnabled" @click="navigateTo('/pages/website/lead/list')">
        <view class="stat-icon" style="background: #fce4ec;">📝</view>
        <view class="stat-info">
          <view class="stat-value">{{ stats.leads }}</view>
          <view class="stat-label">线索管理</view>
        </view>
      </view>
    </view>

    <!-- 课程状态分布 -->
    <view class="chart-section">
      <view class="section-title">📊 课程状态分布</view>
      <view class="bar-chart">
        <view v-for="item in courseStatusData" :key="item.status" class="bar-row">
          <text class="bar-label">{{ item.label }}</text>
          <view class="bar-track">
            <view class="bar-fill" :style="{ width: item.percent + '%', background: item.color }"></view>
          </view>
          <text class="bar-value">{{ item.count }}</text>
        </view>
      </view>
    </view>

    <!-- 近期学习动态 -->
    <view class="activity-section">
      <view class="section-title">📈 近期学习动态</view>
      <view v-if="recentProgress.length === 0" class="empty-tip">暂无学习动态</view>
      <view v-for="item in recentProgress" :key="item.documentId" class="activity-item">
        <view class="activity-main">
          <text class="activity-user">{{ item.username || '学员' }}</text>
          <text class="activity-course">{{ item.courseTitle || '未知课程' }}</text>
        </view>
        <view class="activity-meta">
          <text class="activity-progress">{{ item.progressPercent || 0 }}%</text>
          <text class="activity-time">{{ item.updatedAt || '' }}</text>
        </view>
      </view>
    </view>

    <!-- 官网中心 -->
    <view class="module-section" v-if="websiteEnabled && hasPermission('menu.website-center')">
      <view class="section-title">🌐 官网中心</view>
      <view class="module-grid">
        <view class="module-item" v-if="hasPermission('menu.website-seo')" @click="navigateTo('/pages/website/seo-config/edit')">
          <view class="module-icon">🔍</view>
          <view class="module-name">SEO 配置</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-brand')" @click="navigateTo('/pages/website/brand-info/edit')">
          <view class="module-icon">🏷️</view>
          <view class="module-name">品牌信息</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-article')" @click="navigateTo('/pages/website/article/list')">
          <view class="module-icon">📄</view>
          <view class="module-name">资讯文章</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-article-category')" @click="navigateTo('/pages/website/article-category/list')">
          <view class="module-icon">📂</view>
          <view class="module-name">文章分类</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-product')" @click="navigateTo('/pages/website/product/list')">
          <view class="module-icon">📦</view>
          <view class="module-name">产品方案</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-case')" @click="navigateTo('/pages/website/case/list')">
          <view class="module-icon">🏆</view>
          <view class="module-name">落地案例</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-compliance')" @click="navigateTo('/pages/website/compliance/list')">
          <view class="module-icon">📋</view>
          <view class="module-name">合规公示</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-faq')" @click="navigateTo('/pages/website/faq/list')">
          <view class="module-icon">❓</view>
          <view class="module-name">常见问答</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-tutorial')" @click="navigateTo('/pages/website/tutorial/list')">
          <view class="module-icon">📖</view>
          <view class="module-name">教程指南</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-download')" @click="navigateTo('/pages/website/download/list')">
          <view class="module-icon">💾</view>
          <view class="module-name">下载管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-lead')" @click="navigateTo('/pages/website/lead/list')">
          <view class="module-icon">📝</view>
          <view class="module-name">线索管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-visit-log')" @click="navigateTo('/pages/website/visit-log/list')">
          <view class="module-icon">👁️</view>
          <view class="module-name">访问日志</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-interaction')" @click="navigateTo('/pages/website/interaction/list')">
          <view class="module-icon">💬</view>
          <view class="module-name">互动记录</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-search-log')" @click="navigateTo('/pages/website/search-log/list')">
          <view class="module-icon">🔎</view>
          <view class="module-name">搜索日志</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-knowledge-entity')" @click="navigateTo('/pages/website/knowledge-entity/list')">
          <view class="module-icon">🧠</view>
          <view class="module-name">知识实体</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-knowledge-relation')" @click="navigateTo('/pages/website/knowledge-relation/list')">
          <view class="module-icon">🔗</view>
          <view class="module-name">知识关系</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-ai-summary')" @click="navigateTo('/pages/website/ai-summary/list')">
          <view class="module-icon">✨</view>
          <view class="module-name">AI 摘要</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.website-first-truth')" @click="navigateTo('/pages/website/first-truth/list')">
          <view class="module-icon">💎</view>
          <view class="module-name">第一真值</view>
        </view>
      </view>
    </view>

    <!-- 课程中心 -->
    <view class="module-section" v-if="hasPermission('menu.course-center')">
      <view class="section-title">📚 课程中心</view>
      <view class="module-grid">
        <view class="module-item" v-if="hasPermission('menu.course')" @click="navigateTo('/pages/course/list')">
          <view class="module-icon">📚</view>
          <view class="module-name">课程管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.lesson')" @click="navigateTo('/pages/course/lesson/list')">
          <view class="module-icon">🎬</view>
          <view class="module-name">课时管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.category')" @click="navigateTo('/pages/course/category/list')">
          <view class="module-icon">📂</view>
          <view class="module-name">课程分类</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.auth')" @click="navigateTo('/pages/course/auth/list')">
          <view class="module-icon">🔐</view>
          <view class="module-name">用户授权</view>
        </view>
      </view>
    </view>

    <!-- 学习数据 -->
    <view class="module-section" v-if="hasPermission('menu.study-center')">
      <view class="section-title">📈 学习数据</view>
      <view class="module-grid">
        <view class="module-item" v-if="hasPermission('menu.progress')" @click="navigateTo('/pages/study/progress')">
          <view class="module-icon">📈</view>
          <view class="module-name">课程进度</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.lesson-progress')" @click="navigateTo('/pages/study/lesson-progress')">
          <view class="module-icon">📊</view>
          <view class="module-name">课时进度</view>
        </view>
      </view>
    </view>

    <!-- 题库系统 -->
    <view class="module-section" v-if="hasPermission('menu.quiz-center')">
      <view class="section-title">📝 题库系统</view>
      <view class="module-grid">
        <view class="module-item" v-if="hasPermission('menu.quiz')" @click="navigateTo('/pages/quiz/list')">
          <view class="module-icon">📝</view>
          <view class="module-name">题库管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.exam')" @click="navigateTo('/pages/quiz/exam/list')">
          <view class="module-icon">📋</view>
          <view class="module-name">考试管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.quiz-record')" @click="navigateTo('/pages/quiz/record/list')">
          <view class="module-icon">📊</view>
          <view class="module-name">答题记录</view>
        </view>
      </view>
    </view>

    <!-- 积分体系 -->
    <view class="module-section" v-if="pointsEnabled && hasPermission('menu.point-center')">
      <view class="section-title">💎 积分体系</view>
      <view class="module-grid">
        <view class="module-item" v-if="hasPermission('menu.point-type')" @click="navigateTo('/pages/points/types')">
          <view class="module-icon">💎</view>
          <view class="module-name">积分类型</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.point-rule')" @click="navigateTo('/pages/points/rules')">
          <view class="module-icon">📋</view>
          <view class="module-name">积分规则</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.point-record')" @click="navigateTo('/pages/points/records')">
          <view class="module-icon">📊</view>
          <view class="module-name">积分记录</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.product')" @click="navigateTo('/pages/points/products')">
          <view class="module-icon">🎁</view>
          <view class="module-name">积分产品</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.exchange')" @click="navigateTo('/pages/points/exchanges')">
          <view class="module-icon">🔄</view>
          <view class="module-name">兑换记录</view>
        </view>
        <view class="module-item pickup-verify-entry" v-if="hasPermission('menu.exchange')" @click="navigateTo('/pages/points/pickup-verify')">
          <view class="module-icon">📱</view>
          <view class="module-name">扫码兑付</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.exchange')" @click="navigateTo('/pages/points/pickup-locations')">
          <view class="module-icon">📍</view>
          <view class="module-name">自提点管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.point-stat')" @click="navigateTo('/pages/points/statistics')">
          <view class="module-icon">📈</view>
          <view class="module-name">积分统计</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.point-config')" @click="navigateTo('/pages/points/config')">
          <view class="module-icon">⚙️</view>
          <view class="module-name">积分配置</view>
        </view>
      </view>
    </view>

    <!-- 标签体系 -->
    <view class="module-section" v-if="hasPermission('menu.tag-center')">
      <view class="section-title">🏷️ 标签体系</view>
      <view class="module-grid">
        <view class="module-item" v-if="hasPermission('menu.tag')" @click="navigateTo('/pages/tag/list')">
          <view class="module-icon">🏷️</view>
          <view class="module-name">标签管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.knowledge')" @click="navigateTo('/pages/tag/knowledge')">
          <view class="module-icon">🧠</view>
          <view class="module-name">知识点</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.tag-group')" @click="navigateTo('/pages/tag/groups')">
          <view class="module-icon">📂</view>
          <view class="module-name">分组管理</view>
        </view>
      </view>
    </view>

    <!-- 营销运营 -->
    <view class="module-section" v-if="hasPermission('menu.marketing-center')">
      <view class="section-title">📢 营销运营</view>
      <view class="module-grid">
        <view class="module-item" v-if="hasPermission('menu.channel')" @click="navigateTo('/pages/channel/list')">
          <view class="module-icon">📢</view>
          <view class="module-name">渠道管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.network')" @click="navigateTo('/pages/channel/network')">
          <view class="module-icon">🌳</view>
          <view class="module-name">渠道网络</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.members')" @click="navigateTo('/pages/channel/members')">
          <view class="module-icon">👥</view>
          <view class="module-name">成员管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.invite')" @click="navigateTo('/pages/distribution/invites')">
          <view class="module-icon">🤝</view>
          <view class="module-name">分销邀请</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.redemption-code')" @click="navigateTo('/pages/redemption/codes')">
          <view class="module-icon">🎫</view>
          <view class="module-name">兑换码</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.redemption-record')" @click="navigateTo('/pages/redemption/records')">
          <view class="module-icon">📜</view>
          <view class="module-name">兑换记录</view>
        </view>
      </view>
    </view>

    <!-- 系统工具 -->
    <view class="module-section" v-if="hasPermission('menu.system-center')">
      <view class="section-title">🔧 系统工具</view>
      <view class="module-grid">
        <view class="module-item" v-if="hasPermission('menu.media')" @click="navigateTo('/pages/media/list')">
          <view class="module-icon">🖼️</view>
          <view class="module-name">媒体资源</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.system-center')" @click="navigateTo('/pages/third/config-list')">
          <view class="module-icon">🔑</view>
          <view class="module-name">三方配置</view>
        </view>
        <view class="module-item" v-if="hasPermission('oss.dashboard')" @click="navigateTo('/pages/oss/dashboard')">
          <view class="module-icon">☁️</view>
          <view class="module-name">OSS管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('third-party-account.read')" @click="navigateTo('/pages/third/accounts')">
          <view class="module-icon">🌐</view>
          <view class="module-name">第三方用户</view>
        </view>
      </view>
    </view>

    <!-- 多租户管理 -->
    <view class="module-section" v-if="hasPermission('menu.tenant')">
      <view class="section-title">🏢 多租户管理</view>
      <view class="module-grid">
        <view class="module-item" @click="navigateTo('/pages/tenant/list')">
          <view class="module-icon">🏢</view>
          <view class="module-name">租户管理</view>
        </view>
        <view class="module-item" @click="navigateTo('/pages/tenant/detail')">
          <view class="module-icon">➕</view>
          <view class="module-name">新建租户</view>
        </view>
      </view>
    </view>

    <!-- 物流中心 -->
    <view class="module-section" v-if="logisticsEnabled && hasPermission('menu.logistics-center')">
      <view class="section-title">🚢 物流中心</view>
      <view class="module-grid">
        <view class="module-item" v-if="hasPermission('menu.logistics-quote')" @click="navigateTo('/pages/logistics/quote-request/list')">
          <view class="module-icon">📋</view>
          <view class="module-name">询价管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.logistics-tracking')" @click="navigateTo('/pages/logistics/tracking-shipment/list')">
          <view class="module-icon">📦</view>
          <view class="module-name">货物追踪</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.logistics-contact')" @click="navigateTo('/pages/logistics/contact-matrix/list')">
          <view class="module-icon">📞</view>
          <view class="module-name">联系渠道</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.logistics-review')" @click="navigateTo('/pages/logistics/review/list')">
          <view class="module-icon">⭐</view>
          <view class="module-name">客户评价</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.logistics-subscription')" @click="navigateTo('/pages/logistics/subscription/list')">
          <view class="module-icon">🔔</view>
          <view class="module-name">通知订阅</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.logistics-landing')" @click="navigateTo('/pages/logistics/landing-page/list')">
          <view class="module-icon">🎯</view>
          <view class="module-name">落地页</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.logistics-funnel')" @click="navigateTo('/pages/logistics/conversion-funnel/list')">
          <view class="module-icon">📊</view>
          <view class="module-name">转化漏斗</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.logistics-order')" @click="navigateTo('/pages/logistics/intent-order/list')">
          <view class="module-icon">📝</view>
          <view class="module-name">意向订单</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.logistics-referral')" @click="navigateTo('/pages/logistics/referral/list')">
          <view class="module-icon">🎁</view>
          <view class="module-name">推荐奖励</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.logistics-customer')" @click="navigateTo('/pages/logistics/customer-profile/list')">
          <view class="module-icon">👥</view>
          <view class="module-name">客户档案</view>
        </view>
      </view>
    </view>

    <!-- 媒体发布中心 -->
    <view class="module-section" v-if="studioEnabled && hasPermission('menu.studio-center')">
      <view class="section-title">🎬 媒体发布中心</view>
      <view class="module-grid">
        <view class="module-item" v-if="hasPermission('menu.studio')" @click="navigateTo('/pages/studio/article-draft/list')">
          <view class="module-icon">📝</view>
          <view class="module-name">草稿文章</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.studio-collect')" @click="navigateTo('/pages/studio/collect-workflow/index')">
          <view class="module-icon">🔍</view>
          <view class="module-name">内容采集</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.studio-collect')" @click="navigateTo('/pages/studio/collect-source/list')">
          <view class="module-icon">📡</view>
          <view class="module-name">采集源管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.studio-collect')" @click="navigateTo('/pages/studio/collect-task/list')">
          <view class="module-icon">📋</view>
          <view class="module-name">采集任务</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.studio-publish')" @click="navigateTo('/pages/studio/publish-center/index')">
          <view class="module-icon">📤</view>
          <view class="module-name">多平台发布</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.studio-publish')" @click="navigateTo('/pages/studio/publish-platform/list')">
          <view class="module-icon">🌐</view>
          <view class="module-name">平台管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.studio-publish')" @click="navigateTo('/pages/studio/publish-account/list')">
          <view class="module-icon">👤</view>
          <view class="module-name">账号管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.studio-publish')" @click="navigateTo('/pages/studio/publish-record/list')">
          <view class="module-icon">📑</view>
          <view class="module-name">发布记录</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.studio-stats')" @click="navigateTo('/pages/studio/analytics/index')">
          <view class="module-icon">📊</view>
          <view class="module-name">数据分析</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.studio-stats')" @click="navigateTo('/pages/studio/stat-summary/list')">
          <view class="module-icon">📈</view>
          <view class="module-name">统计汇总</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.studio-stats')" @click="navigateTo('/pages/studio/browser-log/list')">
          <view class="module-icon">👁️</view>
          <view class="module-name">浏览日志</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.studio-ad')" @click="navigateTo('/pages/studio/ad-slot/list')">
          <view class="module-icon">📢</view>
          <view class="module-name">广告位</view>
        </view>
      </view>
    </view>

    <!-- 系统设置 -->
    <view class="module-section" v-if="hasPermission('menu.system-center')">
      <view class="section-title">⚙️ 系统设置</view>
      <view class="module-grid">
        <view class="module-item" v-if="hasPermission('menu.system-center')" @click="navigateTo('/pages/system/tools')">
          <view class="module-icon">⚙️</view>
          <view class="module-name">系统配置</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.site-config')" @click="navigateTo('/pages/settings/site-config')">
          <view class="module-icon">🏢</view>
          <view class="module-name">站点配置</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.site-config')" @click="navigateTo('/pages/settings/site-template')">
          <view class="module-icon">📋</view>
          <view class="module-name">模板管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.user-roles')" @click="navigateTo('/pages/system/role-management')">
          <view class="module-icon">👤</view>
          <view class="module-name">角色管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.user-roles')" @click="navigateTo('/pages/system/user-roles')">
          <view class="module-icon">👥</view>
          <view class="module-name">用户角色</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.permissions')" @click="navigateTo('/pages/system/permissions')">
          <view class="module-icon">🔑</view>
          <view class="module-name">权限管理</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.channel-permission')" @click="navigateTo('/pages/channel/permissions')">
          <view class="module-icon">🔗</view>
          <view class="module-name">渠道权限</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.role-logs')" @click="navigateTo('/pages/system/role-logs')">
          <view class="module-icon">📄</view>
          <view class="module-name">操作日志</view>
        </view>
        <view class="module-item" v-if="hasPermission('menu.verification')" @click="navigateTo('/pages/verification/records')">
          <view class="module-icon">🔐</view>
          <view class="module-name">验证记录</view>
        </view>
        <view class="module-item" @click="navigateTo('/pages/manual/index')">
          <view class="module-icon">📖</view>
          <view class="module-name">使用手册</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../src/store/user.js'
import TenantSwitcher from '../../src/components/TenantSwitcher.vue'
import { checkAuth } from '../../src/utils/auth.js'
import { getAdminChannelList } from '../../src/api/channel.js'
import { getCourseList, getUserCourseList, getCourseProgressList } from '../../src/api/course.js'
import { getQuestionList } from '../../src/api/quiz.js'
import { getRecordList } from '../../src/api/points.js'
import { loadSiteConfig } from '../../src/utils/config-helper.js'
import { articleApi, productApi, caseApi, leadApi } from '../../src/api/website.js'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission
const stats = ref({ channels: 0, courses: 0, questions: 0, points: 0, students: 0, completedCourses: 0, articles: 0, products: 0, cases: 0, leads: 0 })
const courseStatusMap = ref({})
const recentProgress = ref([])
const pointsEnabled = ref(true)
const websiteEnabled = ref(true)
const logisticsEnabled = ref(true)

const courseStatusData = computed(() => {
  const statusConfig = [
    { status: 'draft', label: '草稿', color: '#90a4ae' },
    { status: 'pending', label: '待审核', color: '#ffb74d' },
    { status: 'published', label: '已发布', color: '#66bb6a' },
    { status: 'archived', label: '已归档', color: '#b0bec5' }
  ]
  const maxCount = Math.max(...statusConfig.map(s => courseStatusMap.value[s.status] || 0), 1)
  return statusConfig.map(s => ({
    ...s,
    count: courseStatusMap.value[s.status] || 0,
    percent: ((courseStatusMap.value[s.status] || 0) / maxCount) * 100
  }))
})

function navigateTo(url) {
  uni.navigateTo({ url })
}

function goProfile() {
  uni.navigateTo({ url: '/pages/system/profile' })
}

function getTotal(response) {
  if (!response) return 0
  if (response.total !== undefined) return response.total
  if (response.pagination && response.pagination.total !== undefined) return response.pagination.total
  if (Array.isArray(response)) return response.length
  if (Array.isArray(response.list)) return response.list.length
  return 0
}

async function loadStats() {
  try {
    const [channels, courses, questions, points, userCourses, courseProgress, articles, products, cases, leads] = await Promise.all([
      getAdminChannelList().catch(() => ({ pagination: { total: 0 }, list: [] })),
      getCourseList({ 'pagination[pageSize]': 100, 'fields': ['status'] }).catch(() => ({ pagination: { total: 0 }, list: [] })),
      getQuestionList().catch(() => ({ pagination: { total: 0 }, list: [] })),
      getRecordList().catch(() => ({ list: [], pagination: { total: 0 } })),
      getUserCourseList().catch(() => ({ pagination: { total: 0 }, list: [] })),
      getCourseProgressList({ 'pagination[pageSize]': 5, 'pagination[sort]': 'updatedAt:desc' }).catch(() => ({ pagination: { total: 0 }, list: [] })),
      articleApi.list({ 'pagination[pageSize]': 1 }).catch(() => ({ pagination: { total: 0 } })),
      productApi.list({ 'pagination[pageSize]': 1 }).catch(() => ({ pagination: { total: 0 } })),
      caseApi.list({ 'pagination[pageSize]': 1 }).catch(() => ({ pagination: { total: 0 } })),
      leadApi.list({ 'pagination[pageSize]': 1 }).catch(() => ({ pagination: { total: 0 } }))
    ])

    const courseList = courses.list || []
    const statusMap = {}
    courseList.forEach(c => {
      const s = c.status || 'draft'
      statusMap[s] = (statusMap[s] || 0) + 1
    })
    courseStatusMap.value = statusMap

    const progressList = courseProgress.list || []
    const completedCount = courseProgress.pagination?.total || 0

    recentProgress.value = progressList.slice(0, 5).map(p => ({
      documentId: p.documentId || p.id,
      username: p.user?.username || p.username || '学员',
      courseTitle: p.course?.title || p.course?.documentId || '未知课程',
      progressPercent: Math.min(p.progress ?? p.progressPercent ?? 0, 100),
      updatedAt: p.updatedAt ? p.updatedAt.slice(0, 10) : ''
    }))

    stats.value = {
      channels: getTotal(channels),
      courses: getTotal(courses),
      questions: getTotal(questions),
      points: getTotal(points),
      students: getTotal(userCourses),
      completedCourses: completedCount,
      articles: getTotal(articles),
      products: getTotal(products),
      cases: getTotal(cases),
      leads: getTotal(leads)
    }
  } catch (error) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

onShow(async () => {
  if (checkAuth()) {
    // 每次进入页面都刷新权限数据，确保获取最新的权限配置
    await userStore.fetchPermissions()
    await userStore.fetchUserRoles()
    // 刷新租户列表，确保 TenantSwitcher 有数据（登录时只拉一次，刷新页面后需重新加载）
    await userStore.fetchTenants()
    // 读取公开配置，获取功能开关状态（内部已处理错误提示）
    try {
      const config = await loadSiteConfig()
      if (config) {
        pointsEnabled.value = config.featureFlags?.points !== false
        websiteEnabled.value = config.featureFlags?.website !== false
        logisticsEnabled.value = config.featureFlags?.logistics !== false
        studioEnabled.value = config.featureFlags?.studio !== false
      }
    } catch {}
    loadStats()
  }
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 40rpx;
  background: #fff;
  border-bottom: 1rpx solid #eee;
}

.header-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.header-user {
  font-size: 28rpx;
  color: #666;
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 32rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  padding: 32rpx;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.stat-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  margin-right: 24rpx;
}

.stat-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
}

.module-section {
  padding: 0 32rpx;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  padding-left: 8rpx;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx;
}

.module-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 16rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.module-icon {
  font-size: 56rpx;
  margin-bottom: 16rpx;
}

.module-name {
  font-size: 24rpx;
  color: #666;
  text-align: center;
}

.pickup-verify-entry {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}
.pickup-verify-entry .module-name {
  color: #fff !important;
  font-weight: bold;
}

.chart-section {
  padding: 0 32rpx;
  margin-bottom: 32rpx;
}

.bar-chart {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.bar-row:last-child {
  margin-bottom: 0;
}

.bar-label {
  width: 112rpx;
  font-size: 26rpx;
  color: #666;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 40rpx;
  background: #f5f5f5;
  border-radius: 20rpx;
  margin: 0 24rpx;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 20rpx;
  transition: width 0.3s ease;
  min-width: 8rpx;
}

.bar-value {
  width: 64rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  text-align: right;
  flex-shrink: 0;
}

.activity-section {
  padding: 0 32rpx;
  margin-bottom: 32rpx;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.activity-main {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.activity-user {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.activity-course {
  font-size: 24rpx;
  color: #666;
}

.activity-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.activity-progress {
  font-size: 28rpx;
  font-weight: bold;
  color: #66bb6a;
}

.activity-time {
  font-size: 22rpx;
  color: #999;
}

.empty-tip {
  text-align: center;
  padding: 48rpx;
  color: #999;
  font-size: 28rpx;
  background: #fff;
  border-radius: 24rpx;
}
</style>
