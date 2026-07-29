# Odoo 19 中国本地化收银系统：会员核心（Phase 1）

- 日期：2026-07-29
- 仓库：[e:/code/odoo](file:///e:/code/odoo)
- 二开目录：[custom-addons](file:///e:/code/odoo/custom-addons)
- 目标版本：Odoo 19.0
- 模块版本：19.0.1.0.0
- 依赖基线：`zhao_company`、`zhao_pos`、`zhao_pos_receipt`、`zhao_pos_print`、`zhao_pos_shift`、`zhao_pos_iam`、`zhao_supply` 已落地（最新提交 `39803d4417f`，2026-07-29）

## 1. 背景与目标

### 1.1 现状盘点

`custom-addons` 下已有 7 个 `zhao_*` 模块覆盖中国本地化收银主链路：

| 模块 | 范围 |
|---|---|
| `zhao_company` | 公司主体：统一社会信用代码、法人、税号、门店类型 |
| `zhao_pos` | POS 核心：小票抬头/尾部、手动确认收款、默认收款方式、日结支付汇总 |
| `zhao_pos_receipt` | 聚合码收款：实收=应收、客户付款时间、确认金额、备注 |
| `zhao_pos_print` | 58mm/80mm 小票打印、打印机类型 |
| `zhao_pos_shift` | 班次交接：钱箱盘点、差额处理、店长确认 |
| `zhao_pos_iam` | 多门店权限矩阵：res.users + record rule 按 warehouse 隔离 |
| `zhao_supply` | 采购/调拨本地化：供应商编码、采购类型、调拨类型中文、门店调拨 |

### 1.2 缺口

零售高频需求缺失：会员管理。本期聚焦会员核心（Phase 1），储值/积分留待 Phase 2/3。

### 1.3 三层渐进路线

- **Phase 1（本期）`zhao_member`**：会员主档、实体卡、等级体系（手动+自动升降级）、商品级会员折扣、POS 集成
- **Phase 2（后续）`zhao_member_wallet`**：储值系统、充值规则引擎、POS 储值支付
- **Phase 3（后续）`zhao_member_points`**：积分累计（按商品类别）、积分兑换（抵扣现金+兑换商品）

每阶段独立可测、可上线；Phase 1 不依赖储值/积分，是最小 MVP。

### 1.4 目标

新增 `zhao_member` 模块，覆盖：
- 会员主档（手机号+实体卡+等级）
- 实体卡生命周期（正常/挂失/禁用/补办）
- 等级体系（手动+自动升降级，多条件 OR 规则）
- 商品级会员折扣（POS 下单时按会员等级应用）
- POS 前端集成（扫卡/输手机号选会员）

## 2. 架构与依赖关系

```
                     ┌─────────────────────────┐
                     │   zhao_member (新增)      │
                     │  - zhao.member            │
                     │  - zhao.member.card       │
                     │  - zhao.member.level      │
                     │  - zhao.member.level.rule │
                     │  - zhao.member.grade.log  │
                     │  - product.template 扩展  │
                     │  - pos.order 扩展         │
                     └────────────┬────────────┘
                                  │ depends
                ┌─────────────────┼─────────────────┐
                ▼                                   ▼
  ┌─────────────────────────────┐    ┌─────────────────────────────┐
  │   point_of_sale (原生)       │    │   product (原生)            │
  │  pos.order/pos.config        │    │  product.template           │
  └─────────────────────────────┘    └─────────────────────────────┘
                ▲                                   ▲
                │                                   │
  ┌─────────────────────────────┐    ┌─────────────────────────────┐
  │   zhao_pos_iam (已存在)      │    │   zhao_company (已存在)      │
  │  record rule 按 warehouse   │    │  公司主体                   │
  │  隔离会员数据                │    │                             │
  └─────────────────────────────┘    └─────────────────────────────┘
```

### 2.1 依赖关系

- `zhao_member` 依赖 `point_of_sale`、`product`、`zhao_company`
- 不依赖 `zhao_pos_iam`，但 record rule 设计兼容（会员按 warehouse 隔离）
- Phase 2/3 时由 `zhao_member_wallet`/`zhao_member_points` 依赖本模块

### 2.2 模块边界

- **不新增 res.partner 扩展**：会员独立模型，通过 `partner_id` 关联原生 partner（兼容 Odoo 原生客户管理）
- **实体卡与会员分离**：一个会员可有多张卡（补办场景），卡是会员的子记录
- **等级规则独立模型**：不把多条件 OR 塞进 level 字段，用 `zhao.member.level.rule` 子记录表达

### 2.3 核心取舍

- 会员是独立模型而非 res.partner 扩展：避免污染原生客户管理，支持一个会员多张卡的补办场景
- 商品级折扣独立字段：不复用 Odoo 原生 `discount`，避免与收银员手动折扣冲突
- 升级可连升多级，降级只降一级：升级是即时正向反馈应爽快，降级是惩罚应温和

## 3. 会员与卡模型

### 3.1 `zhao.member`（会员主档）

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | Char | 会员姓名（必填） |
| `mobile` | Char | 手机号（必填，唯一，11 位数字格式校验） |
| `partner_id` | Many2one → res.partner | 关联原生客户（可空，自动创建） |
| `level_id` | Many2one → zhao.member.level | 当前等级 |
| `card_ids` | One2many → zhao.member.card | 名下实体卡 |
| `active_card_id` | Many2one → zhao.member.card | 当前有效卡（compute，取 state=normal 的最新一张） |
| `birthday` | Date | 生日（可选） |
| `gender` | Selection | male/female/other |
| `total_consumption` | Float (compute) | 累计消费额（从 pos.order 聚合） |
| `total_orders` | Integer (compute) | 累计订单数 |
| `last_order_date` | Datetime (compute) | 最近消费时间 |
| `register_date` | Datetime | 注册时间（默认 now） |
| `warehouse_id` | Many2one → stock.warehouse | 注册门店（用于 zhao_pos_iam 隔离） |
| `note` | Text | 备注 |
| `active` | Boolean | 归档开关 |

**关键方法**
- `_compute_total_consumption()`：从 `pos.order` 聚合 `amount_total` where `zhao_member_id = self.id` and `state in ('paid','done','invoiced')`
- `action_zhao_manual_upgrade(level_id, reason)`：店长手动升级，写 `zhao.member.grade.log`
- `action_zhao_manual_downgrade(level_id, reason)`：店长手动降级
- `_check_auto_upgrade()`：订单完成后调用，按多条件 OR 规则检查是否自动升级
- `_check_period_downgrade()`：cron 调用，周期考核降级

**约束**
- `mobile` 唯一约束 + 11 位数字格式校验
- `partner_id` 若为空，创建时自动创建 res.partner

### 3.2 `zhao.member.card`（实体卡）

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | Char | 卡号（必填，唯一，扫码用） |
| `member_id` | Many2one → zhao.member | 绑定会员（必填） |
| `state` | Selection | `normal`（正常）/`lost`（挂失）/`disabled`（禁用） |
| `issue_date` | Datetime | 发卡时间 |
| `lost_date` | Datetime | 挂失时间 |
| `lost_reason` | Text | 挂失原因 |
| `replaced_card_id` | Many2one → zhao.member.card | 补办后的新卡（挂失时指向） |

**关键方法**
- `action_zhao_report_lost(reason)`：挂失，state→`lost`，写 `lost_date/lost_reason`
- `action_zhao_reissue(new_card_no)`：补办新卡，旧卡 state 保持 `lost` 且 `replaced_card_id` 指向新卡
- `action_zhao_disable()`：禁用（不可逆）

**卡状态流转**
```
normal ──挂失──▶ lost ──补办──▶ lost(指向新卡) + 新卡 normal
   │
   └──禁用──▶ disabled（终态）
```

**补办流程说明**
- 挂失后可补办：生成新卡，旧卡 `replaced_card_id` 指向新卡
- 会员的 `active_card_id` compute 自动取最新的 `normal` 卡
- 补办后旧卡永久不可用（state=lost，无法恢复）

**关键取舍**：卡与会员分离，补办通过 `replaced_card_id` 链表表达——支持实体卡挂失补办的真实场景，同时 `active_card_id` compute 自动取最新正常卡，POS 扫卡时无需关心历史卡。

## 4. 等级体系与升降级规则

### 4.1 `zhao.member.level`（等级定义）

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | Char | 等级名称（如普通/银卡/金卡/钻石） |
| `sequence` | Integer | 排序（数值越小等级越低） |
| `discount_rate` | Float | 默认折扣率（0-100，如 95=95折；作为商品级折扣的兜底） |
| `level_rule_ids` | One2many → zhao.member.level.rule | 升级规则（多条件 OR） |
| `downgrade_threshold` | Float | 保级阈值（周期内消费额低于此值则降级） |
| `downgrade_target_id` | Many2one → zhao.member.level | 降级目标等级（通常=sequence 更低的上一级） |
| `active` | Boolean | 归档开关 |

### 4.2 `zhao.member.level.rule`（升级规则，多条件 OR）

| 字段 | 类型 | 说明 |
|---|---|---|
| `level_id` | Many2one → zhao.member.level | 目标等级 |
| `rule_type` | Selection | `total_consumption`（累计消费额）/`single_order`（单笔消费额）/`total_orders`（累计订单数） |
| `threshold` | Float | 阈值（如 1000.0） |
| `sequence` | Integer | 规则排序 |

**多条件 OR 逻辑**
- 同一 level 下可配多条 rule，任意一条满足即升级
- 例如金卡：`total_consumption >= 5000` OR `single_order >= 1000` OR `total_orders >= 50`

### 4.3 `zhao.member.grade.log`（等级变更日志）

| 字段 | 类型 | 说明 |
|---|---|---|
| `member_id` | Many2one → zhao.member | 会员 |
| `from_level_id` | Many2one → zhao.member.level | 原等级 |
| `to_level_id` | Many2one → zhao.member.level | 新等级 |
| `change_type` | Selection | `auto_upgrade`/`auto_downgrade`/`manual_upgrade`/`manual_downgrade` |
| `reason` | Text | 变更原因 |
| `changed_by` | Many2one → res.users | 操作人 |
| `changed_at` | Datetime | 变更时间 |

### 4.4 升级流程

```
pos.order 完成 → zhao.member._check_auto_upgrade()
                  │
                  ├─ 取当前 level 的下一级（sequence 更大的 level）
                  ├─ 遍历下一级的 level_rule_ids
                  ├─ 任一 rule 满足 → 升级 + 写 grade.log(auto_upgrade)
                  └─ 继续递归检查（可能连升多级）
```

### 4.5 降级流程

```
cron（每月1日 02:00）→ zhao.member._check_period_downgrade()
                  │
                  ├─ 遍历非最低等级会员
                  ├─ 取上月消费总额
                  ├─ 若 < 当前 level.downgrade_threshold
                  ├─ 降级到 downgrade_target_id
                  └─ 写 grade.log(auto_downgrade, reason="周期考核未达标")
```

**Cron 配置**
- 模型：`ir.cron`，name="会员等级周期考核"
- interval：每月 1 日 02:00
- 调用：`zhao.member._check_period_downgrade()`

**关键方法**
- `zhao.member._check_auto_upgrade()`：订单完成 hook 调用，连升多级
- `zhao.member._check_period_downgrade()`：cron 调用，单次降一级（不连降）
- `zhao.member.level._get_next_level(current_level)`：取下一级
- `zhao.member.level._get_previous_level(current_level)`：取上一级（降级目标兜底）

**约束**
- 等级不可删除（只能归档），避免 grade.log 外键失效
- 最低等级无 `downgrade_threshold`/`downgrade_target_id`（不降级）
- 手动升降级和自动升降级都写 log，变更可追溯

**关键取舍**：升级可连升多级，降级只降一级——升级是即时正向反馈应爽快，降级是惩罚应温和（避免一次考核从金卡跌回普通）。

## 5. 商品级会员折扣与 POS 集成

### 5.1 `zhao.member.level.discount`（商品×等级折扣）

| 字段 | 类型 | 说明 |
|---|---|---|
| `product_tmpl_id` | Many2one → product.template | 商品（必填） |
| `level_id` | Many2one → zhao.member.level | 会员等级（必填） |
| `discount_rate` | Float | 折扣率（0-100，如 88=88折） |

**约束**
- `(product_tmpl_id, level_id)` 联合唯一
- `discount_rate` 范围 0-100

### 5.2 `product.template` 扩展

| 字段 | 类型 | 说明 |
|---|---|---|
| `zhao_member_discount_ids` | One2many → zhao.member.level.discount | 该商品的会员等级折扣配置 |

### 5.3 `pos.order` 扩展

| 字段 | 类型 | 说明 |
|---|---|---|
| `zhao_member_id` | Many2one → zhao.member | 下单会员（可空=非会员订单） |
| `zhao_member_level_id` | Many2one → zhao.member.level | 下单时会员等级（快照） |
| `zhao_member_discount_total` | Float (compute) | 本单会员折扣总金额（原价-实收） |

### 5.4 `pos.order.line` 扩展

| 字段 | 类型 | 说明 |
|---|---|---|
| `zhao_member_discount` | Float | 该行应用的会员折扣率（0-100） |
| `zhao_original_price_unit` | Float | 原价（快照） |
| `zhao_discounted_price_unit` | Float (compute) | 折后价 `= original * (1 - discount/100)` |

### 5.5 折扣计算逻辑

**选会员时（pos.order.zhao_member_id 变更）**
```
for line in order.lines:
    if order.zhao_member_id:
        level = order.zhao_member_id.level_id
        # 1. 优先查商品级折扣 zhao.member.level.discount
        product_discount = search(product=line.product_id.product_tmpl_id, level=level)
        if product_discount:
            line.zhao_member_discount = product_discount.discount_rate
        else:
            # 2. 兜底用 level.discount_rate
            line.zhao_member_discount = level.discount_rate
    else:
        line.zhao_member_discount = 0
    # 3. 重算 line 价格
    line._compute_amount_line()
```

### 5.6 POS 前端集成

- 新增 `zhao_pos_member.js` 扩展：下单界面加「会员」按钮，弹窗输入手机号或扫卡
- 选中会员后：写入 `zhao_member_id`，触发 `onchange` 重算所有行价格
- 前端显示：订单头部显示会员姓名+等级，每行显示折扣率

### 5.7 关键方法

- `pos.order._onchange_zhao_member_id()`：会员变更时重算所有行折扣
- `pos.order.line._compute_zhao_discounted_price()`：计算折后价
- `pos.order.action_pos_order_paid()`（覆写）：订单确认时触发 `_check_auto_upgrade()`。经源码验证，Odoo 19 中 `action_pos_order_paid`（`addons/point_of_sale/models/pos_order.py:852`）是订单状态变 `paid` 的唯一入口，第 878 行 `self.write({'state': 'paid'})`

### 5.8 与原生折扣的关系

- 不复用 Odoo 原生 `discount` 字段（避免与收银员手动折扣冲突）
- `zhao_member_discount` 独立计算，`price_unit` 存储折后价
- 收银员仍可在会员折扣基础上手动改价（覆盖 `price_unit`）

### 5.9 权限

- `zhao_pos_iam` record rule：`pos.order` 按 `warehouse_id` 隔离 → 会员订单自动按门店隔离
- `zhao.member` 新增 record rule：按 `warehouse_id` 隔离（与 pos.order 一致）

**关键取舍**：不复用原生 `discount` 字段，用独立的 `zhao_member_discount` + `zhao_original_price_unit` 快照——避免与收银员手动折扣冲突，同时保留原价用于审计和统计。

## 6. 数据流、错误处理与测试策略

### 6.1 会员订单完整时序

```
收银员                pos.order              zhao.member
   │                     │                       │
   │  扫卡/输手机号        │                       │
   │────────────────────▶│  查询会员+卡           │
   │                     │──────────────────────▶│
   │                     │  返回 member_id+level  │
   │                     │◀──────────────────────│
   │  写 zhao_member_id   │                       │
   │────────────────────▶│  onchange 重算折扣     │
   │                     │  按行查 zhao.member.level.discount
   │                     │  兜底用 level.discount_rate
   │  接单/支付           │                       │
   │────────────────────▶│  order.state='paid'   │
   │                     │  _check_auto_upgrade()│
   │                     │──────────────────────▶│
   │                     │  若满足升级规则        │
   │                     │  写 grade.log         │
   │                     │  更新 level_id        │
   │                     │◀──────────────────────│
   │  打印小票（含会员信息）│                       │
   │◀────────────────────│                       │
```

### 6.2 周期降级时序

```
cron（每月1日 02:00）
   │
   ├─ 遍历非最低等级会员
   ├─ 查上月 pos.order 聚合消费额
   ├─ 若 < 当前 level.downgrade_threshold
   ├─ 降级到 downgrade_target_id
   ├─ 写 grade.log(auto_downgrade)
   └─ 发送内部消息通知店长
```

### 6.3 错误处理（用户可读 ValidationError）

| 场景 | 处理 |
|---|---|
| 手机号格式错误（非 11 位数字） | `ValidationError("手机号格式错误，请输入 11 位数字")` |
| 手机号重复 | `ValidationError("该手机号已注册会员")` |
| 卡号重复 | `ValidationError("该卡号已存在")` |
| 挂失非 normal 状态卡 | `ValidationError("仅正常状态的卡可挂失")` |
| 补办非 lost 状态卡 | `ValidationError("仅挂失状态的卡可补办")` |
| 手动升级到非更高等级 | `ValidationError("手动升级只能升到更高等级")` |
| 手动降级到非更低等级 | `ValidationError("手动降级只能降到更低等级")` |
| 会员被禁用后下单 | `ValidationError("该会员已禁用，无法使用")` |
| 卡被挂失/禁用后下单 | `ValidationError("该卡已挂失/禁用，请补办新卡")` |

### 6.4 测试矩阵

**`tests/test_member.py`（会员与卡 CRUD）**

| 用例 | 覆盖 |
|---|---|
| `test_01_create_member` | 创建会员+自动创建 partner |
| `test_02_mobile_unique` | 手机号重复报错 |
| `test_03_mobile_format` | 非 11 位手机号报错 |
| `test_04_create_card` | 发卡+绑定会员 |
| `test_05_card_unique` | 卡号重复报错 |
| `test_06_card_lost` | 挂失状态流转 |
| `test_07_card_reissue` | 补办新卡+旧卡 replaced_card_id |
| `test_08_active_card_compute` | active_card_id 自动取最新 normal 卡 |
| `test_09_card_disable` | 禁用不可逆 |

**`tests/test_level.py`（等级与升降级）**

| 用例 | 覆盖 |
|---|---|
| `test_01_level_sequence` | 等级排序与 next/previous |
| `test_02_auto_upgrade_total_consumption` | 累计消费额触发自动升级 |
| `test_03_auto_upgrade_single_order` | 单笔消费额触发自动升级 |
| `test_04_auto_upgrade_multi_jump` | 连升多级 |
| `test_05_auto_downgrade_period` | 周期考核降级 |
| `test_06_manual_upgrade` | 店长手动升级+写 log |
| `test_07_manual_downgrade` | 店长手动降级+写 log |
| `test_08_manual_upgrade_invalid` | 手动升到更低等级报错 |
| `test_09_downgrade_lowest_level` | 最低等级不降级 |

**`tests/test_member_pos.py`（POS 集成与折扣）**

| 用例 | 覆盖 |
|---|---|
| `test_01_member_order` | 会员订单+会员信息写入 |
| `test_02_product_level_discount` | 商品级折扣优先于等级兜底 |
| `test_03_level_fallback_discount` | 无商品级折扣时用 level.discount_rate |
| `test_04_non_member_order` | 非会员订单折扣=0 |
| `test_05_member_change_recalc` | 中途换会员重算折扣 |
| `test_06_order_complete_auto_upgrade` | 订单完成触发自动升级 |
| `test_07_member_disabled_order` | 禁用会员下单报错 |
| `test_08_card_lost_order` | 挂失卡下单报错 |
| `test_09_total_consumption_compute` | 累计消费额从 pos.order 聚合 |

**`tests/test_member_isolation.py`（多门店隔离）**

| 用例 | 覆盖 |
|---|---|
| `test_01_member_warehouse_isolated` | 会员按 warehouse 隔离 |

### 6.5 测试基础设施

- 复用 `TransactionCase` + `@tagged('post_install', '-at_install')`
- `setUpClass` 创建：2 个 level（普通/银卡）+ 升级规则 + 测试商品 + pos.config
- 多门店隔离测试用 `with_user` 切换用户上下文

### 6.6 测试执行命令

```
e:\code\odoo\venv\Scripts\python.exe e:\code\odoo\odoo-bin -c e:\code\odoo\odoo.conf -d odoo_dev -i zhao_member --test-enable --test-tags=/zhao_member --stop-after-init
```

### 6.7 验收标准

- 28 个用例全部 PASS（member 9 + level 9 + member_pos 9 + isolation 1）
- 无 Traceback，无 AccessError
- 模块安装退出码 0

### 6.8 关键取舍

- **错误处理用 ValidationError**：与 zhao_pos_shift/zhao_pos_iam 一致，保持 Odoo 原生交互风格
- **等级变更全量写 log**：手动/自动、升级/降级都写 `zhao.member.grade.log`，变更可追溯
- **自动升级在订单 `state=paid` 时即时触发，降级在 cron 月度触发**：升级是正向反馈应即时，降级是负向惩罚应周期性（避免单笔退款导致降级抖动）

## 7. 关键取舍汇总

| 决策点 | 选择 | 理由 |
|---|---|---|
| 会员模型 | 独立 `zhao.member`（非 res.partner 扩展） | 避免污染原生客户管理；支持一个会员多张卡 |
| 实体卡 | 独立 `zhao.member.card` 子记录 | 支持挂失补办场景；active_card_id compute 取最新正常卡 |
| 等级规则 | 独立 `zhao.member.level.rule` 子记录 | 多条件 OR 用子记录表达，不塞进 level 字段 |
| 会员折扣 | 独立 `zhao_member_discount` 字段 + `zhao_original_price_unit` 快照 | 不复用原生 `discount`，避免与收银员手动折扣冲突 |
| 升级策略 | 连升多级 | 正向反馈应爽快 |
| 降级策略 | 单次降一级 | 负向惩罚应温和，避免一次考核跌回普通 |
| 自动升级时机 | 订单 state=paid 即时触发 | 正向反馈即时 |
| 降级时机 | cron 月度触发 | 避免单笔退款导致降级抖动 |
| 错误提示 | ValidationError | 与已有 zhao_* 模块一致 |

## 8. 不在范围内（YAGNI）

- 储值系统（Phase 2 `zhao_member_wallet`）
- 积分系统（Phase 3 `zhao_member_points`）
- 会员营销（生日券、唤醒券）
- 会员标签/分群
- 微信小程序/公众号对接
- 会员导入导出（Excel）
- 会员消费数据分析看板
- 会员价批量配置工具
