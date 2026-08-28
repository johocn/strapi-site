<template>
  <view class="page-container">
    <PageHeader title="宣传文案设计">
      <view class="btn-group">
        <button class="btn-ghost-h" @click="openPreview = true">预览</button>
        <button class="btn-primary" @click="save">保存</button>
      </view>
    </PageHeader>

    <view v-if="loading" class="loading"><text>加载中...</text></view>

    <template v-else-if="form.title">
      <!-- 活动信息摘要 -->
      <view class="activity-summary">
        <view class="summary-row">
          <text class="summary-title">{{ form.title }}</text>
          <text class="status-badge" :class="statusClass(form.status)">{{ statusText(form.status) }}</text>
        </view>
        <view class="summary-meta">
          <text class="meta-item">🕐 {{ fmtTime(form.startTime) }} ~ {{ fmtTime(form.endTime) }}</text>
          <text class="meta-item">📍 {{ form.venue?.name || form.venueName || '-' }}</text>
        </view>
      </view>

      <view class="scheme-tabs">
        <view class="scheme-tab" :class="{ on: activeScheme === 'ai' }" @click="activeScheme = 'ai'">AI 智能生成</view>
        <view class="scheme-tab" :class="{ on: activeScheme === 'custom' }" @click="activeScheme = 'custom'">完全定制</view>
      </view>

      <template v-if="activeScheme === 'ai'">
      <!-- AI 辅助：生成 / 提示词 / 粘贴导入 -->
      <view class="form-section">
        <view class="section-title">AI 生成宣传文案</view>
        <view class="ai-actions">
          <button class="btn-ai" @click="genByAI" :loading="aiLoading">{{ aiLoading ? '生成中...' : '✨ AI 一键生成' }}</button>
          <button class="btn-ghost" @click="copyPrompt">复制提示词</button>
        </view>
        <text class="form-tip">AI 仅基于下方固定信息生成宣传文案，不会改动时间/场地/讲师/名额等已定内容。</text>

        <view class="form-item">
          <text class="form-label">粘贴 AI 输出 JSON</text>
          <textarea
            v-model="pasteRaw"
            class="form-textarea"
            placeholder="将 AI 生成的宣传 JSON 粘贴到这里（兼容 ```json 代码块），然后点「导入」"
            :auto-height="false"
            maxlength="-1"
          />
          <view class="link-add" @click="applyPaste">导入 JSON 并回填下方宣传字段</view>
        </view>

        <view v-if="suggestTips.length" class="suggest-box">
          <text v-for="(t, i) in suggestTips" :key="i" class="suggest-line">{{ t }}</text>
        </view>
      </view>

      <!-- 活动介绍 -->
      <view class="form-section">
        <view class="section-title">活动介绍（description）</view>
        <view class="form-item">
          <textarea v-model="form.description" class="form-textarea" placeholder="活动介绍文案，展示在宣传页" maxlength="-1" />
        </view>
      </view>

      <!-- 配色方案 -->
      <view class="form-section">
        <view class="section-title">配色方案</view>
        <view class="form-item">
          <text class="form-tip">12 套色卡一键选用，可再微调六色值；未选时使用默认配色</text>
          <view class="palette-grid">
            <view
              v-for="p in PROMO_PALETTES"
              :key="p.key"
              class="palette-card"
              :class="{ on: isPaletteOn(p) }"
              @click="applyPalette(p)"
            >
              <view class="palette-swatch">
                <view class="palette-swatch-main" :style="{ background: p.colors.primary }"></view>
                <view class="palette-swatch-bg" :style="{ background: p.colors.bg }"></view>
                <view class="palette-swatch-card" :style="{ background: p.colors.card }"></view>
                <view class="palette-swatch-accent" :style="{ background: p.colors.accent }"></view>
              </view>
              <text class="palette-name">{{ p.name }}</text>
            </view>
          </view>
          <view v-if="form.promoColors" class="palette-preview" :style="{ background: form.promoColors.bg, color: form.promoColors.text }">
            <view class="palette-preview-chip" :style="{ background: form.promoColors.primary }">主色</view>
            <view class="palette-preview-chip" :style="{ background: form.promoColors.accent }">强调</view>
            <view class="palette-preview-card" :style="{ background: form.promoColors.card, color: form.promoColors.textDim }">卡片</view>
            <text class="palette-preview-text">正文预览</text>
          </view>
          <view v-if="form.promoColors" class="palette-editor">
            <view v-for="(v, k) in form.promoColors" :key="k" class="form-row">
              <text class="palette-key">{{ colorKeyLabel(k) }}</text>
              <input type="text" v-model="form.promoColors[k]" class="form-input form-inline" placeholder="#RRGGBB" />
            </view>
          </view>
        </view>
      </view>

      <!-- 页面模块 -->
      <view class="form-section">
        <view class="section-title">页面模块</view>
        <view class="form-item">
          <view v-for="(m, i) in form.promoModules" :key="i" class="promo-module-row">
            <view class="promo-module-name" @click="toggleModuleConfig(i)">
              <text>{{ PROMO_MODULE_META[m.type]?.name || m.type }}</text>
              <text class="promo-module-arrow">{{ openModuleIndex === i ? '▲' : '▼' }}</text>
            </view>
            <view class="promo-module-ops">
              <text class="link-del" @click="moveModule(i, -1)">上移</text>
              <text class="link-del" @click="moveModule(i, 1)">下移</text>
              <text class="link-del" @click="removeModule(i)">删除</text>
            </view>
            <view v-if="openModuleIndex === i" class="promo-module-config">
              <template v-if="m.type === 'custom'">
                <input type="text" v-model="m.config.title" placeholder="模块标题（可选）" class="form-input" />
                <RichEditor v-model="m.config.html" />
                <view v-for="(img, ii) in m.config.images || []" :key="ii" class="promo-module-image-row">
                  <text class="promo-module-image-name">{{ (img && (img.name || img.url)) || img }}</text>
                  <text class="link-del" @click="m.config.images.splice(ii, 1)">删除</text>
                </view>
                <view class="form-row">
                  <input type="text" v-model="imageUrlInput" placeholder="粘贴网络图片 URL，回车添加" class="form-input form-inline" />
                  <text class="link-add" @click="addImageUrl(m)">添加</text>
                </view>
                <view class="link-add" @click="openImagePicker(m)">+ 从素材库选图</view>
                <text class="form-tip">自定义块用于固定模块无法满足的自由排版：富文本 + 网络图片，C 端按模块顺序渲染。</text>
              </template>
              <template v-else-if="m.type === 'rich'">
                <RichEditor v-model="m.config.html" />
              </template>
              <template v-else-if="m.type === 'cover'">
                <input type="text" v-model="m.config.title" placeholder="主标题" class="form-input" />
                <input type="text" v-model="m.config.subtitle" placeholder="副标题" class="form-input" />
              </template>
              <template v-else-if="m.type === 'highlights'">
                <view v-for="(p, pi) in m.config.points || []" :key="pi" class="form-row">
                  <input type="text" v-model="m.config.points[pi]" placeholder="亮点内容" class="form-input" />
                  <text class="link-del" @click="m.config.points.splice(pi, 1)">删除</text>
                </view>
                <view class="link-add" @click="(m.config.points ||= []).push('')">+ 添加亮点</view>
              </template>
              <template v-else-if="m.type === 'agenda'">
                <view v-for="(it, ii) in m.config.items || []" :key="ii" class="form-row">
                  <input type="text" v-model="m.config.items[ii].t" placeholder="时间" class="form-input form-inline" />
                  <input type="text" v-model="m.config.items[ii].title" placeholder="议程标题" class="form-input form-inline" />
                  <input type="text" v-model="m.config.items[ii].desc" placeholder="描述（可选）" class="form-input form-inline" />
                  <text class="link-del" @click="m.config.items.splice(ii, 1)">删除</text>
                </view>
                <view class="link-add" @click="(m.config.items ||= []).push({ t: '', title: '', desc: '' })">+ 添加条目</view>
              </template>
              <template v-else-if="m.type === 'faq'">
                <view v-for="(it, ii) in m.config.items || []" :key="ii" class="form-row">
                  <input type="text" v-model="m.config.items[ii].q" placeholder="问题" class="form-input form-inline" />
                  <input type="text" v-model="m.config.items[ii].a" placeholder="回答" class="form-input form-inline" />
                  <text class="link-del" @click="m.config.items.splice(ii, 1)">删除</text>
                </view>
                <view class="link-add" @click="(m.config.items ||= []).push({ q: '', a: '' })">+ 添加问答</view>
              </template>
              <template v-else-if="m.type === 'images'">
                <view v-for="(img, ii) in m.config.images || []" :key="ii" class="promo-module-image-row">
                  <text class="promo-module-image-name">{{ (img && (img.name || img.url)) || img }}</text>
                  <text class="link-del" @click="m.config.images.splice(ii, 1)">删除</text>
                </view>
                <view class="form-row">
                  <input type="text" v-model="imageUrlInput" placeholder="粘贴网络图片 URL，回车添加" class="form-input form-inline" />
                  <text class="link-add" @click="addImageUrl(m)">添加</text>
                </view>
                <view class="link-add" @click="openImagePicker(m)">+ 从素材库选图</view>
              </template>
              <template v-else-if="m.type === 'info'">
                <view class="promo-fixed-row"><text class="promo-fixed-label">活动时间</text><text class="promo-fixed-value">{{ fmtTime(form.startTime) }} ~ {{ fmtTime(form.endTime) }}</text></view>
                <view class="promo-fixed-row"><text class="promo-fixed-label">活动地点</text><text class="promo-fixed-value">{{ form.venueName || '待定场地' }}</text></view>
                <view class="promo-fixed-row"><text class="promo-fixed-label">活动名额</text><text class="promo-fixed-value">{{ form.capacity == null ? '不限' : form.capacity + ' 人' }}</text></view>
                <view class="promo-fixed-row"><text class="promo-fixed-label">活动费用</text><text class="promo-fixed-value">{{ feeText(form) }}</text></view>
                <text class="form-tip">基本信息条自动读取活动固定信息（时间/场地/名额/费用），此处仅作展示，修改请前往活动编辑页。</text>
                <view class="link-add" @click="goEditActivity">去活动编辑页修改 ›</view>
              </template>
              <template v-else-if="m.type === 'speakers'">
                <view v-if="form.lecturer">
                  <view v-for="(s, si) in (Array.isArray(form.lecturer) ? form.lecturer : [form.lecturer])" :key="si" class="promo-fixed-speaker">
                    <text class="promo-speaker-name">{{ s.name || '嘉宾' }}</text>
                    <text v-if="s.bio || s.desc" class="promo-speaker-bio">{{ s.bio || s.desc }}</text>
                  </view>
                </view>
                <text v-else class="promo-fixed-empty">暂未关联讲师，可在活动编辑页设置。</text>
                <text class="form-tip">嘉宾讲师自动读取活动关联的讲师信息，此处仅作展示，修改请前往活动编辑页。</text>
                <view class="link-add" @click="goEditActivity">去活动编辑页修改 ›</view>
              </template>
            </view>
          </view>
          <view class="link-add" @click="openAddModule = true">+ 添加模块</view>
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="form-section">
        <view class="section-title">联系方式</view>
        <view class="form-item">
          <view class="switch-row">
            <text>使用站点默认联系方式</text>
            <switch :checked="!form.promoContact" @change="toggleContactOverride" />
          </view>
          <template v-if="form.promoContact">
            <input type="text" v-model="form.promoContact.wechat.id" placeholder="微信号" class="form-input" />
            <input type="text" v-model="form.promoContact.phone" placeholder="联系电话" class="form-input" />
            <input type="text" v-model="form.promoContact.notice" placeholder="提示文案（如：无法报名请加顾问微信）" class="form-input" />
          </template>
        </view>
      </view>
      </template>

      <template v-else>
      <view class="form-section">
        <view class="section-title">完全定制文案</view>
        <view class="form-item">
          <text class="form-tip">自由排版编辑整页宣传内容。点击下方按钮在光标处插入活动要素，C 端会实时替换为最新活动信息。未填入的内容对应处显示为空。</text>
          <view class="placeholder-toolbar">
            <view v-for="p in PLACEHOLDER_ITEMS" :key="p.key" class="placeholder-chip" @click="insertPlaceholder(p.key)">{{ p.label }}</view>
          </view>
          <RichEditor v-model="customPromoHtml" height="600rpx" placeholder="在此输入完全定制的宣传文案..." />
        </view>
      </view>
      </template>

      <view class="save-bar">
        <button class="btn-primary save-btn" @click="save" :loading="saving">保存宣传文案</button>
      </view>
    </template>

    <MediaPicker
      :visible="promoMediaPicker.visible"
      accept="image/*"
      @select="onPromoImagePick"
      @update:visible="promoMediaPicker.visible = $event"
    />

    <view class="modal-mask" v-if="openAddModule" @click="openAddModule = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">添加模块</text>
          <text class="modal-close" @click="openAddModule = false">✕</text>
        </view>
        <view class="promo-module-add-grid">
          <view v-for="(meta, type) in PROMO_MODULE_META" :key="type" class="promo-module-add-item" @click="addModule(type)">
            <text>{{ meta.name }}</text>
          </view>
        </view>
        <text class="form-tip">固定模块格式满足不了排版需求时，选用「自定义块」自由组合富文本与网络图片。</text>
      </view>
    </view>

    <!-- 宣传文案预览弹窗（复用 C 端 promo 组件 + 主题配色，实时反映当前编辑内容） -->
    <view class="modal-mask" v-if="openPreview" @click="openPreview = false">
      <view class="preview-modal" @click.stop>
        <view class="preview-header">
          <text class="preview-title">宣传文案预览</text>
          <text class="preview-close" @click="openPreview = false">✕</text>
        </view>
        <scroll-view scroll-y class="preview-scroll">
          <view class="promo-page preview-body" :class="'promo-' + form.promoTemplate" :style="previewColorVars">
            <block v-for="m in form.promoModules" :key="m.sort">
              <PromoCover v-if="m.type === 'cover'" :activity="form" :config="m.config" />
              <PromoInfo v-else-if="m.type === 'info'" :activity="form" :config="m.config" />
              <PromoRich v-else-if="m.type === 'rich'" :activity="form" :config="m.config" />
              <PromoHighlights v-else-if="m.type === 'highlights'" :activity="form" :config="m.config" />
              <PromoSpeakers v-else-if="m.type === 'speakers'" :activity="form" :config="m.config" />
              <PromoAgenda v-else-if="m.type === 'agenda'" :activity="form" :config="m.config" />
              <PromoImages v-else-if="m.type === 'images'" :activity="form" :config="m.config" />
              <PromoRewards v-else-if="m.type === 'rewards'" :rewards="form.rewardConfig" />
              <PromoContact v-else-if="m.type === 'contact'" :contact="form.promoContact" />
              <PromoMessage v-else-if="m.type === 'message'" :messages="[]" />
              <PromoFaq v-else-if="m.type === 'faq'" :activity="form" :config="m.config" />
              <PromoCustom v-else-if="m.type === 'custom'" :activity="form" :config="m.config" />
            </block>
            <view v-if="!form.promoModules.length" class="preview-empty">暂无宣传模块，请先添加或生成文案</view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getActivity, updateActivity } from '../../api/activity.js'
