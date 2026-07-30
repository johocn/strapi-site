# zhao_member_points 会员积分模块设计

- **日期**: 2026-07-30
- **状态**: 已批准
- **范围**: 会员积分获取/抵扣/回滚 MVP 闭环
- **关联**: zhao_member（会员主档+等级）、zhao_market_pos（收银台对接）

## 1. 背景与目标

### 1.1 背景

zhao_member 模块已完成 Phase 1（会员主档+实体卡+等级+折扣），但完全没有任何积分字段、模型或业务逻辑。zhao_market_pos 订单模型已预留 `member_points_used`/`member_points_earned` 字段（默认 0），等待积分模块对接。

本模块为 Phase 3，从零构建积分获取/抵扣/回滚闭环。

### 1.2 核心目标

- **消费赠积分**：订单支付后按消费额 × 等级倍率自动累加
- **积分抵扣现金**：收银台结账时可选积分抵扣部分金额
- **退货回滚**：退货时按比例回滚已获积分、返还已扣积分
- **多门店隔离**：积分流水按门店隔离，与 zhao_member 一致

## 2. 范围

### 2.1 MVP 必做

- 积分获取：订单支付后自动触发，按 `floor(amount_paid × level.points_earn_rate)`
- 积分抵扣：收银台结账时选用，固定汇率 `100 积分 = 1 元`，单笔最多抵扣订单金额 50%
- 积分回滚：退货时回滚获取+返还抵扣
- 积分流水：完整审计记录
- 多门店隔离

### 2.2 不做（第二版）

- 积分有效期（滚动 12 月）
- 积分兑换商品
- 活动双倍积分
- 积分转储值
- 后台积分报表

## 3. 设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 获取规则 | 消费额 × 等级倍率 | 超市主流，配置轻，1 元=1 积分，金卡 1.5 倍 |
| 抵扣规则 | 固定汇率 100 积分=1 元 | 简单透明，便于收银员心算 |
| 抵扣上限 | 单笔最多抵扣订单金额 50% | 防止积分滥用导致实付过低 |
| 余额存储 | store 字段 + history 流水 | 查询用 store 字段（性能），审计用 history（完整） |
| 获取触发点 | `action_pos_order_paid` 钩子 | zhao_member 已覆写此方法，插入 `_earn_points_from_order()` |
| 等级倍率快照 | 下单时锁定 `zhao_member_level_id`（已有） | 避免下单后等级变更导致积分回溯 |
| 并发抵扣 | SQL 原子扣减 | `UPDATE ... SET balance=balance-X WHERE balance>=X` |
| 回滚顺序 | 先回滚获取，再返还抵扣 | 避免中间态余额为负 |
| 退货抵扣返还 | 返还到余额 | 不退款现金，只返还积分 |

## 4. 数据模型

### 4.1 新模型 `zhao.member.points.history`（积分流水表）

借鉴 `zhao.member.grade.log` 结构：

| 字段 | 类型 | 说明 |
|---|---|---|
| member_id | Many2one→zhao.member | 必填 |
| order_id | Many2one→pos.order | 可空（手工调整时无订单） |
| change_type | Selection | `earn`(获取) / `deduct`(抵扣) / `refund_earn`(退货回滚获取) / `refund_deduct`(退货返还抵扣) / `adjust`(手工调整) |
| points | Integer | 变更积分数（正数加，负数减） |
| balance_after | Integer | 变更后余额（快照） |
| amount_paid | Float | 关联订单实付金额（获取规则计算依据） |
| rate_applied | Float | 实际倍率（快照） |
| warehouse_id | Many2one→stock.warehouse | 门店（多门店隔离） |
| reason | Char | 备注 |
| changed_by | Many2one→res.users | 操作人 |
| changed_at | Datetime | 时间 |

**约束**：
- `member_id` 必填（非空约束）
- `change_type` 必填
- `points != 0`（变更数不能为 0）
- `balance_after >= 0`（余额不能为负）

### 4.2 扩展 `zhao.member`

新增字段：
- `points_balance` Integer（当前积分余额，store=True，默认 0）

**不使用 compute from history**：高频查询场景下 store 字段性能更优，history 仅作审计。余额变更时在事务内显式更新。

### 4.3 扩展 `zhao.member.level`

新增字段：
- `points_earn_rate` Float（积分获取倍率，默认 1.0，金卡可设 1.5）

