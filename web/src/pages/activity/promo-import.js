// 宣传文案设计 —— AI 输出解析/归一化 + 提示词组装
// 归一化逻辑移植自 scripts/test-import-contract.cjs（C 端渲染组件契约：highlights→points / agenda 二维数组→对象 / speakers 丢 items）

import { PROMO_PALETTES } from './promo-palettes.js'

const PROMO_MODULE_TYPES = ["cover", "info", "rich", "highlights", "speakers", "agenda", "images", "rewards", "contact", "message", "faq", "custom"]
const PALETTE_BY_KEY = new Map(PROMO_PALETTES.map(p => [p.key, p]))

export function stripCodeBlock(raw) {
  let s = String(raw ?? '')
  s = s.replace(/```[a-zA-Z]*\s*/g, '').replace(/```/g, '')
  const i = s.indexOf('{')
  const j = s.lastIndexOf('}')
  if (i < 0 || j < 0 || j <= i) return s
  return s.slice(i, j + 1)
}

export function normalizeModuleConfig(type, config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return {}
  const c = { ...config }
  if (type === 'highlights') {
    const pts = Array.isArray(c.items) ? c.items.filter(x => typeof x === 'string') : []
    if (pts.length) c.points = pts
    delete c.items
  } else if (type === 'agenda') {
    if (Array.isArray(c.items)) {
      c.items = c.items.map(it => {
        if (Array.isArray(it)) {
          const o = { t: String(it[0] ?? ''), title: String(it[1] ?? '') }
          if (it[2] != null) o.desc = String(it[2])
          return o
        }
        return it
      })
    }
  } else if (type === 'speakers') {
    // C 端读讲师关联实体（lecturer），config 内 items 无效，仅保留 title
    const title = typeof c.title === 'string' ? c.title : undefined
    delete c.items
    if (title) c.title = title
  }
  return c
}

export function normalizePromoModules(pm) {
  if (pm === undefined || pm === null) return undefined
  if (!Array.isArray(pm)) throw new Error('promoModules 必须为数组')
  const seen = new Set(); const out = []
  for (const m of pm) {
    if (!m || typeof m !== 'object') continue
    if (!PROMO_MODULE_TYPES.includes(m.type)) continue
    const sort = Number.isFinite(Number(m.sort)) ? Number(m.sort) : out.length
    if (seen.has(sort)) continue
    seen.add(sort)
    out.push({ type: m.type, config: normalizeModuleConfig(m.type, m.config), sort })
  }
  return out.sort((a, b) => a.sort - b.sort)
}

export function defaultPromoModules() {
  return ["cover", "info", "rich", "highlights", "agenda", "rewards", "contact", "faq", "message"]
    .map((type, i) => ({ type, config: {}, sort: i + 1 }))
}