import { adminPost } from '../../utils/request.js'
import PageHeader from '../../components/PageHeader.vue'
import RichEditor from '../../components/RichEditor.vue'
import MediaPicker from '../../components/MediaPicker.vue'
import PromoCover from '../../components/promo/promo-cover.vue'
import PromoInfo from '../../components/promo/promo-info.vue'
import PromoRich from '../../components/promo/promo-rich.vue'
import PromoHighlights from '../../components/promo/promo-highlights.vue'
import PromoSpeakers from '../../components/promo/promo-speakers.vue'
import PromoAgenda from '../../components/promo/promo-agenda.vue'
import PromoImages from '../../components/promo/promo-images.vue'
import PromoRewards from '../../components/promo/promo-rewards.vue'
import PromoContact from '../../components/promo/promo-contact.vue'
import PromoMessage from '../../components/promo/promo-message.vue'
import PromoFaq from '../../components/promo/promo-faq.vue'
import PromoCustom from '../../components/promo/promo-custom.vue'
import { PROMO_MODULE_META } from './promo-presets.js'
import { PROMO_PALETTES } from './promo-palettes.js'
import { parsePromoImport, buildPromoPrompt } from './promo-import.js'

const activityId = ref('')
const loading = ref(false)
const saving = ref(false)
const aiLoading = ref(false)
const pasteRaw = ref('')
const suggestTips = ref([])
const openModuleIndex = ref(-1)
const openAddModule = ref(false)
const openPreview = ref(false)
const promoMediaPicker = ref({ visible: false, module: null })

