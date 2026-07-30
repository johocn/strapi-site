# zhao_market_pos 聚合码支付并发资损修复设计

- **日期**: 2026-07-30
- **状态**: 已批准
- **范围**: zhao_market_pos 模块聚合码支付流程的并发安全修复
- **关联**: [zhao_market_pos 实施计划](../plans/2026-07-29-zhao-market-pos.md)

## 1. 背景与问题

### 1.1 当前实现

聚合码支付流程分三步：

1. 顾客扫码 → `create_pending_payment` 创建孤儿 payment（`pay_status='pending'`, `order_id=null`）
2. 收银台轮询 `get_pending_payments` → 收银员点"确认收款" → `confirm_payment` 改 `pay_status='confirmed'`（幂等）
3. 收银员提交订单 → `submit_order` → `_apply_payment` 用 `write({order_id})` 关联到新订单

### 1.2 资损场景

两个收银台同时轮询到同一笔 pending payment：

```
收银台 A: confirm_payment(#100) → pay_status='confirmed'
收银台 B: confirm_payment(#100) → 幂等返回 True（已 confirmed）
收银台 A: submit_order → _apply_payment → payment#100.write({order_id: 1})
收银台 B: submit_order → _apply_payment → payment#100.write({order_id: 2})  ← 覆盖！
```

**结果**：订单 #1 丢失支付记录（资损 + 对账不平），订单 #2 关联了本属于 #1 的支付。

### 1.3 根因

- `confirm_payment` 只改 `pay_status`，不绑定订单
- `_apply_payment` 用 `write` 覆盖 `order_id`，无"已被占用"检查
- 整个流程无行锁，`confirm` 与 `submit` 之间存在时间窗口

## 2. 设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 确认与提交是否合并 | **合并为原子操作** | 消除中间窗口，最简方案 |
| 失败处理策略 | **B' 后端回滚 + 前端保留** | 后端干净（事务回滚），前端友好（购物车保留） |
| 并发认领机制 | **A 条件 UPDATE** | 单条 SQL 原子完成，无死锁，DB 级保证 |
| 废弃策略 | **C 删后端+前端，测试改为验证新逻辑** | 无死代码，新逻辑有完整测试覆盖 |

## 3. 架构改动

### 3.1 核心思路

删除独立的 `confirm_payment` 步骤，将"认领 pending payment"合并到 `submit_order` 的 `_apply_payment` 中，用条件 UPDATE 实现原子认领。

### 3.2 数据流（新）

```
顾客扫码 → pending payment（pay_status='pending', order_id=null）
     ↓
收银台轮询 get_pending_payments → 显示待确认列表
     ↓
收银员选该支付 + 提交订单 → submit_order
     ↓
_apply_payment 条件 UPDATE WHERE pay_status='pending'
     ├─ rowcount=1：认领成功，order+lines+payment 提交
     └─ rowcount=0：抛 PosServiceError → 事务回滚（order 撤销）→ 前端保留 cart，提示换支付方式
```

## 4. 组件改动

### 4.1 后端 `controllers/pos_service.py`

**修改 `_apply_payment`**（pending payment 分支）：

```python
def _apply_payment(self, order, pay):
    pending_id = pay.get('pending_payment_id')
    if pending_id:
        # 聚合码：条件 UPDATE 原子认领，避免并发覆盖
        # WHERE pay_status='pending' 确保只有第一个事务能认领
        self.env.cr.execute("""
            UPDATE zhao_market_pos_payment
            SET order_id=%s, pay_status='confirmed', pay_time=NOW(),
                amount=%s, payment_method=%s
            WHERE id=%s AND pay_status='pending'
        """, (order.id, pay['amount'], pay.get('payment_method', 'mixed'), pending_id))
        if self.env.cr.rowcount == 0:
            raise PosServiceError("聚合码支付已被其他订单认领或状态异常")
        return
    # 普通支付：直接创建（config_id 从 order 取）—— 保持不变
    self.env['zhao.market.pos.payment'].create({...})
```