### 4.4 扩展 `pos.order`（zhao_member 已有 inherit）

新增字段：
- `points_earned` Integer（本单获取积分，默认 0）
- `points_used` Integer（本单抵扣积分，默认 0）
- `points_deduct_amount` Float（积分抵扣金额，默认 0.0）

### 4.5 扩展 `zhao.market.pos.order`

zhao_market_pos 已预留 `member_points_used` / `member_points_earned` 字段。本模块通过 inherit 同步填充：

**同步规则**：zhao_market_pos 的 `pos_service.submit_order` 在订单提交时已写入 `pos.order`，本模块在 `pos.order` 的 `write` override 中监听 `points_earned` / `points_used` 字段变更，自动同步到关联的 `zhao.market.pos.order`（通过 `pos.order` 的反向 One2many 或 session_id 关联查找）。

**触发时机**：仅在 `points_earned` / `points_used` 字段实际变更时触发，避免无效同步。

## 5. 核心业务流程

### 5.1 积分获取（订单支付后自动触发）

```
pos.order.action_pos_order_paid()  ← zhao_member 已覆写
  → [新增] _earn_points_from_order()
    → 查 order.zhao_member_level_id（下单时快照等级）
    → rate = level.points_earn_rate or 1.0
    → points = floor(order.amount_paid * rate)
    → if points > 0:
        → 创建 history(change_type='earn', points=+points, balance_after=new_balance)
        → member.points_balance += points
        → order.points_earned = points
```

**边界**：
- 无会员订单跳过
- `amount_paid <= 0` 跳过
- `points == 0` 不创建 history（避免无意义记录）

### 5.2 积分抵扣（收银台结账时）

```
收银员选择积分抵扣 → 输入抵扣积分数
  → points_service.apply_points_deduction(member_id, points_to_use, order_amount)
    → 校验：member.points_balance >= points_to_use
    → 校验：points_to_use <= floor(order_amount * 0.5 * 100)  // 50% 上限 × 汇率
    → SQL 原子扣减：UPDATE zhao_member SET points_balance = points_balance - X
                   WHERE id = member_id AND points_balance >= X
    → 若影响行数 = 0：抛异常"积分不足或并发冲突"
    → deduct_amount = points_to_use / 100.0
    → 创建 history(change_type='deduct', points=-points_to_use, balance_after=new_balance)
    → 返回 {deduct_amount, points_used} 给收银台
  → 收银台提交订单时 amount_paid = total - deduct_amount
  → 回写：
    - zhao.market.pos.order.member_points_used = points_to_use
    - pos.order.points_used = points_to_use（通过 pos.order write override 自动同步）
    - pos.order.points_deduct_amount = deduct_amount
```

### 5.3 积分回滚（退货）

```
pos.order 退货流程
  → points_service.refund_points(order)
    → 获取订单回滚：
        → if order.points_earned > 0:
          → 创建 history(change_type='refund_earn', points=-order.points_earned)
          → member.points_balance -= order.points_earned
          → 若余额变负：clamp 到 0，记录 warning（积分不足回滚）
    → 抵扣返还：
        → if order.points_used > 0:
          → 创建 history(change_type='refund_deduct', points=+order.points_used)
          → member.points_balance += order.points_used
    → 清零 order.points_earned / points_used / points_deduct_amount
```

**边界**：
- 回滚顺序：先回滚获取（减），再返还抵扣（加），避免中间态为负
- 余额不足回滚时 clamp 到 0（不抛异常，记录 warning）
- 已退货订单不重复回滚（检查 history 是否已有 refund 记录）

### 5.4 手工调整（店长后台）

```
店长在会员详情页点击"调整积分"
  → 输入调整积分数（正/负）+ 原因
  → points_service.adjust_points(member_id, points, reason)
    → 校验调整后余额 >= 0
    → 创建 history(change_type='adjust', points=±points, reason=reason)
    → 更新 member.points_balance
```

## 6. 架构与模块边界

### 6.1 模块结构

