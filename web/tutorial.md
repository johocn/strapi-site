# 交互官网平台实例教程

> 版本：1.0.0 | 基于 Strapi v5 + Nuxt 3 + uni-app | 面向运营/开发/销售演示 | 从零到上线全流程

---

## 目录

- [1. 环境准备](#1-环境准备)
- [2. 多租户配置](#2-多租户配置)
- [3. 分类与标签体系](#3-分类与标签体系)
- [4. 7 个 CT 内容创建](#4-7-个-ct-内容创建)
- [5. Strapi Admin UI 操作示例](#5-strapi-admin-ui-操作示例)
- [6. Studio Bridge 深度演示](#6-studio-bridge-深度演示)
- [7. dsite 前端联调](#7-dsite-前端联调)
- [8. 验收清单](#8-验收清单)

---

## 1. 环境准备

### 1.1 前置条件

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | 20.0+ | 推荐 LTS 版本 |
| PostgreSQL | 14+ | 主数据库 |
| Redis | 6+ | 可选，用于缓存与会话 |
| npm | 10+ | 包管理工具 |

**操作系统要求**：

| 系统 | 版本 | 说明 |
|------|------|------|
| Windows | 10/11 | 推荐使用 WSL2 |
| macOS | 12+ | 推荐 |
| Linux | Ubuntu 20.04+ | 生产推荐 |

**目录结构约定**：

```
e:\code\
├── basic\          # Strapi 后端
├── dsite\          # Nuxt 3 前端
├── studio\         # zhao-studio 内容生产
└── web\            # 文档目录（本教程所在位置）
```

### 1.2 启动 Strapi

**操作步骤**：

1. 打开终端（Windows 推荐 PowerShell 或 Windows Terminal）
2. 切换到后端目录：

```bash
cd e:\code\basic
```

3. 安装依赖（首次运行或拉取新代码后执行）：

```bash
npm install
```

4. 启动 Strapi 开发模式：

```bash
npm run develop
```

5. 等待控制台输出以下日志，表示启动成功：

```
[INFO] Server listening on http://localhost:1337
[INFO] Welcome to Strapi v5.x
```

> 📷 截图：Strapi 启动成功控制台日志，红框标注 `Server listening` 与 `Welcome` 两行

### 1.3 验证 bootstrap 自动创建默认数据

Strapi 启动时，`bootstrap` 钩子会自动种子化默认数据，包括 1 个默认 site-config 和 5 套预设模板。

**验证步骤**：

1. 打开浏览器，访问 `http://localhost:1337/admin`
2. 首次访问会跳转到管理员注册页面
3. 暂不注册，先验证数据库种子是否写入成功
4. 打开新终端执行以下命令查询数据库：

```bash
# 在 basic 目录下执行
psql -U postgres -d strapi_db -c "SELECT site_name, domain FROM zhao_website_site_configs;"
psql -U postgres -d strapi_db -c "SELECT name, code FROM zhao_website_site_templates;"
```

**预期输出**：

```
   site_name    | domain
----------------+--------
 默认站点       | (null)
(1 row)

   name    |   code
-----------+---------
 默认模板   | default
 极简模板   | minimal
 商务模板   | business
 科技模板   | tech
 教育模板   | education
(5 rows)
```

> 📷 截图：psql 查询结果，显示 1 条 site-config 与 5 条 site-template

### 1.4 创建管理员账号

**操作步骤**：

1. 浏览器访问 `http://localhost:1337/admin`
2. 在「注册管理员」页面填写以下信息：

| 字段 | 填写内容 | 说明 |
|------|----------|------|
| 名 | Admin | 管理员名 |
| 姓 | Root | 管理员姓 |
| 邮箱 | admin@joho.cn | 用于登录 |
| 密码 | Admin@2026 | 至少 8 位含大小写数字 |
| 确认密码 | Admin@2026 | 与上一步一致 |

3. 点击「Let's start」按钮
4. 系统自动登录进入 Strapi 后台首页

> 📷 截图：管理员注册页面，标注 5 个必填字段

### 1.5 验证公开 API 可访问

**操作步骤**：

1. 打开新终端执行以下 curl 命令：

```bash
curl http://localhost:1337/api/zhao-website/v1/site-info
```

2. 预期返回 JSON（已格式化）：

```json
{
  "data": {
    "siteName": "默认站点",
    "siteDescription": "",
    "domain": null,
    "icpNumber": "",
    "seoKeywords": "",
    "customerServiceUrl": "",
    "channelUsage": "site_cross_user",
    "featureFlags": {
      "sso": false,
      "points": false,
      "quiz": false,
      "course": false,
      "channel": false,
      "thirdParty": false,
      "oss": false
    },
    "template": {
      "code": "default",
      "name": "默认模板"
    }
  }
}
```

3. 如果返回 404，请检查：
   - Strapi 是否已完全启动
   - `basic/src/api/zhao-website` 目录是否存在
   - `site-resolver` 中间件是否注册

> 📷 截图：curl 命令与返回的 JSON 输出

### 1.6 技术原理

> 💡 **技术原理**
>
> **bootstrap 种子机制**：Strapi 在 `src/index.ts` 的 `bootstrap` 函数中检查 `site-config` 表，若为空则插入默认记录。`site-template` 同理插入 5 套预设模板。该机制保证首次启动即可用，无需手动初始化。
>
> **site-resolver 识别优先级**：公开 API 通过 `site-resolver` 中间件识别当前租户，优先级为：
> 1. `x-site-domain` 请求头
> 2. `?domain=` 查询参数
> 3. Host 头匹配 site-config.domain
> 4. 兜底返回 domain 为 null 的默认 site-config
>
> 因此在未配置 domain 时，curl 默认命中默认 site-config。
>
> **默认 site-config 无 domain 的原因**：默认记录作为兜底，不应被具体域名绑定，避免与其他租户冲突。在正式配置时应填入真实 domain。

---

## 2. 多租户配置

### 2.1 编辑默认 site-config

**操作步骤**：

1. 登录 Strapi 后台 `http://localhost:1337/admin`
2. 左侧菜单点击「Content Manager」
3. 在左侧 Collection Types 列表中找到「Site Config」
4. 点击列表中「默认站点」记录进入编辑页
5. 按下表填写字段：

| 字段名称 | 填写内容 | 说明 |
|----------|----------|------|
| siteName | 交互官网平台 | 站点显示名称 |
| siteDescription | 多租户企业官网平台，一站式内容管理与全渠道发布 | 站点描述 |
| domain | localhost | 本地开发用域名 |
| icpNumber | 沪ICP备2026000001号 | 备案号 |
| seoKeywords | 官网平台,多租户,内容管理,SSR,SEO | 关键词逗号分隔 |
| customerServiceUrl | https://www.joho.cn | 客服入口 URL |
| channelUsage | site_cross_user | 渠道使用模式 |

6. 点击右上角「Save」按钮保存

> 📷 截图：Site Config 编辑页全屏，红框标注各字段填写内容

### 2.2 选择模板

**操作步骤**：

1. 在 site-config 编辑页找到「template」关联字段
2. 点击字段右侧的「+ Add an item」按钮
3. 在弹出的选择器中选择「默认模板（default）」
4. 点击「Done」按钮确认

**5 套预设模板对照表**：

| 模板 code | 模板名称 | 适用场景 |
|-----------|----------|----------|
| default | 默认模板 | 通用官网 |
| minimal | 极简模板 | 个人/小团队 |
| business | 商务模板 | B2B 企业 |
| tech | 科技模板 | 科技产品 |
| education | 教育模板 | 教育培训 |

> 📷 截图：模板选择器弹窗，高亮「默认模板」选项

### 2.3 配置 featureFlags

**操作步骤**：

1. 在 site-config 编辑页找到「featureFlags」JSON 字段
2. 点击字段展开 JSON 编辑器
3. 填入以下完整 JSON：

```json
{
  "sso": false,
  "points": false,
  "quiz": false,
  "course": false,
  "channel": true,
  "thirdParty": false,
  "oss": true
}
```

4. 点击右上角「Save」按钮保存

**featureFlags 字段说明**：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| sso | boolean | false | 单点登录 |
| points | boolean | false | 积分系统 |
| quiz | boolean | false | 题库管理 |
| course | boolean | false | 课程管理 |
| channel | boolean | false | 渠道管理 |
| thirdParty | boolean | false | 三方登录 |
| oss | boolean | false | OSS 对象存储 |

> 📷 截图：featureFlags JSON 编辑器，显示完整 7 个开关

### 2.4 创建 channel

**操作步骤**：

1. 左侧菜单点击「Content Manager」
2. 在 Collection Types 列表中点击「Channel」
3. 点击右上角「+ Create new entry」按钮
4. 按下表填写字段：

| 字段名称 | 填写内容 | 说明 |
|----------|----------|------|
| name | 官方直营 | 渠道名称 |
| code | official | 渠道代码 |
| channelTier | official | 渠道层级（枚举） |
| description | 交互官网平台官方直营渠道 | 渠道描述 |
| isActive | true | 启用状态 |

5. 点击右上角「Save」按钮保存

**channelTier 枚举说明**：

| 枚举值 | 显示名称 | 说明 |
|--------|----------|------|
| root | 根渠道 | 平台级 |
| official | 官方渠道 | 官方直营 |
| partner | 合作伙伴 | 合作渠道 |
| agent | 代理渠道 | 代理商 |

> 📷 截图：Channel 创建表单全屏，标注 5 个字段

### 2.5 关联 channel 到 site-config

**操作步骤**：

1. 左侧菜单回到「Content Manager」→「Site Config」
2. 点击「交互官网平台」记录进入编辑
3. 找到「channels」关联字段
4. 点击「+ Add an item」按钮
5. 在弹窗中选择上一步创建的「官方直营」渠道
6. 点击「Done」按钮
7. 点击右上角「Save」按钮保存

> 📷 截图：site-config 编辑页 channels 字段已关联「官方直营」渠道

### 2.6 验证 site-info API

**操作步骤**：

1. 打开终端执行：

```bash
curl http://localhost:1337/api/zhao-website/v1/site-info
```

2. 预期返回完整 JSON：

```json
{
  "data": {
    "siteName": "交互官网平台",
    "siteDescription": "多租户企业官网平台，一站式内容管理与全渠道发布",
    "domain": "localhost",
    "icpNumber": "沪ICP备2026000001号",
    "seoKeywords": "官网平台,多租户,内容管理,SSR,SEO",
    "customerServiceUrl": "https://www.joho.cn",
    "channelUsage": "site_cross_user",
    "featureFlags": {
      "sso": false,
      "points": false,
      "quiz": false,
      "course": false,
      "channel": true,
      "thirdParty": false,
      "oss": true
    },
    "template": {
      "code": "default",
      "name": "默认模板"
    },
    "channels": [
      {
        "name": "官方直营",
        "code": "official",
        "channelTier": "official"
      }
    ]
  }
}
```

> 📷 截图：curl 返回的完整 site-info JSON，红框标注 siteName 与 channels

### 2.7 技术原理

> 💡 **技术原理**
>
> **site-config 与 site-template 关系**：site-template 是模板定义（包含布局、主题色、组件清单），site-config 通过一对一关联引用模板，决定站点视觉风格。一个模板可被多个 site-config 复用。
>
> **channelUsage 枚举**：
> - `site_only_user`：仅展示站点渠道数据，不跨渠道
> - `site_cross_user`：跨渠道可见，用户可浏览其他渠道内容（推荐）
> - `channel_isolated`：渠道完全隔离，需切换渠道上下文
>
> **featureFlags 作用**：开关在公开 API 与 Admin UI 同时生效。关闭时对应 API 端点返回 404，Admin UI 隐藏对应菜单，避免暴露未启用能力。
>
> **domain unique 约束**：site-config.domain 字段在数据库层有 unique 索引，避免多租户域名冲突。domain 为 null 的记录不参与 unique 校验，可作为兜底。

---

## 3. 分类与标签体系

### 3.1 创建 5 个 article-category

**操作步骤**：

1. 左侧菜单点击「Content Manager」
2. 在 Collection Types 列表中点击「Article Category」
3. 点击右上角「+ Create new entry」按钮
4. 按下表依次创建 5 条分类：

| 序号 | name | slug | description |
|------|------|------|-------------|
| 1 | 产品动态 | product-news | 产品版本更新、新功能发布 |
| 2 | 行业洞察 | industry-insights | 行业趋势、市场分析 |
| 3 | 客户故事 | customer-stories | 客户案例与最佳实践 |
| 4 | 产品教程 | product-tutorials | 使用教程与最佳实践 |
| 5 | 公告通知 | announcements | 平台公告、活动通知 |

5. 每条记录填写完成后点击「Save」按钮，再点击「Publish」按钮发布

**article-category 字段说明**：

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| name | * | string | 分类显示名称 |
| slug | * | uid | URL 友好标识，自动生成 |
| description | | text | 分类描述 |

> 📷 截图：Article Category 列表页，显示 5 条已发布记录

### 3.2 创建 15 个 tag

**操作步骤**：

1. 左侧菜单点击「Content Manager」→「Tag」
2. 点击「+ Create new entry」
3. 按以下 3 组依次创建 15 个标签：

**第 1 组：产品类（5 个）**

| name | slug | group |
|------|------|-------|
| 多租户 | multi-tenant | product |
| SSR | ssr | product |
| SEO优化 | seo-optimization | product |
| 内容管理 | content-management | product |
| 模板系统 | template-system | product |

**第 2 组：行业类（4 个）**

| name | slug | group |
|------|------|-------|
| 企业服务 | enterprise-service | industry |
| SaaS | saas | industry |
| B2B | b2b | industry |
| 数字化转型 | digital-transformation | industry |

**第 3 组：功能类（4 个）**

| name | slug | group |
|------|------|-------|
| 知识图谱 | knowledge-graph | feature |
| 真值管理 | first-truth | feature |
| AI摘要 | ai-summary | feature |
| Studio Bridge | studio-bridge | feature |

4. 每条填写 name、slug、group 三个字段后点击「Save」→「Publish」

**Tag 字段说明**：

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| name | * | string | 标签显示名称 |
| slug | * | uid | URL 友好标识 |
| group | * | enum | 分组：product/industry/feature |

> 📷 截图：Tag 列表页，按 group 筛选显示 15 条记录

### 3.3 验证列表

**操作步骤**：

1. 在 Tag 列表页点击右上角「Filters」按钮
2. 添加过滤条件 `group = product`
3. 应显示 5 条产品类标签
4. 重复筛选 `industry`、`feature`，分别应显示 4 条

> 📷 截图：Tag 列表筛选 group=product 的结果

### 3.4 技术原理

> 💡 **技术原理**
>
> **article-category 共用机制**：article-category 是单一 Collection Type，被 article、tutorial、download 等多个 CT 通过 manyToOne 引用，避免为每个 CT 重复建表。
>
> **tag manyToMany 跨 CT 复用**：tag 与所有内容 CT（product/case/article/faq/tutorial/download）建立 manyToMany 关系。一个标签可被多种内容引用，标签维度做内容聚合（如「多租户」标签下聚合产品+文章+案例）。
>
> **slug uid 生成**：slug 字段类型为 Strapi `uid`，目标字段为 name，自动生成时去除空格、转小写、替换连字符。若 slug 已存在则追加数字后缀（如 `multi-tenant-1`）。

---

## 4. 7 个 CT 内容创建

本章覆盖 7 个 Collection Type 共 34 条内容数据的完整创建流程。每个 CT 小节包含字段说明表、完整 JSON 数据、操作步骤、验证方法。

### 4.1 product（1 个）

#### 4.1.1 字段说明

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| name | * | string | 产品名称 |
| tagline | * | string | 一句话标语 |
| slug | * | uid | URL 友好标识 |
| description | * | richtext | 产品描述（HTML） |
| priceRange | | string | 价格区间 |
| features | * | json | 功能特性数组 |
| specifications | | json | 技术规格对象 |
| scenarios | | json | 应用场景数组 |
| isFeatured | | boolean | 是否精选 |
| category | | relation | 关联 article-category |
| tags | | relation | 关联 tag（多对多） |

#### 4.1.2 完整 JSON 数据

```json
{
  "name": "交互官网平台",
  "tagline": "多租户企业官网平台，一站式内容管理与全渠道发布",
  "slug": "interactive-website-platform",
  "description": "<p>交互官网平台是一款面向中大型企业的多租户官网建设解决方案，基于 Strapi v5 + Nuxt 3 + uni-app 构建，提供从内容生产、多租户管理到全渠道发布的一站式能力。平台支持 SSR 渲染、SEO 优化、知识图谱、真值管理、AI 摘要等高级能力，帮助企业以最低成本构建专业官网矩阵。</p>",
  "priceRange": "联系咨询",
  "features": [
    "多租户隔离",
    "SSR 渲染",
    "模板系统",
    "知识图谱",
    "SEO 优化",
    "Studio 内容生产"
  ],
  "specifications": {
    "技术栈": "Strapi v5 + Nuxt 3 + uni-app",
    "部署": "Node.js + PostgreSQL",
    "并发": "1000+ QPS",
    "存储": "OSS 兼容"
  },
  "scenarios": [
    {
      "name": "企业官网",
      "desc": "B2B 企业品牌展示与内容营销"
    },
    {
      "name": "多租户 SaaS",
      "desc": "为每个客户提供独立官网站点"
    },
    {
      "name": "教育门户",
      "desc": "课程展示与招生转化"
    }
  ],
  "isFeatured": true,
  "category": "产品动态",
  "tags": ["多租户", "SSR", "内容管理", "企业服务", "SaaS"]
}
```

#### 4.1.3 操作步骤

1. 左侧菜单「Content Manager」→「Product」→「+ Create new entry」
2. 在「name」字段填入「交互官网平台」
3. 在「tagline」字段填入「多租户企业官网平台，一站式内容管理与全渠道发布」
4. slug 字段自动生成为 `interactive-website-platform`，确认即可
5. 在「description」富文本编辑器中切换到 HTML 源码模式，粘贴 JSON 中 description 的 HTML 内容
6. 「priceRange」填入「联系咨询」
7. 在「features」JSON 字段粘贴完整数组
8. 在「specifications」JSON 字段粘贴完整对象
9. 在「scenarios」JSON 字段粘贴完整数组
10. 「isFeatured」开关打开
11. 在「category」字段选择「产品动态」
12. 在「tags」字段依次添加「多租户」「SSR」「内容管理」「企业服务」「SaaS」5 个标签
13. 点击右上角「Save」→「Publish」

> 📷 截图：Product 编辑页全屏，标注 features/specifications/scenarios 三个 JSON 字段

#### 4.1.4 验证

```bash
curl "http://localhost:1337/api/zhao-website/v1/products?slug=interactive-website-platform"
```

预期返回包含完整字段的产品对象。

### 4.2 case（3 个）

#### 4.2.1 字段说明

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| title | * | string | 案例标题 |
| clientName | * | string | 客户名称 |
| clientIndustry | * | string | 客户行业 |
| challenge | * | richtext | 挑战描述（HTML） |
| solution | * | richtext | 解决方案（HTML） |
| results | * | json | 成果数据数组 |
| testimonial | | text | 客户证言 |
| testimonialAuthor | | string | 证言人姓名 |
| testimonialTitle | | string | 证言人职位 |
| isFeatured | | boolean | 是否精选 |
| tags | | relation | 关联 tag |

#### 4.2.2 案例 1：某制造业集团

```json
{
  "title": "某大型制造业企业官网矩阵建设",
  "clientName": "某制造业集团",
  "clientIndustry": "制造业",
  "challenge": "<p>集团下属 20+ 子品牌，各自维护独立官网，内容重复且品牌形象不统一。每个子品牌官网独立部署，运维成本高昂，更新效率低下，SEO 效果参差不齐。</p>",
  "solution": "<p>采用交互官网平台多租户架构，为每个子品牌创建独立站点，共享一套代码与基础设施。通过模板系统统一品牌视觉规范，通过内容中心集中管理新闻、产品、案例，再分发到各子站点。</p>",
  "results": [
    {
      "metric": "建站效率",
      "value": "提升 80%"
    },
    {
      "metric": "品牌一致性",
      "value": "100%"
    },
    {
      "metric": "运维成本",
      "value": "降低 60%"
    }
  ],
  "testimonial": "交互官网平台让我们 20 个子品牌官网在 2 个月内全部上线。",
  "testimonialAuthor": "张总监",
  "testimonialTitle": "数字化营销负责人",
  "isFeatured": true,
  "tags": ["多租户", "企业服务", "数字化转型"]
}
```

#### 4.2.3 案例 2：某教育机构

```json
{
  "title": "某教育机构招生官网升级",
  "clientName": "某教育机构",
  "clientIndustry": "教育",
  "challenge": "<p>原有官网使用传统 CMS 搭建，加载速度慢，移动端体验差，SEO 收录率不足 40%。招生季官网访问量大，频繁宕机，留资转化率仅 2.1%。</p>",
  "solution": "<p>基于交互官网平台 SSR 渲染能力重构官网，所有页面服务端预渲染，首屏加载时间从 4.2s 降至 0.9s。集成留资表单与 Dashboard 线索中心，潜在客户信息实时入库。移动端采用 uni-app 自适应方案。</p>",
  "results": [
    {
      "metric": "首屏加载",
      "value": "0.9s（降 78%）"
    },
    {
      "metric": "SEO 收录率",
      "value": "92%（升 130%）"
    },
    {
      "metric": "招生转化",
      "value": "提升 150%"
    }
  ],
  "testimonial": "SSR 重构后我们的官网在百度搜索结果排名大幅提升，留资量翻了 2.5 倍。",
  "testimonialAuthor": "李经理",
  "testimonialTitle": "市场总监",
  "isFeatured": true,
  "tags": ["SSR", "SEO优化", "数字化转型"]
}
```

#### 4.2.4 案例 3：某 SaaS 公司

```json
{
  "title": "某 SaaS 公司内容营销官网建设",
  "clientName": "某 SaaS 公司",
  "clientIndustry": "SaaS",
  "challenge": "<p>初创 SaaS 公司需要快速建立内容营销体系，但技术团队规模小，无法自建官网 CMS。希望以博客、产品文档、客户案例为核心驱动自然搜索流量。</p>",
  "solution": "<p>使用交互官网平台 business 模板快速搭建，3 天上线。通过 Studio Bridge 将 Notion 中的产品文档一键发布为官网文章，AI 摘要自动生成 SEO 描述。知识图谱关联产品-文章-案例，提升页面深度。</p>",
  "results": [
    {
      "metric": "建站周期",
      "value": "3 天"
    },
    {
      "metric": "官网访问量",
      "value": "提升 200%"
    },
    {
      "metric": "自然搜索流量",
      "value": "占比 65%"
    }
  ],
  "testimonial": "Studio Bridge 让我们的产品文档直接成为官网内容，AI 摘要省去了大量编辑工作。",
  "testimonialAuthor": "王 CEO",
  "testimonialTitle": "创始人",
  "isFeatured": false,
  "tags": ["SaaS", "内容管理", "Studio Bridge"]
}
```

#### 4.2.5 操作步骤

1. 左侧菜单「Content Manager」→「Case」→「+ Create new entry」
2. 按上述 JSON 依次填写字段
3. challenge/solution 字段切到 HTML 源码模式粘贴
4. results 字段粘贴完整 JSON 数组
5. tags 字段关联对应标签
6. 点击「Save」→「Publish」
7. 重复 3 次创建 3 条案例

> 📷 截图：Case 编辑页，标注 results JSON 数组与 testimonial 三字段

### 4.3 article（5 篇）

#### 4.3.1 字段说明

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| title | * | string | 文章标题 |
| slug | * | uid | URL 标识 |
| excerpt | * | string | 摘要（150 字内） |
| content | * | richtext | 正文（HTML） |
| coverImage | | media | 封面图 |
| category | * | relation | 关联 article-category |
| tags | | relation | 关联 tag |
| author | | string | 作者 |
| seoTitle | | string | SEO 标题 |
| seoDescription | | string | SEO 描述 |
| allowIndex | | boolean | 是否允许收录 |
| readingTime | | integer | 阅读时长（分钟） |
| status | * | enum | draft/published |

#### 4.3.2 文章 1：多租户架构

```json
{
  "title": "多租户架构：一套代码如何支撑 100+ 企业官网",
  "slug": "multi-tenant-architecture-100-sites",
  "excerpt": "本文解析交互官网平台的多租户架构，从域名识别、数据隔离到模板差异化，实测支撑 100+ 站点，QPS 800+。",
  "content": "<h2>引言</h2><p>企业级官网矩阵建设中，多租户架构是核心技术基础。一套代码支撑多个独立站点，既能保证品牌隔离，又能最大化复用基础设施。本文以交互官网平台为例，深入剖析多租户架构的设计与实现。</p><h2>一、多租户架构的三种模式</h2><p>业界常见三种多租户模式：独立数据库、共享数据库独立 Schema、共享数据库共享 Schema。交互官网平台采用第三种，通过 site_id 字段在行级隔离数据，兼顾成本与性能。</p><h2>二、域名识别与租户路由</h2><p>site-resolver 中间件按优先级识别当前租户：x-site-domain 头 > 查询参数 > Host 头 > 默认兜底。识别后注入 ctx.state.site，后续所有查询自动过滤。</p><h2>三、数据隔离实现</h2><p>每个内容 CT 都包含 site_id 关联字段，通过 lifecycle hook 在创建时自动注入当前 site，在查询时自动 filter。开发者无需手动处理。</p><h2>四、模板差异化</h2><p>site-template 定义布局与主题，site-config 关联模板。同一模板可被多站点复用，通过主题色、Logo、组件开关实现视觉差异。</p><h2>五、性能实测</h2><p>在 4 核 8G 测试环境，100 个站点、10 万篇文章规模下，列表接口 P95 延迟 120ms，QPS 800+，满足企业级要求。</p><h2>总结</h2><p>多租户架构是官网矩阵建设的关键，交互官网平台通过共享 Schema + 行级隔离 + 模板差异化，实现了高复用、高性能、强隔离的平衡。</p>",
  "coverImage": "/uploads/multi-tenant-cover.jpg",
  "category": "行业洞察",
  "tags": ["多租户", "SSR", "企业服务"],
  "author": "产品技术团队",
  "seoTitle": "多租户架构实战：一套代码支撑 100+ 企业官网 | 交互官网平台",
  "seoDescription": "深入解析交互官网平台多租户架构，从域名识别到数据隔离，实测支撑 100+ 站点 QPS 800+。",
  "allowIndex": true,
  "readingTime": 8,
  "status": "published"
}
```

#### 4.3.3 文章 2：SSR + 同域反代

```json
{
  "title": "SSR + 同域反代：企业级官网的 SEO 最优解",
  "slug": "ssr-reverse-proxy-seo-best-practice",
  "excerpt": "对比 CSR/SSG/SSR 三种渲染模式，详解交互官网平台的 SSR + 同域反代方案，兼顾 SEO 与性能。",
  "content": "<h2>引言</h2><p>企业官网的 SEO 直接影响获客效率，而渲染模式选择是 SEO 的根本。本文对比三种渲染模式，给出企业级官网的最优解。</p><h2>一、三种渲染模式对比</h2><p>CSR（客户端渲染）：JS 加载后渲染，SEO 差；SSG（静态生成）：构建时生成 HTML，SEO 好但更新慢；SSR（服务端渲染）：请求时渲染，SEO 好且实时。企业官网内容更新频繁，SSR 是最优解。</p><h2>二、同域反代的必要性</h2><p>若 Strapi 与 Nuxt 分属不同域名，搜索引擎可能判定为两个站点，权重分散。同域反代将 /api 转发到 Strapi，/ 转发到 Nuxt，保证同域。</p><h2>三、Nuxt routeRules 配置</h2><p>在 nuxt.config.ts 中通过 routeRules 配置代理：'/**': { proxy: 'http://localhost:3000/**' }，'/api/**': { proxy: 'http://localhost:1337/api/**' }。</p><h2>四、useSeoMeta 自动注入</h2><p>Nuxt 3 的 useSeoMeta 组合式 API 在 SSR 阶段注入 meta 标签，包括 title、description、og、twitter 等，搜索引擎抓取即可见。</p><h2>五、实测效果</h2><p>采用 SSR + 同域反代后，百度收录率从 40% 提升至 92%，Google 收录率 95%+，关键词排名显著提升。</p><h2>总结</h2><p>SSR + 同域反代是企业级官网的 SEO 最优解，交互官网平台开箱即用，无需额外配置。</p>",
  "coverImage": "/uploads/ssr-seo-cover.jpg",
  "category": "行业洞察",
  "tags": ["SSR", "SEO优化"],
  "author": "前端架构团队",
  "seoTitle": "SSR + 同域反代：企业级官网 SEO 最优解 | 交互官网平台",
  "seoDescription": "对比 CSR/SSG/SSR 三种渲染模式，详解交互官网平台 SSR + 同域反代方案，SEO 收录率提升至 92%。",
  "allowIndex": true,
  "readingTime": 6,
  "status": "published"
}
```

#### 4.3.4 文章 3：模板系统设计

```json
{
  "title": "模板系统设计：从代码层到配置层的渐进式演进",
  "slug": "template-system-progressive-evolution",
  "excerpt": "回顾交互官网平台模板系统从硬编码到配置化的演进历程，分享配置层抽象的实践经验。",
  "content": "<h2>引言</h2><p>模板系统是低代码建站的核心。本文回顾交互官网平台模板系统从 v1 硬编码到 v3 配置化的演进历程。</p><h2>一、v1 硬编码时代</h2><p>初期每个模板独立目录，组件组合写死在代码中。新增模板需发版，定制需求堆积导致代码膨胀。</p><h2>二、v2 组件注册</h2><p>引入组件注册机制，模板通过 JSON 声明包含的组件清单。但仍需开发者介入，运营无法自助。</p><h2>三、v3 配置化</h2><p>site-template 抽象为纯配置：布局（页头/导航/页脚）+ 主题（颜色/字体）+ 组件开关。运营在 Admin UI 拖拽即可生成新模板。</p><h2>四、模板继承与覆盖</h2><p>子模板可继承父模板配置，覆盖部分字段。如「商务模板-蓝色变体」继承「商务模板」，仅修改主题色。</p><h2>五、性能优化</h2><p>模板配置在构建时静态化，运行时直接读取，无数据库查询开销。模板变更通过 ISR 增量再生。</p><h2>总结</h2><p>从代码到配置的演进是低代码平台的必经之路，配置化让运营自助、让开发者聚焦核心。</p>",
  "coverImage": "/uploads/template-system-cover.jpg",
  "category": "产品动态",
  "tags": ["模板系统", "内容管理"],
  "author": "产品团队",
  "seoTitle": "模板系统设计：从代码层到配置层的渐进式演进 | 交互官网平台",
  "seoDescription": "回顾交互官网平台模板系统从硬编码到配置化的演进，分享配置层抽象实践经验。",
  "allowIndex": true,
  "readingTime": 7,
  "status": "published"
}
```

#### 4.3.5 文章 4：知识图谱 + 真值管理

```json
{
  "title": "知识图谱 + 真值管理：让 AI 真正理解你的内容",
  "slug": "knowledge-graph-first-truth-ai",
  "excerpt": "介绍交互官网平台知识图谱与真值管理两大能力，如何为 AI 摘要、智能问答提供可信数据基础。",
  "content": "<h2>引言</h2><p>AI 时代，内容不再只是给人看，还要给 AI 看。知识图谱与真值管理是让 AI 真正理解内容的两大支柱。</p><h2>一、知识图谱：内容的结构化</h2><p>知识图谱将内容中的实体（人、组织、产品）与关系建模为图结构。交互官网平台支持 Organization/Person/Product/Event 等实体类型，关系可自定义。</p><h2>二、JSON-LD 标准输出</h2><p>知识图谱以 JSON-LD 格式嵌入页面，搜索引擎与 AI 助手可直接解析。Google 富结果依赖 JSON-LD，是 SEO 加分项。</p><h2>三、真值管理：单一事实来源</h2><p>真值（First-Truth）是关键事实的权威记录，如公司成立年份、注册资本、法定代表人。每条真值含 source 来源与 confidence 置信度。</p><h2>四、冲突检测机制</h2><p>扫描所有内容与真值的字段，发现冲突时标红提示。如某文章写「成立于 2016 年」，真值为「2015 年」，自动告警。</p><h2>五、AI 摘要的可信基础</h2><p>AI 摘要基于真值生成，避免幻觉。如生成公司介绍时，强制引用真值库中的成立年份、注册资本，确保准确。</p><h2>总结</h2><p>知识图谱让内容结构化，真值管理让内容可信化，二者结合为 AI 时代的内容运营奠定基础。</p>",
  "coverImage": "/uploads/knowledge-graph-cover.jpg",
  "category": "产品动态",
  "tags": ["知识图谱", "真值管理", "AI摘要"],
  "author": "AI 产品团队",
  "seoTitle": "知识图谱 + 真值管理：让 AI 真正理解你的内容 | 交互官网平台",
  "seoDescription": "介绍交互官网平台知识图谱与真值管理两大能力，为 AI 摘要与智能问答提供可信数据基础。",
  "allowIndex": true,
  "readingTime": 9,
  "status": "published"
}
```

#### 4.3.6 文章 5：Studio Bridge

```json
{
  "title": "Studio Bridge：内容生产到发布的一键闭环",
  "slug": "studio-bridge-one-click-publish",
  "excerpt": "Studio Bridge 打通 zhao-studio 内容生产与交互官网平台发布，实现从草稿到上线的一键闭环。",
  "content": "<h2>引言</h2><p>内容生产与发布分属不同系统时，复制粘贴、格式丢失、版本错乱是常态。Studio Bridge 打通 zhao-studio 与交互官网平台，实现一键闭环。</p><h2>一、Studio Bridge 定位</h2><p>Studio Bridge 是连接 zhao-studio（内容生产）与 zhao-website（内容发布）的桥梁。Studio 负责创作，Website 负责呈现，Bridge 负责流转。</p><h2>二、双向关联机制</h2><p>Studio 草稿发布后，Website 自动创建 article 并记录 sourceType=studio、sourceId=draftId。Studio 草稿反向记录 websiteArticleId，形成双向引用。</p><h2>三、发布参数</h2><p>发布时填写 draftId、title、category、tags、slug 五个参数。Bridge 自动将 Studio 富文本转换为 Website 标准格式。</p><h2>四、原子性回滚</h2><p>发布过程分两步：创建 article、回写 sourceId。任一步失败自动回滚，避免脏数据。事务包裹保证原子性。</p><h2>五、sourceType 溯源</h2><p>所有从 Studio 来的 article 携带 sourceType=studio 标记，Admin UI 可筛选来源。删除 Studio 草稿时联动提示 Website 中的关联文章。</p><h2>总结</h2><p>Studio Bridge 让内容生产与发布无缝衔接，是内容运营效率提升的关键能力。</p>",
  "coverImage": "/uploads/studio-bridge-cover.jpg",
  "category": "产品动态",
  "tags": ["Studio Bridge", "内容管理"],
  "author": "产品团队",
  "seoTitle": "Studio Bridge：内容生产到发布的一键闭环 | 交互官网平台",
  "seoDescription": "Studio Bridge 打通 zhao-studio 与交互官网平台，实现从草稿到上线的一键闭环与双向关联。",
  "allowIndex": true,
  "readingTime": 5,
  "status": "published"
}
```

#### 4.3.7 操作步骤

1. 左侧菜单「Content Manager」→「Article」→「+ Create new entry」
2. 按上述 JSON 依次填写各字段
3. content 字段切到 HTML 源码模式粘贴完整 HTML
4. category 字段关联对应分类（行业洞察/产品动态）
5. tags 字段关联对应标签
6. status 字段选择「published」
7. 点击「Save」→ 系统自动发布
8. 重复 5 次创建 5 篇文章

> 📷 截图：Article 编辑页，标注 content 富文本编辑器与 SEO 字段区域

### 4.4 faq（8 条）

#### 4.4.1 字段说明

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| question | * | string | 问题 |
| answer | * | richtext | 答案（HTML） |
| slug | * | uid | URL 标识 |
| order | | integer | 排序权重 |
| isFeatured | | boolean | 是否精选 |
| category | | relation | 关联 article-category |
| tags | | relation | 关联 tag |
| status | * | enum | draft/published |

#### 4.4.2 FAQ 1：支持多少个租户

```json
{
  "question": "交互官网平台支持多少个租户？",
  "answer": "<p>交互官网平台采用共享 Schema 多租户架构，理论上无租户数量上限。在 4 核 8G 标准部署下，实测稳定支撑 100+ 站点、单站点 1 万篇文章规模。租户数量主要受数据库性能与磁盘容量约束，可通过垂直升级（提升单机配置）或水平分库（按租户 ID 分片）扩展。企业版支持租户分组与配额管理，便于精细化运营。</p>",
  "slug": "how-many-tenants",
  "order": 1,
  "isFeatured": true,
  "category": "产品教程",
  "tags": ["多租户"],
  "status": "published"
}
```

#### 4.4.3 FAQ 2：自定义域名

```json
{
  "question": "如何配置自定义域名？",
  "answer": "<p>配置自定义域名分三步：第一步在 DNS 服务商将域名 CNAME 指向交互官网平台接入点；第二步在 Admin UI 的 Site Config 编辑页填写 domain 字段，保存后系统自动申请 SSL 证书（基于 Let's Encrypt）；第三步在 site-resolver 中间件自动识别 Host 头路由到对应站点。本地开发可用 localhost，生产环境需备案域名。一个站点支持绑定主域名与最多 5 个别名。</p>",
  "slug": "custom-domain-setup",
  "order": 2,
  "isFeatured": true,
  "category": "产品教程",
  "tags": ["内容管理"],
  "status": "published"
}
```

#### 4.4.4 FAQ 3：多语言

```json
{
  "question": "是否支持多语言？",
  "answer": "<p>交互官网平台 v1.x 版本暂不支持多语言 i18n，规划在 v2.0 版本引入。届时将支持中英文双语，通过 Strapi i18n 插件实现内容翻译，前端通过 Nuxt i18n 模块切换语言。如需立即支持多语言，可通过创建多个 site-config（每语言一个）+ 共享内容池的变通方案实现，但运维成本较高，建议等待原生支持。</p>",
  "slug": "multi-language-support",
  "order": 3,
  "isFeatured": false,
  "category": "产品教程",
  "tags": ["内容管理"],
  "status": "published"
}
```

#### 4.4.5 FAQ 4：SEO 保证

```json
{
  "question": "SEO 效果如何保证？",
  "answer": "<p>交互官网平台从四个层面保证 SEO 效果：渲染层采用 SSR 服务端渲染，搜索引擎抓取即完整 HTML；域名层采用同域反代，Strapi 与 Nuxt 同域，权重不分散；结构化层自动输出 JSON-LD 知识图谱与 sitemap.xml，助力富结果收录；元信息层通过 useSeoMeta 自动注入 title/description/og/twitter 标签。实测百度收录率 92%、Google 收录率 95%+。</p>",
  "slug": "seo-guarantee",
  "order": 4,
  "isFeatured": true,
  "category": "产品教程",
  "tags": ["SEO优化", "SSR"],
  "status": "published"
}
```

#### 4.4.6 FAQ 5：发布流程

```json
{
  "question": "内容发布流程是什么？",
  "answer": "<p>内容发布支持三种路径：路径一，Admin UI 直接创建，填写字段后点击 Publish 即时发布；路径二，Studio Bridge 一键发布，在 zhao-studio 完成草稿后通过 Admin UI 的 Studio Bridge 页面选择草稿并填写参数，一键创建 article；路径三，API 创建，调用 POST /api/zhao-website/v1/articles 接口。所有路径均支持草稿态保存、定时发布、版本回滚。</p>",
  "slug": "publish-workflow",
  "order": 5,
  "isFeatured": false,
  "category": "产品教程",
  "tags": ["内容管理", "Studio Bridge"],
  "status": "published"
}
```

#### 4.4.7 FAQ 6：私有化部署

```json
{
  "question": "是否支持私有化部署？",
  "answer": "<p>交互官网平台完整支持私有化部署，提供 Docker Compose 一键部署脚本与 Kubernetes Helm Chart。私有化部署包含 Strapi 后端、Nuxt 前端、PostgreSQL 数据库、Redis 缓存四个核心组件，资源最低配置 4 核 8G。企业版提供部署文档、巡检脚本、监控告警模板。支持离线安装包，适用于金融、政务等隔离网络环境。</p>",
  "slug": "on-premise-deployment",
  "order": 6,
  "isFeatured": false,
  "category": "产品教程",
  "tags": ["企业服务"],
  "status": "published"
}
```

#### 4.4.8 FAQ 7：Strapi 增强

```json
{
  "question": "与 Strapi 原生有什么增强？",
  "answer": "<p>交互官网平台在 Strapi v5 基础上增加六大能力：多租户架构（site-resolver + 行级隔离）、6 个业务 Admin UI 页面（Dashboard/Studio Bridge/Knowledge Graph/First-Truth/AI Summaries/SEO Output）、Studio Bridge 双向关联、知识图谱与 JSON-LD 输出、真值管理与冲突检测、AI 摘要自动生成。同时预置 7 个业务 CT（product/case/article/faq/tutorial/compliance/download）与 5 套模板，开箱即用。</p>",
  "slug": "strapi-enhancements",
  "order": 7,
  "isFeatured": true,
  "category": "产品动态",
  "tags": ["内容管理", "多租户"],
  "status": "published"
}
```

#### 4.4.9 FAQ 8：CRM 对接

```json
{
  "question": "如何对接现有 CRM 系统？",
  "answer": "<p>留资线索对接 CRM 有三种方式：方式一，Webhook 推送，在 Admin UI 的 Dashboard 线索页配置 Webhook URL，新线索实时推送；方式二，API 拉取，CRM 定时调用 GET /api/zhao-website/v1/leads 接口增量拉取；方式三，数据库直连，企业版开放线索表结构，CRM 直连 PostgreSQL 只读副本。支持 Salesforce、HubSpot、纷享销客等主流 CRM 预置集成模板，字段映射可视化配置。</p>",
  "slug": "crm-integration",
  "order": 8,
  "isFeatured": false,
  "category": "产品教程",
  "tags": ["企业服务"],
  "status": "published"
}
```

#### 4.4.10 操作步骤

1. 左侧菜单「Content Manager」→「Faq」→「+ Create new entry」
2. 按上述 JSON 依次填写 8 条 FAQ
3. answer 字段切 HTML 源码模式粘贴
4. 点击「Save」→ 系统自动发布
5. 重复 8 次创建 8 条

> 📷 截图：FAQ 列表页，显示 8 条已发布记录，按 order 排序

### 4.5 tutorial（6 个）

#### 4.5.1 字段说明

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| title | * | string | 教程标题 |
| slug | * | uid | URL 标识 |
| description | * | text | 教程简介 |
| coverImage | | media | 封面图 |
| steps | * | json | 步骤数组（每步含 title+content） |
| materials | | json | 所需材料数组 |
| estimatedTime | * | string | 预计耗时 |
| difficulty | * | enum | beginner/intermediate/advanced |
| result | | text | 预期成果 |
| category | | relation | 关联 article-category |
| tags | | relation | 关联 tag |
| isFeatured | | boolean | 是否精选 |
| status | * | enum | draft/published |

#### 4.5.2 教程 1：5 分钟搭建第一个站点

```json
{
  "title": "5 分钟搭建你的第一个官网站点",
  "slug": "5-minutes-first-site",
  "description": "零基础用户也能 5 分钟搭建一个完整官网站点，覆盖配置、内容、发布全流程。",
  "coverImage": "/uploads/tutorial-5min-cover.jpg",
  "steps": [
    {
      "title": "登录 Admin UI",
      "content": "访问 http://localhost:1337/admin，使用管理员账号登录，进入后台首页。"
    },
    {
      "title": "编辑 Site Config",
      "content": "进入 Content Manager → Site Config，编辑默认记录，填写 siteName、domain、icpNumber 等基础字段，保存。"
    },
    {
      "title": "创建首篇文章",
      "content": "进入 Content Manager → Article，点击 Create new entry，填写标题、内容、分类，点击 Save 后 Publish。"
    }
  ],
  "materials": [
    "已启动的 Strapi 实例",
    "管理员账号",
    "浏览器"
  ],
  "estimatedTime": "5 分钟",
  "difficulty": "beginner",
  "result": "一个可访问的官网站点，包含 1 篇已发布文章，前端访问 http://localhost:3000 可见。",
  "category": "产品教程",
  "tags": ["内容管理"],
  "isFeatured": true,
  "status": "published"
}
```

#### 4.5.3 教程 2：多租户配置

```json
{
  "title": "多租户配置完整流程",
  "slug": "multi-tenant-setup-guide",
  "description": "从零配置一个完整多租户站点，覆盖 site-config、template、channel、featureFlags 全部环节。",
  "coverImage": "/uploads/tutorial-multi-tenant-cover.jpg",
  "steps": [
    {
      "title": "编辑 site-config 基础字段",
      "content": "填写 siteName、domain、icpNumber、seoKeywords、customerServiceUrl 五个基础字段。"
    },
    {
      "title": "关联模板",
      "content": "在 template 字段关联 default 模板，决定站点布局与主题。"
    },
    {
      "title": "配置 featureFlags",
      "content": "按需开启 channel、oss 等功能开关，未使用的功能保持 false 避免暴露。"
    },
    {
      "title": "创建 channel",
      "content": "在 Channel CT 创建官方直营渠道，填写 name、code、channelTier。"
    },
    {
      "title": "关联 channel 到 site-config",
      "content": "回到 site-config，在 channels 字段关联上一步创建的渠道。"
    },
    {
      "title": "验证 site-info API",
      "content": "调用 curl http://localhost:1337/api/zhao-website/v1/site-info，确认返回完整配置。"
    }
  ],
  "materials": [
    "已启动的 Strapi 实例",
    "PostgreSQL 数据库",
    "curl 或 Postman"
  ],
  "estimatedTime": "30 分钟",
  "difficulty": "intermediate",
  "result": "一个完整配置的多租户站点，site-info API 返回所有字段，前端可正常渲染。",
  "category": "产品教程",
  "tags": ["多租户", "内容管理"],
  "isFeatured": false,
  "status": "published"
}
```

#### 4.5.4 教程 3：自定义模板开发

```json
{
  "title": "自定义模板开发指南",
  "slug": "custom-template-development",
  "description": "从零开发一套自定义模板，覆盖组件注册、布局配置、主题定义、调试发布全流程。",
  "coverImage": "/uploads/tutorial-template-dev-cover.jpg",
  "steps": [
    {
      "title": "创建模板目录",
      "content": "在 dsite/templates/ 下创建自定义模板目录 my-template，包含 index.vue、config.json、theme.json 三个文件。"
    },
    {
      "title": "编写 config.json",
      "content": "声明模板包含的组件清单、布局结构、可配置项。参考 default 模板结构。"
    },
    {
      "title": "编写 theme.json",
      "content": "定义主题色、字体、间距变量，支持运行时覆盖。"
    },
    {
      "title": "实现 index.vue",
      "content": "基于 Nuxt 3 组合式 API 实现模板入口，引用 config 中的组件，注入 theme 变量。"
    },
    {
      "title": "注册模板",
      "content": "在 dsite/templates/index.ts 中注册新模板，导出 code 与组件映射。"
    },
    {
      "title": "Admin UI 添加模板记录",
      "content": "在 site-template CT 创建记录，code 与目录名一致，name 填显示名称。"
    },
    {
      "title": "关联到 site-config",
      "content": "编辑测试 site-config，关联新模板，保存。"
    },
    {
      "title": "调试与发布",
      "content": "访问前端验证渲染效果，调整后通过 ISR 增量再生发布。"
    }
  ],
  "materials": [
    "Node.js 20+",
    "Vue 3 与 Nuxt 3 基础",
    "VS Code 编辑器"
  ],
  "estimatedTime": "2 小时",
  "difficulty": "advanced",
  "result": "一套可复用的自定义模板，可被任意 site-config 关联使用。",
  "category": "产品教程",
  "tags": ["模板系统"],
  "isFeatured": false,
  "status": "published"
}
```

#### 4.5.5 教程 4：API 集成

```json
{
  "title": "API 集成指南：对接外部系统",
  "slug": "api-integration-guide",
  "description": "通过 REST API 将交互官网平台与外部系统集成，覆盖认证、CRUD、Webhook 全流程。",
  "coverImage": "/uploads/tutorial-api-integration-cover.jpg",
  "steps": [
    {
      "title": "创建 API Token",
      "content": "在 Admin UI → Settings → API Tokens 创建 token，权限选择 contents 的读写。"
    },
    {
      "title": "测试认证",
      "content": "调用 curl -H 'Authorization: Bearer <token>' http://localhost:1337/api/zhao-website/v1/articles 验证。"
    },
    {
      "title": "创建内容",
      "content": "POST 请求 /api/zhao-website/v1/articles，body 为完整 article JSON。"
    },
    {
      "title": "查询内容",
      "content": "GET 请求带参数 ?slug=xxx&status=published，支持过滤与分页。"
    },
    {
      "title": "更新内容",
      "content": "PUT 请求 /api/zhao-website/v1/articles/:documentId，body 为待更新字段。"
    },
    {
      "title": "配置 Webhook",
      "content": "在 Admin UI → Dashboard → 线索页配置 Webhook URL，新线索实时推送。"
    },
    {
      "title": "错误处理",
      "content": "处理 401（未认证）、403（无权限）、404（不存在）、429（限流）四类常见错误。"
    }
  ],
  "materials": [
    "API Token",
    "curl 或 Postman",
    "外部系统对接文档"
  ],
  "estimatedTime": "1.5 小时",
  "difficulty": "advanced",
  "result": "外部系统可通过 API 与交互官网平台双向同步内容与线索数据。",
  "category": "产品教程",
  "tags": ["内容管理"],
  "isFeatured": true,
  "status": "published"
}
```

#### 4.5.6 教程 5：权限配置

```json
{
  "title": "权限配置完整教程",
  "slug": "permission-config-guide",
  "description": "配置 Strapi 高级权限与 zhao-website 业务权限，实现精细化角色管控。",
  "coverImage": "/uploads/tutorial-permission-cover.jpg",
  "steps": [
    {
      "title": "规划角色矩阵",
      "content": "梳理 super-admin/admin/editor/viewer 四类角色的职责与可访问菜单。"
    },
    {
      "title": "创建角色",
      "content": "在 Admin UI → Settings → Roles 创建新角色，填写名称与描述。"
    },
    {
      "title": "配置 CT 权限",
      "content": "为每个 Collection Type 配置角色的增删改查权限，遵循最小权限原则。"
    },
    {
      "title": "配置 Admin UI 菜单",
      "content": "通过 plugin 权限控制 6 个业务页面的访问，未授权菜单自动隐藏。"
    },
    {
      "title": "分配用户角色",
      "content": "在用户管理中为每个用户分配角色，一个用户可多角色叠加。"
    }
  ],
  "materials": [
    "管理员账号",
    "角色职责清单"
  ],
  "estimatedTime": "20 分钟",
  "difficulty": "intermediate",
  "result": "一套覆盖 4 类角色的权限体系，用户只能访问授权范围内的菜单与数据。",
  "category": "产品教程",
  "tags": ["内容管理"],
  "isFeatured": false,
  "status": "published"
}
```

#### 4.5.7 教程 6：性能优化

```json
{
  "title": "性能优化最佳实践",
  "slug": "performance-optimization-guide",
  "description": "从数据库、缓存、渲染、CDN 四层优化交互官网平台性能，目标 P95 < 200ms。",
  "coverImage": "/uploads/tutorial-perf-cover.jpg",
  "steps": [
    {
      "title": "数据库索引优化",
      "content": "为高频查询字段（site_id、slug、status、created_at）建立复合索引，使用 EXPLAIN 分析慢查询。"
    },
    {
      "title": "启用 Redis 缓存",
      "content": "配置 REDIS_URL 环境变量，site-info、模板配置等热点数据自动缓存，TTL 300s。"
    },
    {
      "title": "SSR 渲染优化",
      "content": "启用 Nuxt routeRules 的 ISR 增量再生，文章页 cache 600s，列表页 cache 60s。"
    },
    {
      "title": "图片 OSS 加速",
      "content": "开启 oss featureFlag，图片上传至 OSS，通过 CDN 回源，自动 WebP 转换。"
    },
    {
      "title": "前端资源压缩",
      "content": "启用 Nuxt 的 nitro compressPublicAssets，JS/CSS/Gzip 自动压缩，首屏体积 < 200KB。"
    },
    {
      "title": "监控与告警",
      "content": "接入 Prometheus + Grafana，监控 QPS、P95、错误率，设置阈值告警。"
    }
  ],
  "materials": [
    "Redis 实例",
    "OSS 账号",
    "Prometheus 监控"
  ],
  "estimatedTime": "1 小时",
  "difficulty": "advanced",
  "result": "P95 延迟降至 200ms 以内，QPS 提升至 1000+，首屏加载 < 1s。",
  "category": "产品教程",
  "tags": ["SSR", "SEO优化"],
  "isFeatured": false,
  "status": "published"
}
```

#### 4.5.8 操作步骤

1. 左侧菜单「Content Manager」→「Tutorial」→「+ Create new entry」
2. 按上述 JSON 依次填写 6 条教程
3. steps、materials 字段粘贴完整 JSON 数组
4. difficulty 字段从下拉框选择对应枚举
5. 点击「Save」→「Publish」
6. 重复 6 次创建 6 条

> 📷 截图：Tutorial 编辑页，标注 steps JSON 数组与 difficulty 下拉框

### 4.6 compliance（8 条）

#### 4.6.1 字段说明

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| title | * | string | 文档标题 |
| slug | * | uid | URL 标识 |
| category | * | enum | agreement/policy/certificate |
| content | * | richtext | 正文（HTML，含 h2 分章节） |
| effectiveDate | | date | 生效日期 |
| expiryDate | | date | 失效日期 |
| isPinned | | boolean | 是否置顶 |
| seoTitle | | string | SEO 标题 |
| seoDescription | | string | SEO 描述 |
| allowIndex | | boolean | 是否允许收录 |
| status | * | enum | draft/published |

#### 4.6.2 合规 1：服务协议

```json
{
  "title": "交互官网平台服务协议",
  "slug": "service-agreement",
  "category": "agreement",
  "content": "<h2>一、服务内容</h2><p>交互官网平台（以下简称"本平台"）由上海某某科技有限公司运营，为用户提供多租户官网建设、内容管理、全渠道发布等服务。具体服务范围以用户购买的服务套餐为准。</p><h2>二、用户注册与账号</h2><p>用户应提供真实、准确、完整的注册信息，账号密码妥善保管，因账号泄露导致的损失由用户自行承担。</p><h2>三、用户行为规范</h2><p>用户不得利用本平台发布违法、侵权、欺诈内容，不得进行恶意攻击、爬取数据等行为。违者本平台有权暂停或终止服务。</p><h2>四、服务费用</h2><p>本平台提供基础免费版与付费企业版，具体收费标准详见官网价格页。付费服务到期未续费，平台有权暂停服务。</p><h2>五、知识产权</h2><p>用户发布的内容知识产权归用户所有，本平台获得有限展示与分发许可。平台自身代码、设计、商标归平台所有。</p><h2>六、服务变更与终止</h2><p>本平台有权根据业务发展调整服务内容，提前 30 天公告。用户可随时终止使用，已付费服务按比例退款。</p><h2>七、免责声明</h2><p>因不可抗力、第三方服务中断等原因导致的服务中断，本平台不承担责任。</p><h2>八、争议解决</h2><p>本协议适用中华人民共和国法律，争议提交上海仲裁委员会仲裁。</p>",
  "effectiveDate": "2026-01-01",
  "expiryDate": null,
  "isPinned": true,
  "seoTitle": "交互官网平台服务协议",
  "seoDescription": "交互官网平台服务协议，明确服务内容、用户行为规范、费用、知识产权等条款。",
  "allowIndex": false,
  "status": "published"
}
```

#### 4.6.3 合规 2：隐私政策

```json
{
  "title": "隐私政策",
  "slug": "privacy-policy",
  "category": "policy",
  "content": "<h2>一、信息收集</h2><p>本平台收集的用户信息包括：注册信息（邮箱、手机号）、使用信息（访问日志、操作记录）、留资信息（姓名、公司、联系方式）。收集方式包括用户主动填写与自动采集。</p><h2>二、信息使用</h2><p>收集的信息用于：提供核心服务、改进产品体验、发送服务通知、营销推广（用户可退订）、合规审计。</p><h2>三、信息存储与保护</h2><p>信息存储于中华人民共和国境内服务器，采用 AES-256 加密传输、TLS 1.3 加密存储。访问权限严格分级，定期审计。</p><h2>四、信息共享</h2><p>除以下情形外，本平台不向第三方共享用户信息：用户同意、法律要求、合并收购。共享时签订数据处理协议。</p><h2>五、用户权利</h2><p>用户有权访问、更正、删除个人信息，有权导出数据，有权注销账号。可通过客服邮箱行使权利。</p><h2>六、Cookie 使用</h2><p>本平台使用 Cookie 保存登录状态、偏好设置，不用于跨站追踪。用户可在浏览器设置中禁用 Cookie。</p><h2>七、未成年人保护</h2><p>本平台不面向 14 岁以下未成年人，如发现未成年人注册将立即注销。</p><h2>八、政策更新</h2><p>本政策可能更新，重大变更提前 30 天公告，继续使用视为同意。</p>",
  "effectiveDate": "2026-01-01",
  "expiryDate": null,
  "isPinned": true,
  "seoTitle": "隐私政策 | 交互官网平台",
  "seoDescription": "交互官网平台隐私政策，详述信息收集、使用、存储、共享与用户权利。",
  "allowIndex": true,
  "status": "published"
}
```

#### 4.6.4 合规 3：数据处理协议

```json
{
  "title": "数据处理协议",
  "slug": "data-processing-agreement",
  "category": "agreement",
  "content": "<h2>一、定义</h2><p>本协议依据《个人信息保护法》《数据安全法》制定，约定数据控制者（用户）与数据处理者（本平台）的权利义务。</p><h2>二、数据处理范围</h2><p>本平台按用户指令处理以下数据：用户内容数据、用户行为日志、留资线索数据。处理目的限于提供本平台服务。</p><h2>三、数据安全措施</h2><p>本平台采取以下安全措施：传输加密（TLS 1.3）、存储加密（AES-256）、访问控制（RBAC）、审计日志（保留 6 个月）、定期渗透测试。</p><h2>四、数据主体权利</h2><p>本平台协助用户响应数据主体行使访问、更正、删除、可携带权利，在 15 个工作日内响应。</p><h2>五、数据泄露响应</h2><p>发生数据泄露时，本平台在 24 小时内通知用户，72 小时内向监管部门报告，提供补救措施。</p><h2>六、数据销毁</h2><p>服务终止后，本平台在 30 日内销毁所有用户数据，销毁记录归档 3 年。</p><h2>七、子处理者</h2><p>本平台使用 OSS、CDN 等子处理者，已签订同等保护协议，列表定期更新。</p><h2>八、审计</h2><p>本平台每年进行一次 SOC2 审计，报告可应用户要求提供。</p>",
  "effectiveDate": "2026-01-01",
  "expiryDate": null,
  "isPinned": false,
  "seoTitle": "数据处理协议 | 交互官网平台",
  "seoDescription": "数据处理协议，约定数据控制者与处理者的权利义务，符合个保法与数据安全法。",
  "allowIndex": false,
  "status": "published"
}
```

#### 4.6.5 合规 4：等保三级备案

```json
{
  "title": "信息安全等级保护备案证明",
  "slug": "info-security-level-cert",
  "category": "certificate",
  "content": "<h2>证书信息</h2><p>证书名称：信息安全等级保护备案证明</p><p>等级：第三级</p><p>备案机关：上海市公安局</p><p>备案编号：31000000000003</p><p>有效期：2026-01-01 至 2028-12-31</p><h2>测评范围</h2><p>本次等保三级测评覆盖交互官网平台核心业务系统，包括 Strapi 后端、Nuxt 前端、PostgreSQL 数据库、Redis 缓存、OSS 存储五个组件。</p><h2>测评结论</h2><p>经测评，系统符合《信息安全技术 网络安全等级保护基本要求》（GB/T 22239-2019）第三级要求，主要项全部符合，建议项已整改。</p><h2>安全措施</h2><p>本平台采取的安全措施包括：身份鉴别、访问控制、安全审计、入侵防范、恶意代码防范、数据完整性与保密性、剩余信息保护、个人信息保护等。</p><h2>合规说明</h2><p>等保三级是金融、政务、医疗等行业的强制要求，本平台通过等保三级备案，满足企业客户合规需求。</p>",
  "effectiveDate": "2026-01-01",
  "expiryDate": "2028-12-31",
  "isPinned": false,
  "seoTitle": "信息安全等级保护备案证明 | 交互官网平台",
  "seoDescription": "交互官网平台通过等保三级备案，覆盖核心业务系统，满足金融政务行业合规要求。",
  "allowIndex": true,
  "status": "published"
}
```

#### 4.6.6 合规 5：ISO27001

```json
{
  "title": "ISO27001 信息安全管理体系认证",
  "slug": "iso27001-cert",
  "category": "certificate",
  "content": "<h2>证书信息</h2><p>证书名称：信息安全管理体系认证证书</p><p>标准：ISO/IEC 27001:2022</p><p>认证机构：BSI 英国标准协会</p><p>证书编号：IS 000001</p><p>有效期：2025-06-01 至 2028-06-01</p><h2>认证范围</h2><p>本次认证覆盖交互官网平台的设计、开发、运维、技术支持全生命周期，包括信息资产管理、人力资源安全、物理与环境安全、通信安全、访问控制、密码学、运行安全、系统开发维护、供应商关系、合规等 14 个控制域。</p><h2>认证意义</h2><p>ISO27001 是国际公认的信息安全管理标准，通过认证表明本平台已建立体系化、文档化的信息安全管理体系，并能持续改进。</p><h2>持续改进</h2><p>本平台每年进行一次内部审核与管理评审，每三年进行一次再认证，确保体系持续有效。</p><h2>客户价值</h2><p>客户可信赖本平台的信息安全管理能力，在合规审计中可作为供应商资质证明。</p>",
  "effectiveDate": "2025-06-01",
  "expiryDate": "2028-06-01",
  "isPinned": false,
  "seoTitle": "ISO27001 信息安全管理体系认证 | 交互官网平台",
  "seoDescription": "交互官网平台通过 ISO27001 信息安全管理体系认证，覆盖全生命周期安全管理。",
  "allowIndex": true,
  "status": "published"
}
```

#### 4.6.7 合规 6：ISO9001

```json
{
  "title": "ISO9001 质量管理体系认证",
  "slug": "iso9001-cert",
  "category": "certificate",
  "content": "<h2>证书信息</h2><p>证书名称：质量管理体系认证证书</p><p>标准：ISO 9001:2015</p><p>认证机构：SGS 通标标准技术服务有限公司</p><p>证书编号：QM 000001</p><p>有效期：2025-06-01 至 2028-06-01</p><h2>认证范围</h2><p>本次认证覆盖交互官网平台软件产品的设计、开发、销售与售后服务全过程。</p><h2>质量方针</h2><p>本平台遵循"客户至上、持续改进、过程管控、数据驱动"的质量方针，建立完整的质量管理体系。</p><h2>过程管理</h2><p>体系覆盖需求管理、设计开发、编码实现、测试验证、发布部署、运维支持、客户反馈七大过程，每过程有标准化作业指导书。</p><h2>持续改进</h2><p>本平台通过内部审核、管理评审、客户满意度调查、数据分析等机制，持续改进质量管理体系有效性。</p><h2>客户价值</h2><p>ISO9001 认证表明本平台具备稳定提供满足客户要求与适用法规要求产品的能力，增强客户信心。</p>",
  "effectiveDate": "2025-06-01",
  "expiryDate": "2028-06-01",
  "isPinned": false,
  "seoTitle": "ISO9001 质量管理体系认证 | 交互官网平台",
  "seoDescription": "交互官网平台通过 ISO9001 质量管理体系认证，覆盖软件设计开发销售全过程。",
  "allowIndex": true,
  "status": "published"
}
```

#### 4.6.8 合规 7：高新技术企业

```json
{
  "title": "国家高新技术企业认证",
  "slug": "high-tech-enterprise-cert",
  "category": "certificate",
  "content": "<h2>证书信息</h2><p>证书名称：高新技术企业证书</p><p>颁发机构：科学技术部、财政部、国家税务总局</p><p>证书编号：GR 2025000001</p><p>有效期：2025-12-01 至 2028-12-01</p><h2>认证依据</h2><p>依据《高新技术企业认定管理办法》（国科发火〔2016〕32 号）及相关实施细则，经专家评审、公示等程序认定。</p><h2>核心技术</h2><p>本平台的核心技术包括：多租户架构、SSR 渲染引擎、知识图谱构建、AI 摘要生成、真值管理、模板配置化系统等，拥有自主知识产权。</p><h2>研发投入</h2><p>本平台研发投入占营业收入比例超过 15%，研发人员占比超过 40%，符合高新技术企业研发投入要求。</p><h2>政策优惠</h2><p>高新技术企业可享受企业所得税 15% 优惠税率、研发费用加计扣除等政策支持。</p><h2>客户价值</h2><p>高新技术企业认证表明本平台的技术能力获得国家认可，客户可放心采购。</p>",
  "effectiveDate": "2025-12-01",
  "expiryDate": "2028-12-01",
  "isPinned": false,
  "seoTitle": "国家高新技术企业认证 | 交互官网平台",
  "seoDescription": "交互官网平台通过国家高新技术企业认证，核心技术拥有自主知识产权。",
  "allowIndex": true,
  "status": "published"
}
```

#### 4.6.9 合规 8：软件著作权

```json
{
  "title": "软件著作权登记证书",
  "slug": "software-copyright-cert",
  "category": "certificate",
  "content": "<h2>证书信息</h2><p>证书名称：计算机软件著作权登记证书</p><p>登记机构：中国版权保护中心</p><p>证书编号：软著登字第 0000001 号</p><p>登记日期：2025-03-01</p><p>软件名称：交互官网平台 V1.0</p><p>著作权人：上海某某科技有限公司</p><h2>登记依据</h2><p>依据《计算机软件保护条例》《计算机软件著作权登记办法》登记。</p><h2>权利范围</h2><p>本平台对交互官网平台 V1.0 软件享有发表权、署名权、修改权、复制权、发行权、出租权、信息网络传播权、翻译权等完整著作权。</p><h2>保护期限</h2><p>软件著作权保护期为 50 年，自首次发表之日起计算。</p><h2>侵权处理</h2><p>未经授权复制、修改、传播本软件的行为，本平台将依法追究法律责任。</p><h2>客户价值</h2><p>软件著作权登记证书是软件知识产权的法定证明，客户采购时可作为知识产权资质验证。</p>",
  "effectiveDate": "2025-03-01",
  "expiryDate": null,
  "isPinned": false,
  "seoTitle": "软件著作权登记证书 | 交互官网平台",
  "seoDescription": "交互官网平台通过计算机软件著作权登记，软件知识产权受法律保护。",
  "allowIndex": true,
  "status": "published"
}
```

#### 4.6.10 操作步骤

1. 左侧菜单「Content Manager」→「Compliance」→「+ Create new entry」
2. 按上述 JSON 依次填写 8 条合规记录
3. category 字段从下拉框选择 agreement/policy/certificate
4. content 字段切 HTML 源码模式粘贴完整 HTML（含 h2 分章节）
5. effectiveDate、expiryDate 字段使用日期选择器
6. isPinned 开关按 JSON 设置
7. allowIndex 开关按 JSON 设置（影响 SEO 收录）
8. 点击「Save」→「Publish」
9. 重复 8 次创建 8 条

> 📷 截图：Compliance 列表页，按 category 筛选显示 3 类共 8 条记录

### 4.7 download（3 个）

#### 4.7.1 字段说明

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| name | * | string | 资源名称 |
| description | * | text | 资源描述 |
| file | | media | 上传文件 |
| url | | string | 外部链接（与 file 二选一） |
| size | | string | 文件大小 |
| fileType | * | enum | whitepaper/datasheet/guide |
| fileSize | | integer | 文件大小（MB） |
| requireLead | * | boolean | 是否需要留资 |
| downloadCount | | integer | 下载次数 |
| isFeatured | | boolean | 是否精选 |
| order | | integer | 排序权重 |
| category | | relation | 关联 article-category |
| tags | | relation | 关联 tag |
| status | * | enum | draft/published |

#### 4.7.2 下载 1：白皮书

```json
{
  "name": "交互官网平台白皮书",
  "description": "全面解析交互官网平台的多租户架构、核心能力、技术选型、应用场景与最佳实践，是企业官网建设决策的必备资料。包含架构图、性能数据、客户案例与 ROI 分析。",
  "file": "/uploads/whitepaper-2026.pdf",
  "url": null,
  "size": null,
  "fileType": "whitepaper",
  "fileSize": 5,
  "requireLead": true,
  "downloadCount": 1286,
  "isFeatured": true,
  "order": 1,
  "category": "产品动态",
  "tags": ["多租户", "SSR", "SEO优化"],
  "status": "published"
}
```

#### 4.7.3 下载 2：产品功能数据表

```json
{
  "name": "产品功能数据表",
  "description": "交互官网平台完整功能清单与参数表，覆盖 7 个 CT、6 个 Admin UI 页面、5 套模板、API 接口列表。便于技术评估与选型对比。",
  "file": "/uploads/datasheet-2026.pdf",
  "url": null,
  "size": null,
  "fileType": "datasheet",
  "fileSize": 1,
  "requireLead": false,
  "downloadCount": 3421,
  "isFeatured": false,
  "order": 2,
  "category": "产品动态",
  "tags": ["内容管理"],
  "status": "published"
}
```

#### 4.7.4 下载 3：多租户架构技术指南

```json
{
  "name": "多租户架构技术指南",
  "description": "深入讲解交互官网平台多租户架构的设计原理、实现细节、性能优化与扩展方案。包含数据库 Schema、中间件代码、压测数据，适合架构师与技术决策者阅读。",
  "file": "/uploads/multi-tenant-guide-2026.pdf",
  "url": null,
  "size": null,
  "fileType": "guide",
  "fileSize": 3,
  "requireLead": true,
  "downloadCount": 756,
  "isFeatured": true,
  "order": 3,
  "category": "产品教程",
  "tags": ["多租户"],
  "status": "published"
}
```

#### 4.7.5 操作步骤

1. 左侧菜单「Content Manager」→「Download」→「+ Create new entry」
2. 按上述 JSON 依次填写 3 条下载资源
3. file 字段点击上传区域，选择本地 PDF 文件上传
4. fileType 字段从下拉框选择 whitepaper/datasheet/guide
5. requireLead 开关按 JSON 设置（true 表示下载前需留资）
6. downloadCount 字段填入初始下载数（用于热门排序）
7. 点击「Save」→「Publish」
8. 重复 3 次创建 3 条

> 📷 截图：Download 编辑页，标注 file 上传区域与 requireLead 开关

### 4.8 技术原理

> 💡 **技术原理**
>
> **7 个 CT 的设计思路**：覆盖企业官网的内容类型全集——product（产品）、case（案例）、article（文章）、faq（问答）、tutorial（教程）、compliance（合规）、download（下载）。每个 CT 独立建模，通过 article-category 与 tag 跨 CT 关联，实现内容聚合。
>
> **JSON 字段的使用场景**：features、specifications、scenarios、results、steps、materials 等字段采用 JSON 类型而非组件化，因为结构灵活、查询简单、前端渲染直接。Strapi v5 的 JSON 字段支持完整的 PostgreSQL jsonb 查询能力。
>
> **isFeatured 与 order 的区别**：isFeatured 是布尔精选标记，用于首页推荐位；order 是整数排序权重，用于列表内排序。二者配合实现"精选优先 + 自定义顺序"的展示策略。
>
> **requireLead 留资逻辑**：下载资源 requireLead=true 时，前端展示留资表单，用户填写后调用 POST /api/zhao-website/v1/leads 创建线索，关联 downloadId，再返回下载链接。requireLead=false 直接返回链接。
>
> **allowIndex SEO 控制**：compliance 中的协议类文档（服务协议、数据处理协议）allowIndex=false，通过 `X-Robots-Tag: noindex` 响应头阻止收录，避免协议页面稀释主站权重。

---

## 5. Strapi Admin UI 操作示例

本章覆盖 zhao-website 插件提供的 6 个业务管理页面，每节包含字段说明、操作步骤、JSON 数据示例、截图位标注。

### 5.1 Dashboard 仪表盘

#### 5.1.1 功能说明

Dashboard 是 Admin UI 首页，展示站点核心运营数据，包含 4 个统计卡片与 2 个 Tab。

| 模块 | 说明 |
|------|------|
| 文章总数卡片 | 已发布 article 数量 |
| 产品总数卡片 | 已发布 product 数量 |
| 线索总数卡片 | 留资 lead 数量（今日新增） |
| 搜索热度卡片 | 站内搜索次数（今日） |
| 线索 Tab | 留资列表，含姓名/公司/联系方式/来源/时间 |
| 搜索 Tab | 热门搜索词统计，含词/次数/占比 |

#### 5.1.2 操作步骤

1. 登录 Admin UI，默认进入 Dashboard 页面
2. 查看顶部 4 个统计卡片，确认数据非零
3. 点击「线索」Tab，查看留资列表
4. 点击某条线索的「查看」按钮，进入详情页
5. 点击「搜索」Tab，查看热门搜索词
6. 使用顶部时间筛选器切换「今日/7 天/30 天」

> 📷 截图：Dashboard 全屏，红框标注 4 个卡片与 2 个 Tab

#### 5.1.3 线索 JSON 示例

```json
{
  "data": [
    {
      "id": 1,
      "name": "张经理",
      "company": "某制造业集团",
      "phone": "13800000001",
      "email": "zhang@company.com",
      "source": "contact_form",
      "downloadId": null,
      "message": "希望了解多租户方案报价",
      "createdAt": "2026-07-07T10:30:00Z",
      "status": "new"
    },
    {
      "id": 2,
      "name": "李总监",
      "company": "某教育机构",
      "phone": "13800000002",
      "email": "li@edu.com",
      "source": "download",
      "downloadId": 1,
      "message": null,
      "createdAt": "2026-07-07T11:15:00Z",
      "status": "new"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "pageSize": 20
  }
}
```

> 📷 截图：线索 Tab 列表，显示 2 条留资记录

### 5.2 Studio Bridge 一键发布

#### 5.2.1 功能说明

Studio Bridge 页面用于将 zhao-studio 的草稿一键发布为官网 article，建立双向关联。

**字段说明**：

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| draftId | * | string | Studio 草稿 ID |
| title | * | string | 发布后的文章标题 |
| category | * | relation | 关联 article-category |
| tags | | relation | 关联 tag（多选） |
| slug | * | uid | URL 标识 |

#### 5.2.2 操作步骤

1. 左侧菜单点击「Studio Bridge」
2. 在「draftId」字段填入 Studio 草稿 ID
3. 在「title」字段填入发布标题
4. 在「category」字段选择分类
5. 在「tags」字段关联标签（可多选）
6. 在「slug」字段填入 URL 标识
7. 点击「发布到官网」按钮
8. 等待 2-3 秒，弹出「发布成功」提示
9. 点击「查看文章」按钮跳转到 Article 详情页

#### 5.2.3 发布参数 JSON 示例

```json
{
  "draftId": "studio-draft-001",
  "title": "交互官网平台 2026 年度产品路线图",
  "category": "产品动态",
  "tags": ["产品动态", "内容管理"],
  "slug": "2026-product-roadmap"
}
```

> 📷 截图：Studio Bridge 表单填写完成，标注 5 个字段

> 📷 截图：发布成功提示弹窗，含「查看文章」按钮

### 5.3 Knowledge Graph 知识图谱

#### 5.3.1 功能说明

Knowledge Graph 页面管理站点实体与关系，输出 JSON-LD 结构化数据。

**实体字段说明**：

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| name | * | string | 实体名称 |
| entityType | * | enum | Organization/Person/Product/Event |
| description | | text | 实体描述 |
| url | | string | 实体链接 |
| properties | | json | 扩展属性 |

#### 5.3.2 操作步骤

1. 左侧菜单点击「Knowledge Graph」
2. 点击「+ 新建实体」按钮
3. 按下表填写字段：

| 字段 | 填写内容 |
|------|----------|
| name | 交互官网平台 |
| entityType | Organization |
| description | 多租户企业官网平台 |
| url | https://www.joho.cn |

4. 点击「Save」保存
5. 切换到「关系」Tab，点击「+ 新建关系」
6. 选择源实体「交互官网平台」、关系类型「founder」、目标实体「张某」
7. 点击「Save」保存
8. 点击右上角「导出 JSON-LD」按钮
9. 复制弹窗中的 `@graph` 结构

#### 5.3.3 实体 JSON 示例

```json
{
  "name": "交互官网平台",
  "entityType": "Organization",
  "description": "多租户企业官网平台，一站式内容管理与全渠道发布",
  "url": "https://www.joho.cn",
  "properties": {
    "foundingDate": "2015",
    "foundingLocation": "上海",
    "numberOfEmployees": "50-200"
  }
}
```

#### 5.3.4 关系示例

```json
{
  "source": "交互官网平台",
  "relation": "founder",
  "target": "张某",
  "targetType": "Person"
}
```

#### 5.3.5 JSON-LD 导出示例

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "交互官网平台",
      "description": "多租户企业官网平台",
      "url": "https://www.joho.cn",
      "foundingDate": "2015",
      "foundingLocation": "上海"
    },
    {
      "@type": "Person",
      "name": "张某"
    },
    {
      "@type": "Relationship",
      "subject": {
        "@id": "交互官网平台"
      },
      "predicate": "founder",
      "object": {
        "@id": "张某"
      }
    }
  ]
}
```

> 📷 截图：实体列表页，显示 2 个实体与 1 条关系

> 📷 截图：JSON-LD 导出弹窗，含可复制文本框

### 5.4 First-Truth 真值管理

#### 5.4.1 功能说明

First-Truth 页面管理站点关键事实的权威记录，用于冲突检测与 AI 摘要引用。

**真值字段说明**：

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| key | * | string | 真值键，如 foundingYear |
| value | * | string | 真值内容 |
| category | * | enum | business_license/company_basic/product_info |
| source | * | string | 数据来源 |
| confidence | * | float | 置信度 0-1 |
| verified | | boolean | 是否已验证 |

#### 5.4.2 操作步骤

1. 左侧菜单点击「First-Truth」
2. 点击「+ 新建真值」按钮
3. 按下表填写字段：

| 字段 | 填写内容 |
|------|----------|
| key | foundingYear |
| value | 2015 |
| category | business_license |
| source | 工商注册信息 |
| confidence | 1.0 |
| verified | true |

4. 点击「Save」保存
5. 切换到「冲突检测」Tab
6. 点击「扫描冲突」按钮
7. 系统扫描所有内容与真值的字段，发现冲突时列表标红
8. 对未验证真值，点击「验证」按钮标记 verified=true

#### 5.4.3 真值 JSON 示例

```json
{
  "key": "foundingYear",
  "value": "2015",
  "category": "business_license",
  "source": "工商注册信息",
  "confidence": 1.0,
  "verified": true
}
```

#### 5.4.4 真值集完整示例

```json
[
  {
    "key": "foundingYear",
    "value": "2015",
    "category": "business_license",
    "source": "工商注册信息",
    "confidence": 1.0,
    "verified": true
  },
  {
    "key": "registeredCapital",
    "value": "1000万元人民币",
    "category": "business_license",
    "source": "工商注册信息",
    "confidence": 1.0,
    "verified": true
  },
  {
    "key": "legalRepresentative",
    "value": "张某",
    "category": "company_basic",
    "source": "工商注册信息",
    "confidence": 1.0,
    "verified": true
  },
  {
    "key": "employeeCount",
    "value": "50-200",
    "category": "company_basic",
    "source": "官网公示",
    "confidence": 0.8,
    "verified": false
  }
]
```

#### 5.4.5 冲突检测示例

```json
{
  "conflicts": [
    {
      "truthKey": "foundingYear",
      "truthValue": "2015",
      "contentType": "article",
      "contentTitle": "多租户架构：一套代码如何支撑 100+ 企业官网",
      "conflictField": "content",
      "conflictValue": "成立于 2016 年",
      "suggestion": "建议修改文章中的成立年份为 2015"
    }
  ]
}
```

> 📷 截图：真值列表页，显示 4 条真值，标注 verified 状态

> 📷 截图：冲突检测 Tab，标红显示 1 条冲突

### 5.5 AI Summaries AI 摘要

#### 5.5.1 功能说明

AI Summaries 页面管理内容的 AI 自动摘要，支持编辑与重新生成。

**摘要字段说明**：

| 字段名称 | 必填 | 类型 | 说明 |
|----------|------|------|------|
| contentType | * | enum | article/product/case/faq/tutorial |
| contentTitle | * | string | 关联内容标题 |
| summary | * | text | 摘要正文 |
| updatedAt | | datetime | 最后更新时间 |

#### 5.5.2 操作步骤

1. 左侧菜单点击「AI Summaries」
2. 在顶部筛选器选择 contentType=article
3. 查看摘要列表
4. 点击某条摘要的「编辑」按钮
5. 在 summary 字段修改内容
6. 点击「Save」保存
7. 如需重新生成，点击「重新生成」按钮
8. 等待 5-15 秒，AI 服务返回新摘要
9. 系统自动更新 summary 与 updatedAt

#### 5.5.3 摘要 JSON 示例

```json
{
  "contentType": "article",
  "contentTitle": "多租户架构：一套代码如何支撑 100+ 企业官网",
  "summary": "本文解析交互官网平台的多租户架构，从域名识别、数据隔离到模板差异化，实测支撑 100+ 站点，QPS 800+。",
  "updatedAt": "2026-07-07T10:00:00Z"
}
```

#### 5.5.4 摘要集完整示例

```json
[
  {
    "contentType": "article",
    "contentTitle": "多租户架构：一套代码如何支撑 100+ 企业官网",
    "summary": "本文解析交互官网平台的多租户架构，从域名识别、数据隔离到模板差异化，实测支撑 100+ 站点，QPS 800+。",
    "updatedAt": "2026-07-07T10:00:00Z"
  },
  {
    "contentType": "article",
    "contentTitle": "SSR + 同域反代：企业级官网的 SEO 最优解",
    "summary": "对比 CSR/SSG/SSR 三种渲染模式，详解交互官网平台的 SSR + 同域反代方案，SEO 收录率提升至 92%。",
    "updatedAt": "2026-07-07T10:05:00Z"
  },
  {
    "contentType": "product",
    "contentTitle": "交互官网平台",
    "summary": "面向中大型企业的多租户官网建设解决方案，基于 Strapi v5 + Nuxt 3 + uni-app，提供 SSR、SEO、知识图谱等能力。",
    "updatedAt": "2026-07-07T10:10:00Z"
  }
]
```

> 📷 截图：AI Summaries 列表页，按 contentType 筛选

> 📷 截图：编辑表单，标注 summary 文本框与「重新生成」按钮

### 5.6 SEO Output SEO 输出

#### 5.6.1 功能说明

SEO Output 页面展示站点的 3 类 SEO 输出文件，支持预览与下载。

**3 个 Tab 说明**：

| Tab | 文件 | 说明 |
|-----|------|------|
| sitemap.xml | /sitemap.xml | 站点地图，含所有可收录 URL |
| robots.txt | /robots.txt | 爬虫协议，声明允许/禁止路径 |
| llms.txt | /llms.txt | LLM 友好摘要，供 AI 助手读取 |

#### 5.6.2 操作步骤

1. 左侧菜单点击「SEO Output」
2. 默认显示「sitemap.xml」Tab
3. 查看预览区域，确认包含所有 article/product/case URL
4. 点击「robots.txt」Tab
5. 确认 `Disallow: /api/` 与 `Sitemap: http://localhost/sitemap.xml` 配置
6. 点击「llms.txt」Tab
7. 查看站点摘要，确认含 siteName、核心能力、联系方式
8. 点击右上角「下载」按钮可下载文件

#### 5.6.3 sitemap.xml 示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>http://localhost/</loc>
    <lastmod>2026-07-07</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>http://localhost/articles/multi-tenant-architecture-100-sites</loc>
    <lastmod>2026-07-07</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>http://localhost/products/interactive-website-platform</loc>
    <lastmod>2026-07-07</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

#### 5.6.4 robots.txt 示例

```text
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Sitemap: http://localhost/sitemap.xml
```

#### 5.6.5 llms.txt 示例

```text
# 交互官网平台

> 多租户企业官网平台，一站式内容管理与全渠道发布

## 核心能力
- 多租户隔离：一套代码支撑 100+ 企业官网
- SSR 渲染：首屏加载 < 1s，SEO 收录率 92%+
- 模板系统：5 套预设模板，支持自定义
- 知识图谱：JSON-LD 结构化输出
- 真值管理：单一事实来源，冲突检测
- AI 摘要：自动生成内容摘要
- Studio Bridge：内容生产一键发布

## 联系方式
- 官网：https://www.joho.cn
- 邮箱：contact@joho.cn
- 电话：021-00000000
```

> 📷 截图：SEO Output 页面，3 个 Tab 切换效果

> 📷 截图：sitemap.xml 预览，含多个 URL 节点

### 5.7 技术原理

> 💡 **技术原理**
>
> **6 个页面的数据来源**：
> - Dashboard：实时查询 article、product、lead、search_log 表聚合
> - Studio Bridge：调用 zhao-studio API 拉取草稿，写入 article 表
> - Knowledge Graph：独立 entity 与 relation 表，导出时按 JSON-LD 规范序列化
> - First-Truth：独立 truth 表，冲突检测通过全文检索扫描内容字段
> - AI Summaries：异步任务监听内容创建事件，调用 LLM 生成摘要
> - SEO Output：实时生成 sitemap.xml/robots.txt/llms.txt，缓存 5 分钟
>
> **Admin UI 与公开 API 的边界**：Admin UI 仅管理员可访问，用于运营管理；公开 API 无需认证（除 lead 创建），供前端 dsite 调用渲染。所有写入操作在 Admin UI 与公开 API 共用 service 层，保证业务逻辑一致。
>
> **权限模型**：基于 Strapi RBAC，6 个业务页面通过 plugin 权限单独控制。super-admin 拥有全部权限，editor 仅可访问 Dashboard/Studio Bridge/AI Summaries，viewer 全部只读。

---

## 6. Studio Bridge 深度演示

### 6.1 前置条件：zhao-studio 草稿

**操作步骤**：

1. 打开新终端，启动 zhao-studio：

```bash
cd e:\code\studio
npm install
npm run dev
```

2. 浏览器访问 `http://localhost:3010`
3. 使用管理员账号登录（与 Strapi 同账号体系）
4. 点击「+ 新建草稿」按钮
5. 在草稿编辑器中撰写内容

> 📷 截图：zhao-studio 草稿列表页，显示「新建草稿」按钮

### 6.2 撰写草稿《2026 年度产品路线图》

**操作步骤**：

1. 在草稿标题字段填入「2026 年度产品路线图」
2. 在富文本编辑器中撰写以下内容：

```
# 2026 年度产品路线图

## Q1：多租户增强
- 租户配额管理
- 租户分组与权限隔离
- 跨租户内容复制

## Q2：AI 能力升级
- AI 摘要支持多语言
- 智能问答
- 内容智能审核

## Q3：模板生态
- 模板市场上线
- 第三方模板接入
- 模板版本管理

## Q4：性能与扩展
- 分布式缓存
- 读写分离
- 多区域部署
```

3. 点击「Save」保存草稿
4. 记录草稿 ID（URL 中可见，如 `studio-draft-001`）

> 📷 截图：草稿编辑器，标注标题与正文区域

### 6.3 Admin UI → Studio Bridge

**操作步骤**：

1. 切换到 Strapi Admin UI 标签页 `http://localhost:1337/admin`
2. 左侧菜单点击「Studio Bridge」（参见 5.2 节）
3. 进入 Studio Bridge 发布表单

> 📷 截图：Strapi Admin UI 左侧菜单，高亮 Studio Bridge 入口

### 6.4 选择草稿 + 填写参数 + 发布

**操作步骤**：

1. 在「draftId」字段填入 `studio-draft-001`
2. 在「title」字段填入「交互官网平台 2026 年度产品路线图」
3. 在「category」字段选择「产品动态」
4. 在「tags」字段关联「内容管理」标签
5. 在「slug」字段填入 `2026-product-roadmap`
6. 点击「发布到官网」按钮
7. 等待 2-3 秒，弹出「发布成功」提示

**发布参数完整 JSON**：

```json
{
  "draftId": "studio-draft-001",
  "title": "交互官网平台 2026 年度产品路线图",
  "category": "产品动态",
  "tags": ["产品动态", "内容管理"],
  "slug": "2026-product-roadmap"
}
```

> 📷 截图：Studio Bridge 表单填写完成，5 个字段均填充

> 📷 截图：发布成功提示，含「查看文章」按钮

### 6.5 验证 article 创建 + 双向关联

**操作步骤**：

1. 在发布成功提示中点击「查看文章」按钮
2. 系统跳转到 Article 详情页
3. 确认以下字段已正确填充：

| 字段 | 预期值 |
|------|--------|
| title | 交互官网平台 2026 年度产品路线图 |
| slug | 2026-product-roadmap |
| category | 产品动态 |
| tags | 内容管理 |
| content | 来自 Studio 草稿的 HTML 转换结果 |
| sourceType | studio |
| sourceId | studio-draft-001 |

4. 切换到 zhao-studio 标签页
5. 进入草稿列表，找到「2026 年度产品路线图」
6. 草稿右侧应显示「已发布到官网」标识与「查看官网文章」链接
7. 点击链接跳转回 Strapi Article 详情，确认双向关联

**Article sourceType 字段验证**：

```bash
curl "http://localhost:1337/api/zhao-website/v1/articles?slug=2026-product-roadmap"
```

预期返回包含：

```json
{
  "data": {
    "title": "交互官网平台 2026 年度产品路线图",
    "slug": "2026-product-roadmap",
    "sourceType": "studio",
    "sourceId": "studio-draft-001",
    "content": "<h1>2026 年度产品路线图</h1><h2>Q1：多租户增强</h2>..."
  }
}
```

> 📷 截图：Article 详情页，标注 sourceType=studio 与 sourceId 字段

> 📷 截图：zhao-studio 草稿列表，显示「已发布到官网」标识

### 6.6 dsite 访问确认

**操作步骤**：

1. 打开新终端，启动 dsite（参见第 7 章）：

```bash
cd e:\code\dsite
npm run dev
```

2. 浏览器访问 `http://localhost:3000/articles/2026-product-roadmap`
3. 确认页面正常渲染，标题为「交互官网平台 2026 年度产品路线图」
4. 确认正文按 h1/h2 结构展示
5. 确认底部显示「来源：Studio Bridge」标识

> 📷 截图：dsite 文章页，标题与正文正常渲染

### 6.7 技术原理

> 💡 **技术原理**
>
> **双向关联机制**：Studio Bridge 发布时分两步事务——第一步在 article 表创建记录，写入 sourceType=studio、sourceId=draftId；第二步回写 zhao-studio 草稿的 websiteArticleId 字段。两步均成功才提交事务，否则回滚。
>
> **sourceType 溯源**：article 表的 sourceType 字段标识内容来源，取值 admin（Admin UI 直接创建）/studio（Studio Bridge 发布）/api（外部 API 创建）。Admin UI 可按来源筛选，便于运营审计。删除 Studio 草稿时联动提示 Website 中的关联文章，但不会自动删除，需人工确认。
>
> **原子性回滚**：发布过程使用 Strapi 数据库事务包裹，任一步失败自动回滚。常见失败场景：草稿 ID 不存在、category 已删除、slug 重复。失败时返回详细错误码，前端展示具体原因。

---

## 7. dsite 前端联调

### 7.1 启动 dsite dev server

**操作步骤**：

1. 打开新终端，切换到 dsite 目录：

```bash
cd e:\code\dsite
```

2. 安装依赖（首次运行）：

```bash
npm install
```

3. 启动开发服务器：

```bash
npm run dev
```

4. 等待控制台输出：

```
Nuxt 3.x ready
Local: http://localhost:3000
```

5. 浏览器访问 `http://localhost:3000` 验证启动

> 📷 截图：dsite 启动成功控制台日志，标注 Local URL

### 7.2 验证 devProxy 联通

**操作步骤**：

1. 浏览器访问 `http://localhost:3000/api/zhao-website/v1/site-info`
2. 预期返回与第 2.6 节相同的 site-info JSON
3. 若返回 502，检查 Strapi 是否已启动（`http://localhost:1337`）
4. 若返回 404，检查 dsite/nuxt.config.ts 中 nitro.devProxy 配置：

```javascript
nitro: {
  devProxy: {
    '/api/': {
      target: 'http://localhost:1337/api/',
      changeOrigin: true
    }
  }
}
```

> 📷 截图：浏览器访问 devProxy 转发的 site-info 接口，返回完整 JSON

### 7.3 验证 16 个页面路由

**操作步骤**：

1. 依次访问下表 16 个路由
2. 对照「预期内容」列验证页面渲染

**16 个页面路由验收表**：

| 序号 | 路由 | 页面 | 预期内容 |
|------|------|------|----------|
| 1 | / | 首页 | 站点名称、Hero 区、产品卡、精选文章、案例、CTA |
| 2 | /products | 产品列表 | 1 个产品卡片，含 tagline、features |
| 3 | /products/interactive-website-platform | 产品详情 | 完整产品信息、规格表、应用场景 |
| 4 | /articles | 文章列表 | 5 篇文章卡片，含封面、摘要、分类、阅读时长 |
| 5 | /articles/multi-tenant-architecture-100-sites | 文章详情 | 标题、正文 h2 分节、作者、阅读时长、相关文章 |
| 6 | /cases | 案例列表 | 3 个案例卡片，含客户名、行业、成果 |
| 7 | /cases/某大型制造业企业官网矩阵建设 | 案例详情 | 挑战、解决方案、成果数据、客户证言 |
| 8 | /faq | FAQ 列表 | 8 条问答，按 order 排序，精选置顶 |
| 9 | /tutorials | 教程列表 | 6 个教程卡片，含难度、耗时、步骤数 |
| 10 | /tutorials/5-minutes-first-site | 教程详情 | 步骤展开、所需材料、预期成果 |
| 11 | /compliance | 合规列表 | 8 条记录，按 isPinned + effectiveDate 排序 |
| 12 | /compliance/service-agreement | 合规详情 | 完整协议正文，h2 分章节 |
| 13 | /downloads | 下载列表 | 3 个资源卡片，含文件大小、下载次数 |
| 14 | /contact | 联系页 | 留资表单（姓名/公司/电话/邮箱/留言） |
| 15 | /about | 关于页 | 公司介绍、团队、愿景 |
| 16 | /search | 搜索页 | 搜索框、热门词、搜索结果列表 |

3. 每个页面验证以下要素：
   - 页面标题（title 标签）正确
   - 导航栏高亮当前页
   - 页脚显示备案号与客服链接
   - 控制台无错误

> 📷 截图：首页全屏，标注 Hero 区与产品卡

> 📷 截图：文章详情页，标注 h2 分节与阅读时长

### 7.4 验证 SEO 输出

**操作步骤**：

1. 浏览器访问 `http://localhost:3000/sitemap.xml`
2. 确认返回 XML 格式，包含所有可收录 URL
3. 访问 `http://localhost:3000/robots.txt`
4. 确认包含 `Disallow: /api/` 与 Sitemap 声明
5. 访问 `http://localhost:3000/llms.txt`
6. 确认包含站点摘要与核心能力
7. 访问 `http://localhost:3000/articles/multi-tenant-architecture-100-sites`
8. 右键「查看页面源代码」，确认以下 meta 标签存在：

| meta 标签 | 预期内容 |
|-----------|----------|
| title | 多租户架构实战：一套代码支撑 100+ 企业官网 \| 交互官网平台 |
| meta[name=description] | 深入解析交互官网平台多租户架构... |
| meta[property=og:title] | 同 title |
| meta[property=og:type] | article |
| link[rel=canonical] | http://localhost/articles/multi-tenant-architecture-100-sites |
| script[type=application/ld+json] | 知识图谱 JSON-LD |

> 📷 截图：查看页面源代码，标注 5 个 SEO meta 标签

### 7.5 验证留资流程

**操作步骤**：

1. 浏览器访问 `http://localhost:3000/contact`
2. 在留资表单填写以下信息：

| 字段 | 填写内容 |
|------|----------|
| 姓名 | 测试用户 |
| 公司 | 测试公司 |
| 电话 | 13800000000 |
| 邮箱 | test@example.com |
| 留言 | 希望了解产品报价 |

3. 点击「提交」按钮
4. 预期页面显示「提交成功，我们将尽快与您联系」提示
5. 切换到 Strapi Admin UI → Dashboard → 线索 Tab
6. 刷新页面，应看到刚才提交的线索记录
7. 点击「查看」按钮，确认详情与表单填写一致

**留资 API 验证**：

```bash
curl -X POST http://localhost:1337/api/zhao-website/v1/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API 测试用户",
    "company": "API 测试公司",
    "phone": "13800000001",
    "email": "api@example.com",
    "message": "通过 API 提交的线索"
  }'
```

预期返回：

```json
{
  "data": {
    "id": 3,
    "name": "API 测试用户",
    "company": "API 测试公司",
    "phone": "13800000001",
    "email": "api@example.com",
    "source": "contact_form",
    "message": "通过 API 提交的线索",
    "status": "new",
    "createdAt": "2026-07-07T12:00:00Z"
  }
}
```

> 📷 截图：contact 表单提交成功提示

> 📷 截图：Dashboard 线索 Tab，显示新增的线索记录

### 7.6 验证下载流程

#### 7.6.1 requireLead=true 流程

**操作步骤**：

1. 浏览器访问 `http://localhost:3000/downloads`
2. 找到「交互官网平台白皮书」（requireLead=true）
3. 点击「下载」按钮
4. 预期弹出留资表单（非直接下载）
5. 填写姓名、公司、电话、邮箱
6. 点击「提交并下载」按钮
7. 预期开始下载 PDF 文件
8. 切换到 Strapi Admin UI → Dashboard → 线索 Tab
9. 应看到 source=download、downloadId=1 的新线索

> 📷 截图：下载留资表单弹窗，含 4 个必填字段

#### 7.6.2 requireLead=false 流程

**操作步骤**：

1. 浏览器访问 `http://localhost:3000/downloads`
2. 找到「产品功能数据表」（requireLead=false）
3. 点击「下载」按钮
4. 预期直接开始下载 PDF 文件，无留资表单
5. 切换到 Strapi Admin UI → Download CT 列表
6. 该资源的 downloadCount 应增加 1

> 📷 截图：requireLead=false 直接下载，浏览器下载栏显示

### 7.7 技术原理

> 💡 **技术原理**
>
> **nitro.devProxy**：Nuxt 3 的 nitro 服务在开发模式下通过 devProxy 配置将 /api 请求转发到 Strapi，实现同域访问。生产环境通过 nginx 反代实现相同效果，避免跨域与权重分散。
>
> **routeRules proxy**：nuxt.config.ts 中的 routeRules 配置生产环境的代理规则，如 `'/api/**': { proxy: 'http://strapi:1337/api/**' }`，与 devProxy 形成开发-生产一致的同域方案。
>
> **useSite SSR 友好性**：useSite 组合式 API 在 SSR 阶段调用 site-info API，结果注入 useState，客户端水合时复用，避免二次请求。所有页面共享 site 配置，无重复加载。
>
> **useSeoMeta 自动注入**：useSeoMeta 在 SSR 阶段读取内容的 seoTitle/seoDescription/coverImage 字段，注入到 HTML head，搜索引擎抓取即完整 meta。无需额外插件，开箱即用。

---

## 8. 验收清单

### 8.1 多租户配置验收（5 项）

| 序号 | 验收项 | 验证方法 | 通过标准 |
|------|--------|----------|----------|
| 1 | site-config 已编辑 | Admin UI → Site Config | siteName=交互官网平台，domain=localhost |
| 2 | 模板已关联 | Admin UI → Site Config → template | 关联 default 模板 |
| 3 | featureFlags 已配置 | site-info API | channel=true, oss=true，其余 false |
| 4 | channel 已创建并关联 | Admin UI → Channel | 存在 official 渠道，关联到 site-config |
| 5 | site-info API 返回完整 | curl site-info | 返回所有字段，含 channels 数组 |

### 8.2 内容数据验收（10 项）

| 序号 | 验收项 | 数量 | 验证方法 |
|------|--------|------|----------|
| 1 | article-category 已创建 | 5 | Admin UI → Article Category 列表 |
| 2 | tag 已创建 | 15 | Admin UI → Tag 列表，3 组各 5/4/4 |
| 3 | product 已创建 | 1 | Admin UI → Product 列表 |
| 4 | case 已创建 | 3 | Admin UI → Case 列表，含制造业/教育/SaaS |
| 5 | article 已创建 | 5 | Admin UI → Article 列表，含 2 篇精选 |
| 6 | faq 已创建 | 8 | Admin UI → Faq 列表，按 order 排序 |
| 7 | tutorial 已创建 | 6 | Admin UI → Tutorial 列表，覆盖 3 个难度 |
| 8 | compliance 已创建 | 8 | Admin UI → Compliance 列表，含 3 类 |
| 9 | download 已创建 | 3 | Admin UI → Download 列表，含 requireLead 两种 |
| 10 | 内容均已发布 | 全部 | 列表筛选 status=published，无草稿 |

### 8.3 Admin UI 操作验收（6 项）

| 序号 | 验收项 | 验证方法 | 通过标准 |
|------|--------|----------|----------|
| 1 | Dashboard 数据展示 | 访问 Dashboard | 4 卡片有数据，线索/搜索 Tab 可切换 |
| 2 | Studio Bridge 发布 | 参见第 6 章 | 草稿成功发布为 article，双向关联 |
| 3 | Knowledge Graph 实体 | Admin UI → Knowledge Graph | 至少 2 个实体 + 1 条关系，可导出 JSON-LD |
| 4 | First-Truth 真值 | Admin UI → First-Truth | 至少 4 条真值，可执行冲突检测 |
| 5 | AI Summaries 摘要 | Admin UI → AI Summaries | 列表有摘要，可编辑、可重新生成 |
| 6 | SEO Output 输出 | Admin UI → SEO Output | 3 个 Tab 均有内容，可预览 |

### 8.4 Studio Bridge 验收（5 项）

| 序号 | 验收项 | 验证方法 | 通过标准 |
|------|--------|----------|----------|
| 1 | 草稿可撰写 | zhao-studio | 可创建并保存草稿 |
| 2 | 发布参数填写 | Admin UI → Studio Bridge | 5 个字段可填写并提交 |
| 3 | article 创建成功 | Article 详情页 | title/content/category/tags 正确 |
| 4 | 双向关联建立 | 两侧详情页 | article 有 sourceType=studio，草稿有 websiteArticleId |
| 5 | dsite 可访问 | http://localhost:3000/articles/2026-product-roadmap | 页面正常渲染 |

### 8.5 dsite 前端验收（8 项）

| 序号 | 验收项 | 验证方法 | 通过标准 |
|------|--------|----------|----------|
| 1 | devProxy 联通 | 访问 /api/zhao-website/v1/site-info | 返回完整 JSON |
| 2 | 16 个路由可访问 | 参见 7.3 节表格 | 全部页面 200 状态 |
| 3 | 首页渲染完整 | 访问 / | 含 Hero、产品、文章、案例、CTA 区块 |
| 4 | 文章详情 SSR | 查看页面源代码 | 含完整正文 HTML，非空 div |
| 5 | 导航与页脚 | 所有页面 | 导航高亮当前页，页脚含备案号 |
| 6 | 移动端适配 | 浏览器开发者工具切换 | 响应式布局正常 |
| 7 | 控制台无错误 | F12 查看 Console | 无红色错误 |
| 8 | 路由跳转正常 | 点击导航链接 | 无 404，切换流畅 |

### 8.6 SEO 输出验收（4 项）

| 序号 | 验收项 | 验证方法 | 通过标准 |
|------|--------|----------|----------|
| 1 | sitemap.xml 可访问 | curl /sitemap.xml | XML 格式，含所有可收录 URL |
| 2 | robots.txt 可访问 | curl /robots.txt | 含 Disallow /api/ 与 Sitemap 声明 |
| 3 | llms.txt 可访问 | curl /llms.txt | 含站点摘要与核心能力 |
| 4 | meta 标签注入 | 查看文章页源代码 | title/description/og/json-ld 齐全 |

### 8.7 留资互动验收（3 项）

| 序号 | 验收项 | 验证方法 | 通过标准 |
|------|--------|----------|----------|
| 1 | contact 表单留资 | 提交 /contact 表单 | 提示成功，Dashboard 线索 Tab 新增记录 |
| 2 | requireLead=true 下载 | 点击白皮书下载 | 弹出留资表单，提交后下载 |
| 3 | requireLead=false 下载 | 点击数据表下载 | 直接下载，无留资表单 |

---

## 附录：常用 curl 命令

| 命令 | 说明 |
|------|------|
| `curl http://localhost:1337/api/zhao-website/v1/site-info` | 获取站点配置 |
| `curl "http://localhost:1337/api/zhao-website/v1/articles?status=published"` | 查询已发布文章 |
| `curl "http://localhost:1337/api/zhao-website/v1/products?slug=interactive-website-platform"` | 按 slug 查询产品 |
| `curl "http://localhost:1337/api/zhao-website/v1/cases?isFeatured=true"` | 查询精选案例 |
| `curl "http://localhost:1337/api/zhao-website/v1/faqs?order=asc"` | 按 order 升序查询 FAQ |
| `curl -X POST http://localhost:1337/api/zhao-website/v1/leads -H "Content-Type: application/json" -d '{...}'` | 提交留资线索 |

## 附录：CT 字段速查表

| CT | 必填字段 | 可选字段 | 关联 |
|----|----------|----------|------|
| product | name, tagline, slug, description, features | priceRange, specifications, scenarios, isFeatured | category, tags |
| case | title, clientName, clientIndustry, challenge, solution, results | testimonial, testimonialAuthor, testimonialTitle, isFeatured | tags |
| article | title, slug, excerpt, content, category, status | coverImage, tags, author, seoTitle, seoDescription, allowIndex, readingTime | category, tags |
| faq | question, answer, slug, status | order, isFeatured | category, tags |
| tutorial | title, slug, description, steps, estimatedTime, difficulty, status | coverImage, materials, result, isFeatured | category, tags |
| compliance | title, slug, category, content, status | effectiveDate, expiryDate, isPinned, seoTitle, seoDescription, allowIndex | 无 |
| download | name, description, fileType, requireLead, status | file, url, size, fileSize, downloadCount, isFeatured, order | category, tags |

## 附录：状态枚举速查

### 内容状态（status）

| 状态代码 | 显示名称 | 说明 |
|----------|----------|------|
| draft | 草稿 | 编辑中，前端不可见 |
| published | 已发布 | 前端可见 |

### 合规文档分类（category）

| 枚举值 | 显示名称 | 说明 |
|--------|----------|------|
| agreement | 协议 | 服务协议、数据处理协议 |
| policy | 政策 | 隐私政策 |
| certificate | 证书 | 资质证书 |

### 教程难度（difficulty）

| 枚举值 | 显示名称 | 适用读者 |
|--------|----------|----------|
| beginner | 初级 | 零基础用户 |
| intermediate | 中级 | 有基础运营人员 |
| advanced | 高级 | 开发者/架构师 |

### 渠道层级（channelTier）

| 枚举值 | 显示名称 |
|--------|----------|
| root | 根渠道 |
| official | 官方渠道 |
| partner | 合作伙伴 |
| agent | 代理渠道 |

### 渠道使用模式（channelUsage）

| 枚举值 | 说明 |
|--------|------|
| site_only_user | 仅站点渠道数据 |
| site_cross_user | 跨渠道可见（推荐） |
| channel_isolated | 渠道完全隔离 |