**删除 `confirm_payment` 方法**（第 342-354 行）。

### 4.2 后端 `controllers/pos_controller.py`

**删除 `/v1/payment/confirm` 端点**（第 216-224 行）。

### 4.3 前端 `frontend/src/api/client.ts`

**删除 `confirmPending` 函数**（第 102 行附近）。

### 4.4 前端 `frontend/src/stores/payment.ts`

**删除 `confirmPending` 方法**（第 70 行附近）。

聚合码支付在 `payments[]` 中保留 `pending_payment_id` 字段，submit 时随 payload 提交即可。

### 4.5 前端 `frontend/src/components/AggregatePayPanel.vue`

**删除"确认收款"按钮和 `confirmPending` 调用**（第 64-66 行附近）。

聚合码待支付列表改为"选择该支付方式"交互——点击后将其加入 `paymentStore.payments`（含 `pending_payment_id`），收银员点"提交订单"时一次性认领。

### 4.6 前端 `frontend/src/views/CheckoutView.vue`

**submit 失败处理**：

```typescript
async function onSubmit() {
  try {
    await api.submitOrder(payload)
    cartStore.clear()  // 成功才清空
    // ... 跳转小票页
  } catch (e) {
    // 失败：cartStore 不清空，paymentStore 重置，提示换支付方式
    paymentStore.reset()
    alert(e.message || '聚合码支付被抢，请选择其他支付方式')
  }
}
```

## 5. 错误处理（B' 策略）

| 层 | 失败行为 |
|----|----------|
| 后端 `_apply_payment` | 抛 `PosServiceError` |
| 后端 `submit_order` | `savepoint` 回滚，order/lines 全部撤销 |
| controller | `PosServiceError` → 400 响应 `{ok: false, error: "聚合码支付已被其他订单认领"}` |
| 前端 `onSubmit` | catch 错误 → 不调 `cartStore.clear()` → `paymentStore.reset()` → 提示换支付方式 |

## 6. 测试改动

### 6.1 `tests/test_pos_service.py`

**删除**：
- `test_confirm_payment_idempotent`
- `test_confirm_payment_*` 相关用例

**新增**：
- `test_apply_payment_atomic_claim_success`：正常认领 pending → pay_status 变 confirmed, order_id 绑定
- `test_apply_payment_concurrent_claim_second_fails`：模拟并发——先用 SQL 把 pay_status 改成 confirmed，再调 `_apply_payment` 应抛 `PosServiceError`
- `test_submit_order_rollback_on_payment_claim_conflict`：submit_order 中 `_apply_payment` 失败时，order 应不存在（事务回滚验证）

### 6.2 `tests/test_pos_controller.py`

**删除**：`test_payment_confirm_missing_payment_id`（端点已删）

### 6.3 `tests/test_cashier_e2e.py`

**修改聚合码 E2E 流程**：原"confirm + submit"两步改为"submit 时直接认领"单步：
- 删除 `self.service.confirm_payment(pid)` 调用
- submit_order payload 中带 `pending_payment_id`，验证一次性认领成功

## 7. 风险点与缓解

| 风险 | 缓解 |
|------|------|
| 前端残留 confirm 调用 | 删除 api/store/组件三层，构建后 grep 验证无残留 |
| 原生 SQL 维护成本 | service 层已有原生 SQL 先例（如 hold_key 唯一检查），此处条件 UPDATE 是必要权衡，注释说明 |
| 前端轮询列表清洁 | 被认领的 payment `pay_status` 已不是 `pending`，`get_pending_payments` 自然过滤 |
| submit 失败后购物车状态 | cartStore 不清空，收银员可直接改支付方式重提（创建新 order） |

## 8. 不在范围内

- 聚合码支付孤儿记录清理 cron（独立问题，扫描发现的风险点 #3，后续处理）
- `hold_key` TOCTOU 竞态（独立问题，风险点 #4，后续处理）
- F1-F12 快捷键冲突（独立问题，风险点 #5，后续处理）
- 聚合码支付速率限制（独立问题，风险点 #3，后续处理）