```
zhao_member_points/                     # 新模块
├── __init__.py
├── __manifest__.py
│   depends: ['zhao_member', 'zhao_market_pos', 'zhao_company']
├── models/
│   ├── __init__.py
│   ├── zhao_member.py                  # inherit: 加 points_balance
│   ├── zhao_member_level.py            # inherit: 加 points_earn_rate
│   ├── pos_order.py                    # inherit: 加 points_earned/used/deduct_amount
│   ├── zhao_member_points_history.py   # 新模型：积分流水
│   └── zhao_market_pos_order.py        # inherit: 同步预留字段
├── controllers/
│   └── points_service.py               # 积分业务逻辑层
├── views/
│   └── points_history_views.xml        # 流水查询视图
├── security/
│   └── ir.model.access.csv
└── tests/
    ├── __init__.py
    ├── test_points_earn.py             # 获取测试
    ├── test_points_deduct.py           # 抵扣测试
    └── test_points_refund.py           # 回滚测试
```

### 6.2 模块边界

1. **`points_service.py` 是积分业务逻辑层**（类比 pos_service.py 模式），所有积分变更逻辑集中在此
2. **zhao_market_pos 的 `pos_service.py` 调用 `points_service`** 完成抵扣（不直接操作积分模型）
3. **积分获取通过 `action_pos_order_paid` 钩子自动触发**，无需改 zhao_market_pos
4. **多门店隔离复用 zhao_company 的记录规则**，积分流水按 warehouse_id 隔离

### 6.3 对接点

| 对接方 | 方式 | 说明 |
|--------|------|------|
| zhao_member | inherit zhao.member | 加 points_balance 字段 |
| zhao_member | inherit zhao.member.level | 加 points_earn_rate 字段 |
| zhao_member | inherit pos.order | 加 points_earned/used/deduct_amount |
| zhao_member | 复用 action_pos_order_paid 钩子 | 插入 _earn_points_from_order() |
| zhao_market_pos | inherit zhao.market.pos.order | 同步 member_points_used/earned |
| zhao_market_pos | 提供 points_service API | 收银台调用 apply_points_deduction |
| zhao_company | 复用记录规则 | 多门店隔离 |

## 7. 风险点与缓解

| 风险 | 缓解 |
|------|------|
| 并发抵扣 | SQL 原子扣减 `UPDATE ... WHERE balance >= X`，影响行数=0 时抛异常 |
| 退货回滚顺序 | 先回滚获取（减）再返还抵扣（加），避免中间态为负 |
| 余额不足回滚 | clamp 到 0，不抛异常，记录 warning（避免退货流程卡住） |
| 跨模块 inherit 字段名冲突 | 新字段统一 `points_` 前缀，与 zhao_member 的 `zhao_member_` 前缀区分 |
| zhao_market_pos 前端改动 | 本模块只提供 API，前端改动由 zhao_market_pos 负责（独立 spec） |
| Odoo 19 适配 | 遵循 zhao_member 已验证的规范：`models.Constraint` 替代 `_sql_constraints`、`<list>` 替代 `<tree>` |

## 8. 测试策略

### 8.1 L1 单元测试（test_points_earn.py）

- `test_earn_points_basic`：订单支付后按消费额 × 倍率获取积分
- `test_earn_points_no_member`：无会员订单不获取积分
- `test_earn_points_zero_amount`：金额为 0 不获取积分
- `test_earn_points_level_snapshot`：用下单时快照等级倍率，非当前等级
- `test_earn_points_floor`：积分向下取整（floor）

### 8.2 L1 单元测试（test_points_deduct.py）

- `test_deduct_points_basic`：正常抵扣，余额扣减，返回 deduct_amount
- `test_deduct_points_insufficient_balance`：余额不足抛异常
- `test_deduct_points_over_50_percent`：超过 50% 上限抛异常
- `test_deduct_points_concurrent`：并发抵扣，第二个失败（SQL 原子扣减）
- `test_deduct_points_zero`：抵扣 0 积分抛异常

### 8.3 L1 单元测试（test_points_refund.py）

- `test_refund_points_basic`：退货回滚获取+返还抵扣
- `test_refund_points_only_earned`：仅获取无抵扣的订单退货
- `test_refund_points_only_deducted`：仅抵扣无获取的订单退货
- `test_refund_points_insufficient_balance`：余额不足回滚获取时 clamp 到 0
- `test_refund_points_already_refunded`：已退货订单不重复回滚

## 9. 不在范围内

- 积分有效期（第二版）
- 积分兑换商品（第二版）
- 活动双倍积分（第二版）
- 积分转储值（第二版）
- 后台积分报表（第二版）
- zhao_market_pos 收银台前端积分抵扣交互（独立 spec，由 zhao_market_pos 负责）