// 宽容修复 AI 输出的残缺 JSON（漏右花/方括号、多余闭合符、尾逗号）
export function repairJson(s) {
  let out = ''
  let inStr = false
  let esc = false
  const stack = []
  let last = ''
  const trimTrail = () => { if (last === ',') out = out.replace(/,\s*$/, '') }
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inStr) {
      if (esc) { out += ch; esc = false; continue }
      if (ch === '\\') { out += ch; esc = true; continue }
      if (ch === '"') {
        // 判断是正常字符串闭合还是未转义的内容引号：后面紧跟 JSON 结构符则为闭合，
        // 否则（如 "抗议" 出现在中文文案中）视为内容引号，转义 \” 保留原文
        let j = i + 1
        while (j < s.length && /\s/.test(s[j])) j++
        const nxt = s[j]
        if (nxt === ':' || nxt === ',' || nxt === '}' || nxt === ']' || nxt === undefined) {
          out += ch
          inStr = false
        } else {
          out += '\\"'
        }
        last = '"'
        continue
      }
      out += ch
      continue
    }
    if (ch === '"') { inStr = true; out += ch; last = '"'; continue }
    if (ch === '{' || ch === '[') { stack.push(ch); out += ch; last = ch; continue }
    if (ch === '}' || ch === ']') {
      // 前瞻：数组元素对象被提前双闭，导致后面 `,"sort":N}` 掉出元素。
      // 若此 `}` 闭合的 `{` 父级为数组 `[`，且紧随 `,` 后是 `"`（裸键，非法作数组元素）→ 该 `}` 为提前多余，跳过，由其后真正的 `}` 闭合对象。
      if (ch === '}' && stack[stack.length - 1] === '{' && stack[stack.length - 2] === '[') {
        let k = i + 1
        while (k < s.length && /\s/.test(s[k])) k++
        if (s[k] === ',') {
          let j = k + 1
          while (j < s.length && /\s/.test(s[j])) j++
          if (s[j] === '"') { continue }
        }
      }
      const expect = ch === '}' ? '{' : '['
      // 闭合符与栈顶不匹配 → 先补上栈顶缺失的闭合符（AI 漏括号）
      while (stack.length && stack[stack.length - 1] !== expect) {
        const open = stack.pop()
        trimTrail()
        out += open === '{' ? '}' : ']'
      }
      if (stack.length && stack[stack.length - 1] === expect) {
        stack.pop()
        trimTrail()
        out += ch
        last = ch
      }
      // 栈空仍有多余闭合符 → 忽略
      continue
    }
    if (ch === ',') {
      if (last === ',' || last === '{' || last === '[') continue // 重复/起始多余逗号
      out += ch
      last = ','
      continue
    }
    out += ch
    if (!/\s/.test(ch)) last = ch
  }
  // 末尾未闭合 → 补全
  while (stack.length) {
    const open = stack.pop()
    trimTrail()
    out += open === '{' ? '}' : ']'
  }
  return out
}