const form = reactive({
  title: '',
  status: 'draft',
  type: '',
  category: '',
  description: '',
  startTime: '',
  endTime: '',
  venueName: '',
  venue: null,
  lecturer: null,
  capacity: null,
  cashPrice: null,
  belongsToSeries: null,
  assets: { recordingUrl: '', materials: [] },
  tags: [],
  questionnaire: null,
  checkinMode: 'both',
  geoEnforced: false,
  geoRadiusM: 500,
  signupStart: '',
  signupEnd: '',
  pricingMode: 'flat',
  feeCollectAt: 'signup',
  pointsCost: 0,
  feeTiers: [],
  feeFactors: null,
  preUnlockArticles: [],
  preUnlockLessons: [],
  learningPackageArticles: [],
  learningPackageLessons: [],
  shareRewardPoints: 0,
  formConfig: [],
  rewardConfig: null,
  promoTemplate: 'summit',
  promoColors: null,
  promoModules: [],
  promoContact: null,
  promoAssets: [],
})

const activeScheme = ref('ai') // 'ai' | 'custom'
const PLACEHOLDER_ITEMS = [{key:'title',label:'标题'},{key:'startTime',label:'开始时间'},{key:'endTime',label:'结束时间'},{key:'venueName',label:'场地'},{key:'capacity',label:'名额'},{key:'cashPrice',label:'报名费'},{key:'lecturer',label:'讲师'},{key:'description',label:'活动介绍'}]
const customPromoHtml = ref('')

const statusTextMap = { draft: '草稿', signup_open: '报名中', ongoing: '进行中', ended: '已结束', archived: '已归档' }
const statusClassMap = { draft: 'draft', signup_open: 'open', ongoing: 'ongoing', ended: 'ended', archived: 'archived' }
function statusText(s) { return statusTextMap[s] || s || '-' }
function statusClass(s) { return statusClassMap[s] || 'default' }
function fmtTime(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (isNaN(d.getTime())) return String(v)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function normContact(pc) {
  if (!pc || typeof pc !== 'object') return null
  return {
    wechat: pc.wechat && typeof pc.wechat === 'object'
      ? pc.wechat
      : { qrcode: '', id: typeof pc.wechat === 'string' ? pc.wechat : '' },
    phone: pc.phone || '',
    card: pc.card || null,
    notice: pc.notice || '',
  }
}

async function loadDetail() {
  if (!activityId.value) return
  loading.value = true
  try {
    const data = await getActivity(activityId.value)
    if (!data) {
      uni.showToast({ title: '活动不存在', icon: 'none' })
      return
    }
    Object.assign(form, {
      title: data.title || '',
      status: data.status || 'draft',
      type: data.type || '',
      category: data.category || '',
      description: data.description || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      venueName: data.venueName || '',
      venue: data.venue || null,
      lecturer: data.lecturer || null,
      capacity: data.capacity ?? null,
      cashPrice: data.cashPrice ?? null,
      belongsToSeries: data.belongsToSeries || null,
      assets: data.assets && typeof data.assets === 'object' ? data.assets : { recordingUrl: '', materials: [] },
      tags: Array.isArray(data.tags) ? data.tags : [],
      questionnaire: data.questionnaire && typeof data.questionnaire === 'object' ? data.questionnaire : null,
      checkinMode: data.checkinMode || 'both',
      geoEnforced: !!data.geoEnforced,
      geoRadiusM: data.geoRadiusM ?? 500,
      signupStart: data.signupStart || '',
      signupEnd: data.signupEnd || '',
      pricingMode: data.pricingMode || 'flat',
      feeCollectAt: data.feeCollectAt || 'signup',
      pointsCost: data.pointsCost || 0,
      feeTiers: Array.isArray(data.feeTiers) ? data.feeTiers : [],
      feeFactors: data.feeFactors && typeof data.feeFactors === 'object' ? data.feeFactors : null,
      preUnlockArticles: Array.isArray(data.preUnlockArticles) ? data.preUnlockArticles : [],
      preUnlockLessons: Array.isArray(data.preUnlockLessons) ? data.preUnlockLessons : [],
      learningPackageArticles: Array.isArray(data.learningPackageArticles) ? data.learningPackageArticles : [],
      learningPackageLessons: Array.isArray(data.learningPackageLessons) ? data.learningPackageLessons : [],
      shareRewardPoints: data.shareRewardPoints ?? 0,
      formConfig: Array.isArray(data.formConfig) ? data.formConfig : [],
      rewardConfig: data.rewardConfig && typeof data.rewardConfig === 'object' ? data.rewardConfig : null,
      promoTemplate: data.promoTemplate || 'summit',
      promoColors: data.promoColors && typeof data.promoColors === 'object' ? { ...data.promoColors } : null,
      promoModules: Array.isArray(data.promoModules) ? data.promoModules : [],
      promoContact: normContact(data.promoContact),
      promoAssets: Array.isArray(data.promoAssets) ? data.promoAssets : [],
      customPromoHtml: data.customPromoHtml || '',
    })
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// ---- 配色方案（12 套色卡 + 六色值微调；未选时用模板默认配色）----
function isPaletteOn(p) {
  const c = form.promoColors
  if (!c || !p) return false
  return Object.keys(p.colors).every(k => c[k] === p.colors[k])
}
function applyPalette(p) { form.promoColors = { ...p.colors } }
const colorKeyLabels = { primary: '主色', accent: '强调色', bg: '背景色', card: '卡片色', text: '正文色', textDim: '次要文字' }
function colorKeyLabel(k) { return colorKeyLabels[k] || k }
// 预览内联 CSS 变量（与 C 端 detail.vue colorVars 同契约：--c-* 覆盖模板默认色）
const previewColorVars = computed(() => {
  const c = form.promoColors
  if (!c || typeof c !== 'object') return null
  const vars = {}
  if (c.primary) vars['--c-primary'] = c.primary
  if (c.accent) vars['--c-accent'] = c.accent
  if (c.bg) vars['--c-bg'] = c.bg
  if (c.card) vars['--c-card'] = c.card
  if (c.text) vars['--c-text'] = c.text
  if (c.textDim) vars['--c-text-dim'] = c.textDim
  return vars
})

// ---- 模块编辑 ----
function toggleModuleConfig(i) { openModuleIndex.value = openModuleIndex.value === i ? -1 : i }
function moveModule(i, dir) {
  const arr = form.promoModules
  const j = i + dir
  if (j < 0 || j >= arr.length) return
  const [m] = arr.splice(i, 1)
  arr.splice(j, 0, m)
  reindexModules()
}
function removeModule(i) { form.promoModules.splice(i, 1); reindexModules() }
function reindexModules() { form.promoModules.forEach((m, i) => { m.sort = i }) }
function addModule(type) {
  form.promoModules.push({ type, config: {}, sort: form.promoModules.length })
  openAddModule.value = false
}
function openImagePicker(m) { promoMediaPicker.value.module = m; promoMediaPicker.value.visible = true }
function onPromoImagePick(item) {
  const m = promoMediaPicker.value.module
  if (m && item?.url) {
    if (!m.config.images) m.config.images = []
    m.config.images.push({ url: item.url, name: item.name || item.url })
  }
}
// 粘贴网络图片 URL 添加（custom/images 模块），支持 http(s) 外链
const imageUrlInput = ref('')
function addImageUrl(m) {
  const url = imageUrlInput.value.trim()
  if (!url) return uni.showToast({ title: '请先粘贴图片 URL', icon: 'none' })
  if (!/^https?:\/\//i.test(url)) return uni.showToast({ title: '请输入 http(s) 图片地址', icon: 'none' })
  if (!m.config.images) m.config.images = []
  m.config.images.push({ url, name: url })
  imageUrlInput.value = ''
}

// ---- 固定信息模块（info/speakers）展示与跳转 ----
function feeText(a) {
  if (!a) return ''
  const cost = Number(a.cost ?? a.cashPrice ?? 0)
  if (cost > 0) return `${cost} 元`
  return '免费'
}
function goEditActivity() {
  if (!activityId.value) return
  uni.navigateTo({ url: '/pages/activity/form?id=' + activityId.value })
}

// ---- 联系方式 ----
function toggleContactOverride(e) {
  if (e.detail.value === false) {
    form.promoContact = { wechat: { qrcode: '', id: '' }, phone: '', card: null, notice: '' }
  } else {
    form.promoContact = null
  }
}

// ---- AI 生成 / 粘贴导入 ----
function applyPromoResult(r) {
  if (!r.ok) {
    uni.showToast({ title: r.errors[0] || '导入失败', icon: 'none' })
    return false
  }
  const d = r.data
  if (d.description !== undefined) form.description = d.description
  if (Array.isArray(d.promoModules) && d.promoModules.length) {
    const ms = d.promoModules
    // 基本信息条必须存在：C 端宣传页据此展示时间/场地/名额/费用（跟随活动固定信息）
    if (!ms.some(m => m.type === 'info')) {
      const coverIdx = ms.findIndex(m => m.type === 'cover')
      ms.splice(coverIdx >= 0 ? coverIdx + 1 : 0, 0, { type: 'info', config: {}, sort: 0 })
    }
    form.promoModules = ms
    form.promoModules.forEach((m, i) => { m.sort = i })
    openModuleIndex.value = -1
  }
  if (d.promoContact && typeof d.promoContact === 'object') form.promoContact = normContact(d.promoContact)
  suggestTips.value = []
  if (d.promoColors && typeof d.promoColors === 'object') {
    form.promoColors = d.promoColors
    suggestTips.value.push((d.paletteName ? `AI 推荐配色「${d.paletteName}」` : 'AI 推荐配色') + '已套用，可在「配色方案」区切换或微调六色值')
  }
  if (Array.isArray(d.suggestFields) && d.suggestFields.length) {
    suggestTips.value.push('AI 建议报名表单补充字段：' + d.suggestFields.map(f => f.label).join('、') + '（可在活动编辑页「报名表单配置」中添加）')
  }
  if (d.title && d.title !== form.title) {
    uni.showModal({
      title: 'AI 建议标题',
      content: `是否将活动标题替换为「${d.title}」？`,
      success: (res) => { if (res.confirm) form.title = d.title },
    })
  }
  uni.showToast({ title: '已回填，请核对后保存', icon: 'success' })
  return true
}

function applyPaste() {
  if (!pasteRaw.value.trim()) return uni.showToast({ title: '请先粘贴 JSON', icon: 'none' })
  applyPromoResult(parsePromoImport(pasteRaw.value))
}

function copyPrompt() {
  uni.setClipboardData({
    data: buildPromoPrompt(form),
    success: () => uni.showToast({ title: '提示词已复制', icon: 'success' }),
  })
}

async function genByAI() {
  if (aiLoading.value) return
  aiLoading.value = true
  try {
    const prompt = buildPromoPrompt(form)
    const res = await adminPost('/zhao-studio/v1/admin/ai/chat', {
      messages: [{ role: 'user', content: prompt }],
    })
    const content = res?.data?.content || res?.content
    if (!content) {
      uni.showToast({ title: res?.data?.error || 'AI 未返回内容，请检查 AI 配置', icon: 'none' })
      return
    }
    applyPromoResult(parsePromoImport(content))
  } catch (e) {
    uni.showToast({ title: e.message || 'AI 生成失败', icon: 'none' })
  } finally {
    aiLoading.value = false
  }
}

// ---- 保存（仅宣传字段）----
function insertPlaceholder(key) {
  customPromoHtml.value += '{{' + key + '}}'
  uni.showToast({ title: '已插入「' + key + '」占位符', icon: 'none' })
}

async function save() {
  if (activeScheme.value === 'custom') {
    saving.value = true
    try {
      const data = { customPromoHtml: (customPromoHtml.value || '').trim() || null }
      await updateActivity(activityId.value, data)
      uni.showToast({ title: '已保存', icon: 'success' })
    } catch (e) {
      uni.showToast({ title: e.message || '保存失败', icon: 'none' })
    } finally {
      saving.value = false
    }
    return
  }
  if (!form.promoModules.length) return uni.showToast({ title: '至少需要一个宣传模块', icon: 'none' })
  saving.value = true
  try {
    const data = {
      title: form.title || undefined,
      description: form.description || undefined,
      promoTemplate: form.promoTemplate,
      promoModules: form.promoModules.map((m, i) => ({
        type: m.type,
        config: m.config && Object.keys(m.config).length ? m.config : {},
        sort: i,
      })),
      promoContact: form.promoContact || null,
      promoColors: form.promoColors || null,
    }
    await updateActivity(activityId.value, data)
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onLoad((opt) => { activityId.value = opt.id || '' })
onMounted(loadDetail)
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx 20rpx 40rpx; box-sizing: border-box; }
.btn-group { display: flex; gap: 16rpx; align-items: center; }
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff; padding: 14rpx 32rpx; font-size: 28rpx; border-radius: 40rpx; border: none; line-height: 1.2;
}
.btn-ghost-h {
  background: #f5f5f5; color: #333; padding: 14rpx 32rpx; font-size: 28rpx; border-radius: 40rpx; border: none; line-height: 1.2;
}
.save-bar { display: flex; justify-content: center; padding: 30rpx 0; }
.save-btn { width: 100%; padding: 22rpx 0; font-size: 32rpx; border-radius: 44rpx; }

.loading { display: flex; justify-content: center; padding: 120rpx 0; color: #999; font-size: 28rpx; }

.activity-summary { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 20rpx; }
.summary-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
.summary-title { font-size: 32rpx; font-weight: bold; color: #333; flex: 1; margin-right: 12rpx; }
.summary-meta { display: flex; gap: 16rpx; flex-wrap: wrap; }
.meta-item { font-size: 24rpx; color: #999; }
.status-badge { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 16rpx; flex-shrink: 0; }
.status-badge.draft { background: #f5f5f5; color: #999; }
.status-badge.open { background: #e6f7ff; color: #1890ff; }
.status-badge.ongoing { background: #fff7e6; color: #fa8c16; }
.status-badge.ended { background: #f6ffed; color: #52c41a; }
.status-badge.archived { background: #f0f0f0; color: #8c8c8c; }
.status-badge.default { background: #f5f5f5; color: #666; }

.form-section { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.form-item { margin-bottom: 16rpx; }
.form-label { display: block; font-size: 28rpx; color: #333; margin-bottom: 12rpx; }
.form-tip { font-size: 24rpx; color: #999; display: block; margin: 8rpx 0; }
.form-input {
  width: 100%; height: 80rpx; border: 1rpx solid #e3e6f0; border-radius: 8rpx;
  padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box; margin-bottom: 12rpx; background: #fff;
}
.form-textarea {
  width: 100%; height: 200rpx; border: 1rpx solid #e3e6f0; border-radius: 8rpx;
  padding: 20rpx; font-size: 26rpx; box-sizing: border-box; background: #fff;
}
.form-row { display: flex; gap: 12rpx; align-items: center; margin-bottom: 12rpx; }
.form-row .form-input { margin-bottom: 0; }
.form-inline { flex: 1; min-width: 0; }
.switch-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; font-size: 28rpx; color: #333; }

.ai-actions { display: flex; gap: 16rpx; margin-bottom: 8rpx; }
.btn-ai {
  flex: 1; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #fff;
  padding: 18rpx 0; border-radius: 40rpx; font-size: 28rpx; border: none; line-height: 1.2;
}
.btn-ghost {
  flex: 1; background: #f5f5f5; color: #333; padding: 18rpx 0; border-radius: 40rpx;
  font-size: 28rpx; border: none; line-height: 1.2;
}
.suggest-box { background: #fffbe6; border: 1rpx solid #ffe58f; border-radius: 8rpx; padding: 16rpx 20rpx; }
.suggest-line { display: block; font-size: 24rpx; color: #ad6800; margin-bottom: 6rpx; }

.link-add { color: #667eea; font-size: 26rpx; padding: 12rpx 0; }
.link-del { color: #ff4d4f; font-size: 26rpx; padding: 4rpx 8rpx; }

.promo-fixed-row { display: flex; gap: 16rpx; padding: 10rpx 0; }
.promo-fixed-label { width: 140rpx; flex-shrink: 0; font-size: 26rpx; color: #999; }
.promo-fixed-value { flex: 1; min-width: 0; font-size: 26rpx; color: #333; }
.promo-fixed-speaker { padding: 10rpx 0; }
.promo-speaker-name { display: block; font-size: 28rpx; font-weight: bold; color: #333; }
.promo-speaker-bio { display: block; margin-top: 6rpx; font-size: 24rpx; color: #666; line-height: 1.5; }
.promo-fixed-empty { display: block; font-size: 26rpx; color: #999; padding: 10rpx 0; }

.palette-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.palette-card { width: calc(25% - 12rpx); box-sizing: border-box; border: 1rpx solid #e3e6f0; border-radius: 12rpx; padding: 12rpx; background: #fff; }
.palette-card.on { border-color: #667eea; background: rgba(102,126,234,.08); }
.palette-swatch { display: flex; flex-wrap: wrap; gap: 4rpx; margin-bottom: 8rpx; }
.palette-swatch-main { width: 100%; height: 40rpx; border-radius: 6rpx; }
.palette-swatch-bg, .palette-swatch-card, .palette-swatch-accent { width: calc(33.33% - 3rpx); height: 24rpx; border-radius: 6rpx; }
.palette-name { font-size: 22rpx; color: #333; text-align: center; display: block; }
.palette-preview { border-radius: 12rpx; padding: 20rpx; margin-top: 16rpx; display: flex; align-items: center; gap: 12rpx; }
.palette-preview-chip { padding: 6rpx 16rpx; border-radius: 20rpx; font-size: 22rpx; color: #fff; }
.palette-preview-card { padding: 6rpx 16rpx; border-radius: 8rpx; font-size: 22rpx; }
.palette-preview-text { font-size: 24rpx; }
.palette-editor { border-top: 1rpx dashed #e3e6f0; margin-top: 16rpx; padding-top: 16rpx; }
.palette-key { width: 140rpx; font-size: 26rpx; color: #666; flex-shrink: 0; }

.promo-module-row { border: 1rpx solid #f0f0f0; border-radius: 12rpx; padding: 16rpx 20rpx; margin-bottom: 16rpx; background: #fff; }
.promo-module-name { display: flex; align-items: center; justify-content: space-between; font-size: 28rpx; color: #333; }
.promo-module-arrow { font-size: 20rpx; color: #999; }
.promo-module-ops { display: flex; gap: 16rpx; margin-top: 12rpx; }
.promo-module-config { border-top: 1rpx dashed #e3e6f0; margin-top: 16rpx; padding-top: 16rpx; }
.promo-module-image-row { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 12rpx; }
.promo-module-image-name { flex: 1; min-width: 0; font-size: 26rpx; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-content { width: 90%; background: #fff; border-radius: 16rpx; overflow: hidden; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 30rpx; border-bottom: 1rpx solid #f0f0f0; }
.modal-title { font-size: 32rpx; font-weight: bold; color: #333; }
.modal-close { font-size: 36rpx; color: #999; padding: 10rpx; }
.promo-module-add-grid { display: flex; flex-wrap: wrap; gap: 16rpx; padding: 30rpx; }
.promo-module-add-item {
  width: calc(33.33% - 12rpx); padding: 24rpx 0; text-align: center; background: #f5f5f5;
  border-radius: 8rpx; font-size: 26rpx; color: #333; box-sizing: border-box;
}

/* 预览弹窗 */
.preview-modal {
  width: 94%; max-width: 760rpx; height: 82vh; background: #fff; border-radius: 16rpx;
  overflow: hidden; display: flex; flex-direction: column;
}
.preview-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24rpx 30rpx; border-bottom: 1rpx solid #f0f0f0; flex-shrink: 0;
}
.preview-title { font-size: 30rpx; font-weight: bold; color: #333; }
.preview-close { font-size: 36rpx; color: #999; padding: 10rpx; }
.preview-scroll { flex: 1; min-height: 0; }
.preview-body { min-height: 100%; padding: 24rpx 0 80rpx; background: var(--c-bg); }
.preview-empty { padding: 80rpx 0; text-align: center; font-size: 26rpx; color: var(--c-text-dim); }

.scheme-tabs{display:flex;gap:16rpx;margin-bottom:20rpx;}
.scheme-tab{flex:1;text-align:center;padding:20rpx 0;font-size:28rpx;color:#666;background:#fff;border-radius:12rpx;border:1rpx solid #e3e6f0;}
.scheme-tab.on{color:#667eea;border-color:#667eea;background:rgba(102,126,234,.08);font-weight:bold;}
.placeholder-toolbar{display:flex;flex-wrap:wrap;gap:12rpx;margin:16rpx 0;}
.placeholder-chip{padding:10rpx 22rpx;font-size:24rpx;color:#667eea;background:#f0f4ff;border-radius:30rpx;border:1rpx solid #d6e0ff;}
</style>

<style lang="scss">
/* 宣传页主题配色（与 C 端 promo-themes.scss 一致，需全局生效以穿透子组件） */
@import '../../styles/promo-themes.scss';
</style>