// 归一化 AI 宣传输出（仅宣传字段；返回 { ok, errors, data }）
// data = { title?, description?, promoModules, promoContact?, suggestFields }
export function parsePromoImport(rawText) {
  const errors = []
  let obj
  const cleaned = stripCodeBlock(rawText)
  try { obj = JSON.parse(cleaned) }
  catch (e) {
    // AI 输出常缺右花括号/尾逗号，严格解析失败后走宽容修复再解析
    try { obj = JSON.parse(repairJson(cleaned)) }
    catch (e2) { return { ok: false, errors: ['JSON 解析失败: ' + e2.message] } }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, errors: ['顶层必须是 JSON 对象'] }

  const data = {}
  if (typeof obj.title === 'string' && obj.title.trim()) data.title = obj.title.trim()
  if (typeof obj.description === 'string' && obj.description.trim()) {
    data.description = obj.description.trim().slice(0, 2000)
  }
  try { data.promoModules = normalizePromoModules(obj.promoModules) ?? defaultPromoModules() }
  catch (e) { errors.push('promoModules ' + e.message) }
  if (!data.promoModules.length) errors.push('promoModules 无有效模块')

  data.promoContact = obj.promoContact && typeof obj.promoContact === 'object' && !Array.isArray(obj.promoContact)
    ? obj.promoContact
    : null

  // AI 推荐的配色：优先取 12 色卡 paletteKey；兜底允许 AI 直接给六色值（逐键校验 #RRGGBB）
  if (typeof obj.paletteKey === 'string' && PALETTE_BY_KEY.has(obj.paletteKey)) {
    data.promoColors = { ...PALETTE_BY_KEY.get(obj.paletteKey).colors }
    data.paletteName = PALETTE_BY_KEY.get(obj.paletteKey).name
  } else if (obj.promoColors && typeof obj.promoColors === 'object' && !Array.isArray(obj.promoColors)) {
    const c = {}
    for (const k of ['primary', 'accent', 'bg', 'card', 'text', 'textDim']) {
      if (typeof obj.promoColors[k] === 'string' && /^#[0-9a-fA-F]{6}$/.test(obj.promoColors[k])) c[k] = obj.promoColors[k]
    }
    if (Object.keys(c).length >= 3) data.promoColors = c
  }

  // AI 建议的报名表单补充字段（仅返回展示，不自动写入）
  const seen = new Set()
  data.suggestFields = Array.isArray(obj.formConfig)
    ? obj.formConfig
        .filter(f => f && typeof f === 'object' && f.label)
        .map(f => ({ key: f.name || f.key || '', label: f.label, type: f.type || 'text', required: !!f.required }))
        .filter(f => f.label && !seen.has(f.label) && (seen.add(f.label), true))
    : []

  if (errors.length) return { ok: false, errors, data }
  return { ok: true, errors: [], data }
}

// 基于活动固定信息组装宣传文案生成提示词（AI 仅输出宣传字段）
export function buildPromoPrompt(a) {
  const fmt = v => (v === undefined || v === null || v === '') ? '（未提供）' : String(v)
  const fmtTime = (v) => {
    if (!v) return '（未提供）'
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const formCfg = Array.isArray(a.formConfig) && a.formConfig.length
    ? a.formConfig.map(f => `${f.label || f.key || ''}${f.required ? '(必填)' : ''}`).filter(Boolean).join('、') || '姓名、手机号'
    : '姓名、手机号'
  const rewards = a.rewardConfig && Array.isArray(a.rewardConfig.rewards) && a.rewardConfig.rewards.length
    ? a.rewardConfig.rewards.map(r => r.name).filter(Boolean).join('、')
    : '（无）'
  const lecturer = a.lecturer ? (a.lecturer.name || '已关联讲师') : '（未关联）'
  const venue = a.venue ? (a.venue.name || '已关联场地') : (a.venueName || '（未关联）')
  const assetsDesc = Array.isArray(a.promoAssets) && a.promoAssets.length
    ? a.promoAssets.map((im, i) => `图${i + 1}${im.scene ? '(' + im.scene + ')' : ''}`).join('、')
    : '（未提供）'
  const series = a.belongsToSeries ? (a.belongsToSeries.title || '已关联系列') : '（未关联）'
  const materials = a.assets && Array.isArray(a.assets.materials) && a.assets.materials.length
    ? a.assets.materials.map(m => m.name || m.url).filter(Boolean).join('、')
    : '（无）'
  const recording = a.assets && a.assets.recordingUrl ? '提供回放' : '（未提供）'
  const tags = Array.isArray(a.tags) && a.tags.length
    ? a.tags.map(t => (typeof t === 'string' ? t : (t.name || t.label || t.title || ''))).filter(Boolean).join('、')
    : '（无）'
  const checkinMap = { both: '双方自由核销', self: '自助核销', worker_scan: '工作人员扫码' }
  const checkin = a.checkinMode ? (checkinMap[a.checkinMode] || a.checkinMode) : '（未设置）'
  const geo = a.geoEnforced ? `启用地理围栏（半径 ${a.geoRadiusM ?? 500} 米）` : '未启用地理围栏'
  const questionnaire = a.questionnaire && a.questionnaire.enabled
    ? (Array.isArray(a.questionnaire.fields) && a.questionnaire.fields.length
        ? '启用' + (a.questionnaire.title ? `「${a.questionnaire.title}」` : '问卷') + '：' + a.questionnaire.fields.map(f => f.label || f.key).filter(Boolean).join('、')
        : '启用（未配置题目）')
    : '（未启用）'
  const pricingModeMap = { flat: '单一价', tier: '档位列表', factor: '因子叠加' }
  const pricing = a.pricingMode ? (pricingModeMap[a.pricingMode] || a.pricingMode) : '（未设置）'
  const feeCollect = a.feeCollectAt === 'checkin' ? '签到时收费' : '报名时扣费'
  const relTitles = arr => Array.isArray(arr) && arr.length
    ? arr.map(x => (typeof x === 'string' ? x : (x.title || x.name || ''))).filter(Boolean).join('、')
    : ''
  const preUnlock = []
  const unlockArticles = relTitles(a.preUnlockArticles)
  const unlockLessons = relTitles(a.preUnlockLessons)
  if (unlockArticles) preUnlock.push('文章：' + unlockArticles)
  if (unlockLessons) preUnlock.push('课时：' + unlockLessons)
  const unlockDesc = preUnlock.length ? preUnlock.join('；') : '（未配置）'
  const shareReward = a.shareRewardPoints ? `分享得 ${a.shareRewardPoints} 积分` : '（未设置）'
  const signupTime = a.signupStart || a.signupEnd
    ? `${fmtTime(a.signupStart)} ~ ${fmtTime(a.signupEnd)}`
    : '（未设置）'
  const pointsCost = a.pointsCost ? `${a.pointsCost} 积分` : '（不消耗积分）'
  const tierDesc = Array.isArray(a.feeTiers) && a.feeTiers.length
    ? a.feeTiers
        .filter(t => t && t.name)
        .map(t => `${t.name}${t.pointsCost ? '（' + t.pointsCost + '积分）' : '（免费）'}`)
        .join('、')
    : '（未配置）'
  const factorTypeMap = { window_discount: '窗口折扣', window_upcharge: '窗口加价', segment_discount_percent: '分段折扣百分比', flat_discount_amount: '固定折扣额' }
  const factorDesc = a.pricingMode === 'factor' && a.feeFactors
    ? `基础 ${a.feeFactors.base || 0} 积分` + (Array.isArray(a.feeFactors.factors) && a.feeFactors.factors.length
        ? '，因子：' + a.feeFactors.factors
            .filter(f => f && f.type)
            .map(f => (factorTypeMap[f.type] || f.type) + (f.amount ? `（${f.amount}）` : '') + (f.percent != null ? `（${f.percent}%）` : ''))
            .join('、')
        : '')
    : '（未配置）'
  const learningPkg = []
  const pkgArticles = relTitles(a.learningPackageArticles)
  const pkgLessons = relTitles(a.learningPackageLessons)
  if (pkgArticles) learningPkg.push('文章：' + pkgArticles)
  if (pkgLessons) learningPkg.push('课时：' + pkgLessons)
  const learningPkgDesc = learningPkg.length ? learningPkg.join('；') : '（未配置）'

  return [
    '你是活动营销宣传助手，核心目标是写出**高转化、强引流**的宣传文案，让目标用户看完就想报名。以下是运营已确定的活动固定信息（不得编造或修改时间/场地/讲师/名额/费用等已定内容，也不得编造电话/微信等联系方式）。只输出一个 JSON 对象，不要 markdown 代码块、不要注释、不要多余文字，必须是可被 JSON.parse 直接解析的合法 JSON。',
    '',
    '宣传文案创作要点：',
    '- 开篇抓痛点/痒点，突出「为什么值得来」「错过会怎样」',
    '- 用利益点而非功能点打动用户（收获/成长/人脉/体验/机会），把价值讲具体',
    '- 制造稀缺与紧迫感（名额有限、报名截止时间），结尾给出明确行动号召（立即报名/扫码咨询）',
    '- 用真实可感知的细节（时间、场地、讲师、费用、权益）支撑可信度，不夸大、不造假',
    '- 段落短小、口语化但有质感，适合手机端阅读，重要信息前置',
    '',
    '活动固定信息：',
    `- 标题: ${fmt(a.title)}`,
    `- 类型: ${fmt(a.type)}${a.category ? ' / 分类: ' + a.category : ''}`,
    `- 标签: ${tags}`,
    `- 起止时间: ${fmtTime(a.startTime)} ~ ${fmtTime(a.endTime)}`,
    `- 报名时间: ${signupTime}`,
    `- 场地: ${fmt(venue)}`,
    `- 名额: ${fmt(a.capacity)}`,
    `- 报名费: ${a.cashPrice != null ? fmt(a.cashPrice) + ' 元' : '（未提供）'}`,
    `- 积分成本: ${pointsCost}`,
    a.pricingMode === 'tier' ? `- 费用档位: ${tierDesc}` : null,
    a.pricingMode === 'factor' ? `- 计费因子: ${factorDesc}` : null,
    `- 收费方式: ${pricing}（${feeCollect}）`,
    `- 讲师: ${fmt(lecturer)}`,
    `- 所属系列: ${fmt(series)}`,
    `- 活动介绍: ${fmt(a.description)}`,
    `- 宣传组图场景: ${assetsDesc}`,
    `- 回放与资料: ${fmt(materials)} / ${fmt(recording)}`,
    `- 报名解锁内容: ${unlockDesc}`,
    `- 学习资料包: ${learningPkgDesc}`,
    `- 分享奖励: ${shareReward}`,
    `- 报名表单已收集: ${formCfg}`,
    `- 报名问卷: ${questionnaire}`,
    `- 报名权益: ${rewards}`,
    `- 核销到场: ${checkin} / ${geo}`,
    '',
    '输出 JSON 字段契约：',
    '- 通用规则：字符串值（尤其 html/faq/highlights 等中文文案）内禁止使用英文双引号 "，如需强调一律用中文引号「」或“”；JSON 的键与字符串定界符仍用英文双引号',
    '- title(string) 建议标题：保留原标题主体，可在不改变事实前提下增强吸引力与紧迫感',
    '- description(string,≤2000字) 活动介绍文案，基于已提供的介绍按上述营销要点润色扩写',
    '- promoModules(array) 宣传模块 [{type,config,sort}]，type 从 cover/info/rich/highlights/speakers/agenda/images/rewards/contact/message/faq/custom 选；各模块写作要求：',
    '  - cover.config={title,subtitle}：主标题抓眼球、副标题点明价值或时间地点',
    '  - rich.config={html}：宣传正文，用 HTML（p/strong/br 等简单标签）分段落',
    '  - highlights.config={items:[字符串]}：3~6 条「值得参加的理由/价值点」，每条一句话直击利益',
    '  - agenda.config={items:[{t,title,desc}]}：议程用时间+标题+简述',
    '  - faq.config={items:[{q,a}]}：主动消除报名顾虑（价格、请假、零基础、报名方式等）',
    '  - images.config={images:[网络图片URL]}：图片墙；不要编造不存在的图片地址，可留空由运营粘贴',
    '  - custom.config={title,html,images}：自定义块，富文本自由排版，用于固定模块满足不了的图文混排/专题区块；images 为网络图片 URL 数组，不要编造地址，留空由运营粘贴',
    '  - speakers 不要写 items（C端读已关联讲师）；info/rewards/contact/message 无需 config（读活动固定信息）',
    '  - 按宣传节奏组合排序：先 cover 钩子 → 价值/议程 → 打消顾虑 faq → 联系方式/留言收尾',
    '- promoContact(object) {phone,wechat,note} 禁止编造电话与微信号：无法确定时填 "请运营替换"',
    '- formConfig(array) 建议报名表单补充字段 [{name,label,type,required}]，type 从 text/textarea/number/select/radio/checkbox/date 选；仅建议补充，不要重复已有字段',
    '- paletteKey(string,可选) 按活动气质推荐 1 套配色：仅可从下方 12 套色卡中选择 1 个 key，不要自创色值；不确定可不输出',
    '',
    '12 套配色色卡（仅选 key，勿自创色值）：',
    ...PROMO_PALETTES.map(p => `- ${p.key}（${p.name}）：主色 ${p.colors.primary} / 背景 ${p.colors.bg} / 卡片 ${p.colors.card}`),
    '  选色建议：峰会/高端 → summit-gold 或 biz-navy；科技/培训 → tech-purple 或 training-green；亲子/生活 → family-pink 或 life-rose；营销/促销 → action-red 或 amber-warm；沙龙/交流 → salon-indigo 或 art-violet；自然/健康 → nature-green 或 sky-blue',
    '',
    '模块选用指引：',
    '- 优先使用固定模块（cover/rich/highlights/agenda/faq/images 等）保证结构清晰',
    '- 若客户需要固定模块无法满足的自由排版、图文混排或专题区块，在需要处使用 custom 自定义块（富文本 HTML + 网络图片 URL 数组，images 留空避免假链接），C 端按 sort 顺序渲染',
    '',
    '请输出 JSON。',
  ].filter(Boolean).join('\n')
}
