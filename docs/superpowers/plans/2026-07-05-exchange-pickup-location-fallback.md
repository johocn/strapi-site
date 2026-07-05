# 积分兑换页自提点兜底与渠道过滤 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** shao 目录积分兑换页增加渠道过滤与自提点兜底逻辑——商品列表按可访问渠道过滤，兑换弹窗按商品渠道拉取自提点并根据数量自动处理（0 隐藏 / 1 自动选中 / >1 单选）。

**Architecture:** 仅前端改动 `shao/pages/exchange/exchange.vue` 与 `shao/services/api.ts`（新增 `getAvailableChannels`）。后端接口已就绪：`/zhao-common/v1/channels/available` 与 `/zhao-point/v1/point/pickup-locations?channelId=xxx`。

**Tech Stack:** Vue 3 + uni-app + TypeScript。

**Spec:** `docs/superpowers/specs/2026-07-05-exchange-pickup-location-fallback-design.md`

---

## File Structure

| 文件 | 责任 | 改动类型 |
|------|------|----------|
| `shao/services/api.ts` | API 接口定义 | 修改（新增 `getAvailableChannels`） |
| `shao/pages/exchange/exchange.vue` | 兑换页组件 | 修改（商品过滤 + 自提点兜底 + 内联单选 UI） |

无新增文件。后端无改动。

---

### Task 1: api.ts 新增 getAvailableChannels

**Files:**
- Modify: `shao/services/api.ts`（在自提点 API 区段之前或积分 API 区段之后新增）

- [ ] **Step 1: 在 `shao/services/api.ts` 第 377 行附近（`getPointRules` 函数之后）新增 `getAvailableChannels` 函数**

定位锚点：找到 `export async function getPointRules(params?: { action?: string; category?: string })` 函数结束的位置（第 377 行），在其后插入：

```ts
// 获取用户可访问渠道（site channels ∪ user channels）
export async function getAvailableChannels() {
  const res = await request('/zhao-common/v1/channels/available')
  return res?.data ?? res
}
```

- [ ] **Step 2: 验证文件无语法错误**

Run:
```bash
cd e:\code\shao && npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```
Expected: 无新增错误（已有错误可能存在，重点看新增的 `getAvailableChannels` 是否引发报错）。

- [ ] **Step 3: 提交**

`shao` 目录在 `e:\code` git 仓库外（untracked），跳过 git commit。改动保留在工作区即可。

---

### Task 2: exchange.vue 引入 getAvailableChannels 并改造商品列表过滤

**Files:**
- Modify: `shao/pages/exchange/exchange.vue:266`（import）与 `546-584`（loadData）

- [ ] **Step 1: 修改 import 语句**

定位 `shao/pages/exchange/exchange.vue:266`：

```ts
import { getPointBalance, getPointProductList, redeemPoints } from '../../services/api'
```

改为：

```ts
import { getPointBalance, getPointProductList, redeemPoints, getAvailableChannels } from '../../services/api'
```

- [ ] **Step 2: 改造 loadData 函数**

定位 `shao/pages/exchange/exchange.vue` 的 `loadData` 函数（约第 546-584 行），将整个函数替换为：

```ts
async function loadData() {
  loading.value = true
  try {
    const [balanceRes, availableChannelsRes, productRes] = await Promise.all([
      getPointBalance(),
      getAvailableChannels(),
      getPointProductList({ status: 'on_shelf' }),
    ])
    pointsBalance.value = (balanceRes as any)?.balance ?? 0
    channelBalances.value = (balanceRes as any)?.channelBalances || []
    globalBalance.value = (balanceRes as any)?.globalBalance ?? 0

    // 用户可访问渠道 documentId 列表
    const availableData = (availableChannelsRes as any)?.data || (availableChannelsRes as any) || []
    const accessibleChannelIds = (Array.isArray(availableData) ? availableData : [])
      .map((c: any) => c.documentId || c.id)
      .filter(Boolean)

    const rawList = (productRes as any)?.data?.records || (productRes as any)?.records || (productRes as any)?.data || []
    productList.value = rawList
      .filter((p: any) => {
        // 商品未配渠道（全渠道商品）/ allowCrossChannel / 在可访问渠道列表内
        const cid = p.channel?.documentId || p.channel?.id || p.channelId
        return !cid || p.allowCrossChannel || accessibleChannelIds.includes(String(cid))
      })
      .map((p: any) => ({
        id: p.id,
        documentId: p.documentId,
        name: p.name || '',
        subtitle: p.subtitle || '',
        description: p.description || '',
        detail: p.detail || '',
        pointsCost: p.pointsCost || 0,
        originalPrice: p.originalPrice || 0,
        stock: p.stock ?? 0,
        deliveryType: p.deliveryType || 'express',
        category: p.category || '',
        coverImageUrl: getMediaUrl(p.coverImage),
        imagesList: (p.images || []).map((img: any) => getMediaUrl(img)),
        maxPerUser: p.maxPerUser || 0,
        salesMode: p.salesMode || 'points_only',
        price: parseFloat(p.price) || 0,
        channelId: p.channel?.documentId || p.channel?.id || p.channelId || '',
        allowCrossChannel: p.allowCrossChannel || false,
        allowGlobalPoints: p.allowGlobalPoints !== false,
      }))
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    loading.value = false
  }
}
```

**关键改动**：
1. `Promise.all` 增加 `getAvailableChannels()`
2. 解析 `accessibleChannelIds`（兼容 `data` 字段或直接数组）
3. `rawList.filter(...)` 前端二次过滤
4. `channelId` 字段优先取 `documentId`（与 pickup-locations 接口兼容）

- [ ] **Step 3: 验证无 TS 错误**

Run:
```bash
cd e:\code\shao && npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```
Expected: 无新增错误。

- [ ] **Step 4: 提交**

shao 目录在 git 仓库外，跳过 commit。

---

### Task 3: exchange.vue 新增 pickupLocations 状态与 loadPickupLocations 函数

**Files:**
- Modify: `shao/pages/exchange/exchange.vue`（状态定义区 + 函数区）

- [ ] **Step 1: 新增 pickupLocations 状态**

定位 `shao/pages/exchange/exchange.vue` 的状态定义区（约第 313-333 行，`const loading = ref(false)` 之后），新增：

```ts
const pickupLocations = ref<any[]>([])
```

完整上下文（在第 322 行 `const phoneFocus = ref(false)` 之后新增一行）：

```ts
const nameFocus = ref(false)
const phoneFocus = ref(false)
const pickupLocations = ref<any[]>([])
```

- [ ] **Step 2: 修改 import 语句引入 getPickupLocationList**

定位 `shao/pages/exchange/exchange.vue:266`，当前 import 语句为：

```ts
import { getPointBalance, getPointProductList, redeemPoints, getAvailableChannels } from '../../services/api'
```

改为：

```ts
import { getPointBalance, getPointProductList, redeemPoints, getAvailableChannels, getPickupLocationList } from '../../services/api'
```

- [ ] **Step 3: 新增 loadPickupLocations 函数**

在 `shao/pages/exchange/exchange.vue` 的 `selectPickupLocation` 函数（约第 379-382 行）之前新增 `loadPickupLocations` 函数：

```ts
async function loadPickupLocations(channelId: string) {
  if (!channelId) { pickupLocations.value = []; return }
  try {
    const res = await getPickupLocationList({ channelId })
    const data = (res as any)?.data || {}
    let list: any[] = data.records || data.list || []
    if (!Array.isArray(list)) list = Array.isArray(data) ? data : []
    pickupLocations.value = list
  } catch {
    pickupLocations.value = []
  }
}
```

- [ ] **Step 4: 验证无 TS 错误**

Run:
```bash
cd e:\code\shao && npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```
Expected: 无新增错误。

---

### Task 4: exchange.vue 改造 showProductDetail 加自提点兜底逻辑

**Files:**
- Modify: `shao/pages/exchange/exchange.vue:586-628`（showProductDetail）

- [ ] **Step 1: 改造 showProductDetail 函数**

定位 `shao/pages/exchange/exchange.vue` 的 `showProductDetail` 函数（约第 586-628 行），将整个函数替换为：

```ts
async function showProductDetail(product: Product) {
  // 先赋值，让 computed 生效
  selectedProduct.value = product
  // 根据商品配送类型设置默认配送方式
  if (product.deliveryType === 'self_pickup') {
    form.value.deliveryType = 'self_pickup'
  } else {
    form.value.deliveryType = 'express'
  }
  // 从用户信息自动填充姓名和手机号
  const user = getUser()
  form.value.receiverName = user?.name || user?.nickname || user?.username || ''
  form.value.receiverPhone = user?.phone || ''
  form.value.receiverAddress = ''
  form.value.remark = ''
  form.value.pickupLocationId = ''
  form.value.pickupLocationName = ''

  // 自提点兜底逻辑：拉取商品渠道下的自提点
  pickupLocations.value = []
  if (showPickup.value && product.channelId) {
    await loadPickupLocations(product.channelId)
    if (pickupLocations.value.length === 0) {
      // 无自提点，强制快递
      form.value.deliveryType = 'express'
    } else if (pickupLocations.value.length === 1) {
      // 兜底自动选中
      const loc = pickupLocations.value[0]
      form.value.pickupLocationId = loc.documentId || loc.id
      form.value.pickupLocationName = loc.name
    } else {
      // 多个自提点，清空选择等用户选
      form.value.pickupLocationId = ''
      form.value.pickupLocationName = ''
    }
  }

  // 按扣减顺序自动选中渠道，直到积分够用
  const cost = product.pointsCost || 0
  let remaining = cost

  // 第1级：本渠道（始终参与，无需选择）
  const ownBal = ownChannelBalance.value
  remaining -= Math.min(ownBal, remaining)

  // 第2级：按顺序选中跨渠道，直到够用
  const autoSelected: string[] = []
  if (remaining > 0 && product.allowCrossChannel) {
    for (const ch of availableChannelBalances.value) {
      if (remaining <= 0) break
      autoSelected.push(ch.channelId)
      remaining -= Math.min(ch.balance, remaining)
    }
  }
  form.value.selectedChannels = autoSelected

  // 第3级：如果还不够，自动开启全局积分
  form.value.useGlobalPoints = remaining > 0 && product.allowGlobalPoints && globalBalance.value > 0

  showDetail.value = true
}
```

**关键改动**：
1. 函数改为 `async`
2. 在 `form.value.pickupLocationName = ''` 之后插入自提点兜底逻辑
3. 自提点 = 0 → 强制 express；= 1 → 自动选中；> 1 → 等用户选

- [ ] **Step 2: 验证无 TS 错误**

Run:
```bash
cd e:\code\shao && npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```
Expected: 无新增错误。

---

### Task 5: exchange.vue 调整 showPickup / canConfirm computed

**Files:**
- Modify: `shao/pages/exchange/exchange.vue:384-392`（showPickup）与 `500-516`（canConfirm）

- [ ] **Step 1: 调整 showPickup computed**

定位 `shao/pages/exchange/exchange.vue:384-387`：

```ts
const showPickup = computed(() => {
  const dt = selectedProduct.value?.deliveryType
  return dt === 'self_pickup' || dt === 'both'
})
```

替换为：

```ts
const showPickup = computed(() => {
  const dt = selectedProduct.value?.deliveryType
  if (!(dt === 'self_pickup' || dt === 'both')) return false
  // 商品有 channelId 但自提点为 0 时隐藏自提选项
  if (selectedProduct.value?.channelId && pickupLocations.value.length === 0) return false
  return true
})
```

- [ ] **Step 2: 调整 canConfirm computed 的 self_pickup 分支**

定位 `shao/pages/exchange/exchange.vue` 的 `canConfirm` computed（约第 500-516 行），找到 `self_pickup` 分支：

```ts
  if (form.value.deliveryType === 'self_pickup') {
    return isValidPhone(form.value.receiverPhone)
  }
```

替换为：

```ts
  if (form.value.deliveryType === 'self_pickup') {
    // 多个自提点时必须选一个
    if (pickupLocations.value.length > 1 && !form.value.pickupLocationId) return false
    return isValidPhone(form.value.receiverPhone)
  }
```

- [ ] **Step 3: 验证无 TS 错误**

Run:
```bash
cd e:\code\shao && npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```
Expected: 无新增错误。

---

### Task 6: exchange.vue 改造自提点 UI 为内联单选列表

**Files:**
- Modify: `shao/pages/exchange/exchange.vue:217-241`（pickup-info 模板块）与 `379-382`（selectPickupLocation 函数）

- [ ] **Step 1: 改造自提点 UI 模板块**

定位 `shao/pages/exchange/exchange.vue:217-241` 的整个 `<!-- 自提信息 -->` 区块：

```html
              <!-- 自提信息 -->
              <view v-if="form.deliveryType === 'self_pickup'" class="pickup-info">
                <view class="pickup-tip">
                  <text>请前往指定地点自提，工作人员将核实您的兑换信息</text>
                </view>
                <view class="form-item" @click="selectPickupLocation">
                  <text class="form-label">选择自提点</text>
                  <view class="pickup-location-select">
                    <text :class="['pickup-location-text', { placeholder: !form.pickupLocationName }]">
                      {{ form.pickupLocationName || '请选择自提点（可选）' }}
                    </text>
                    <text class="pickup-location-arrow">></text>
                  </view>
                </view>
                <view class="form-item">
                  <view class="form-label-row">
                    <text class="form-label">联系电话 <text class="required">*</text></text>
                    <view class="form-actions" v-if="form.receiverPhone">
                      <text class="action-btn" @click="form.receiverPhone = ''">清空电话</text>
                    </view>
                  </view>
                  <input class="form-input" v-model="form.receiverPhone" placeholder="请输入11位手机号（用于核实身份）" type="number" maxlength="11" :focus="phoneFocus" @blur="phoneFocus = false" />
                  <text class="form-error" v-if="form.receiverPhone && !isValidPhone(form.receiverPhone)">请输入正确的11位手机号（1开头）</text>
                </view>
              </view>
```

替换为：

```html
              <!-- 自提信息 -->
              <view v-if="form.deliveryType === 'self_pickup'" class="pickup-info">
                <view v-if="pickupLocations.length === 0" class="pickup-tip">
                  <text>该商品未配置自提点，请选择快递配送</text>
                </view>
                <view v-else>
                  <view class="pickup-tip">
                    <text>请前往指定地点自提，工作人员将核实您的兑换信息</text>
                  </view>
                  <view class="form-item">
                    <text class="form-label">
                      选择自提点
                      <text class="required" v-if="pickupLocations.length > 1">*</text>
                      <text class="form-hint-inline" v-if="pickupLocations.length === 1">（已自动选择）</text>
                    </text>
                    <view class="pickup-radio-list">
                      <view
                        v-for="loc in pickupLocations"
                        :key="loc.documentId || loc.id"
                        :class="['pickup-radio-item', { active: form.pickupLocationId === (loc.documentId || loc.id) }]"
                        @click="selectPickupLocation(loc)"
                      >
                        <view class="pickup-radio-icon">
                          <text v-if="form.pickupLocationId === (loc.documentId || loc.id)" class="check-icon-sm">✓</text>
                        </view>
                        <view class="pickup-radio-info">
                          <text class="pickup-radio-name">{{ loc.name }}</text>
                          <text class="pickup-radio-address" v-if="loc.address">{{ loc.address }}</text>
                          <text class="pickup-radio-phone" v-if="loc.phone">📞 {{ loc.phone }}</text>
                        </view>
                      </view>
                    </view>
                  </view>
                  <view class="form-item">
                    <view class="form-label-row">
                      <text class="form-label">联系电话 <text class="required">*</text></text>
                      <view class="form-actions" v-if="form.receiverPhone">
                        <text class="action-btn" @click="form.receiverPhone = ''">清空电话</text>
                      </view>
                    </view>
                    <input class="form-input" v-model="form.receiverPhone" placeholder="请输入11位手机号（用于核实身份）" type="number" maxlength="11" :focus="phoneFocus" @blur="phoneFocus = false" />
                    <text class="form-error" v-if="form.receiverPhone && !isValidPhone(form.receiverPhone)">请输入正确的11位手机号（1开头）</text>
                  </view>
                </view>
              </view>
```

- [ ] **Step 2: 改造 selectPickupLocation 函数**

定位 `shao/pages/exchange/exchange.vue:379-382`：

```ts
function selectPickupLocation() {
  const channelId = selectedProduct.value?.channelId || ''
  uni.navigateTo({ url: `/pages/pickup-location/list?channelId=${channelId}` })
}
```

替换为：

```ts
function selectPickupLocation(loc: any) {
  form.value.pickupLocationId = loc.documentId || loc.id
  form.value.pickupLocationName = loc.name
}
```

- [ ] **Step 3: 移除 onMounted 中的 selectPickupLocation 监听**

定位 `shao/pages/exchange/exchange.vue` 的 `onMounted`（约第 713-719 行）：

```ts
onMounted(() => {
  uni.$on('selectPickupLocation', (location: any) => {
    form.value.pickupLocationId = location.documentId || location.id
    form.value.pickupLocationName = location.name
  })
  if (checkLoginStatus()) loadData()
})
```

替换为：

```ts
onMounted(() => {
  if (checkLoginStatus()) loadData()
})
```

- [ ] **Step 4: 验证无 TS 错误**

Run:
```bash
cd e:\code\shao && npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```
Expected: 无新增错误。

---

### Task 7: exchange.vue 新增内联单选列表样式

**Files:**
- Modify: `shao/pages/exchange/exchange.vue`（`<style>` 区块末尾，约第 970 行附近）

- [ ] **Step 1: 在 `<style lang="scss" scoped>` 末尾新增样式**

定位 `shao/pages/exchange/exchange.vue` 的 `<style>` 区块末尾（`</style>` 之前，约第 970 行），新增：

```scss
/* 内联自提点单选列表 */
.pickup-radio-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.pickup-radio-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  &.active {
    background: #f0f4ff;
    border-color: #667eea;
  }
}
.pickup-radio-icon {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4rpx;
  background: #fff;
  .pickup-radio-item.active & {
    background: #667eea;
    border-color: #667eea;
  }
}
.pickup-radio-info {
  flex: 1;
  min-width: 0;
}
.pickup-radio-name {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}
.pickup-radio-address {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pickup-radio-phone {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}
.form-hint-inline {
  font-size: 22rpx;
  color: #999;
  margin-left: 8rpx;
}
```

- [ ] **Step 2: 验证无 SCSS 编译错误**

如有构建命令可执行：
```bash
cd e:\code\shao && npm run build 2>&1 | tail -20
```
Expected: 构建成功（uni-app 构建可能耗时较长，可选步骤）。

---

### Task 8: 浏览器验证

**Files:**
- 无文件改动，仅运行时验证

- [ ] **Step 1: 启动 shao 开发服务器**

如未启动，运行：
```bash
cd e:\code\shao && npm run dev:h5
```
Expected: 服务启动，访问 `http://localhost:5175/`。

- [ ] **Step 2: 验证商品列表过滤**

操作：
1. 登录后访问 `http://localhost:5175/#/pages/exchange/exchange`
2. 检查商品列表

Expected:
- 仅显示：全渠道商品（无 channelId）/ allowCrossChannel 商品 / 商品渠道在用户可访问渠道列表内的商品
- 不显示其他渠道的私有商品

- [ ] **Step 3: 验证自提点兜底（0 个自提点）**

操作：
1. 找到 `deliveryType` 含 `self_pickup` 且渠道下无自提点的商品
2. 点击兑换

Expected:
- 兑换弹窗中自提选项隐藏
- 配送方式仅显示快递

- [ ] **Step 4: 验证自提点兜底（1 个自提点）**

操作：
1. 找到渠道下仅 1 个自提点的商品
2. 点击兑换

Expected:
- 自提选项可见
- 自提点已自动选中（绿色 ✓）
- 标签显示"（已自动选择）"

- [ ] **Step 5: 验证自提点兜底（多个自提点）**

操作：
1. 找到渠道下有多个自提点的商品
2. 点击兑换

Expected:
- 自提选项可见
- 显示内联单选列表，未选时确认按钮置灰
- 选择一个后确认按钮可点击

- [ ] **Step 6: 验证兑换提交**

操作：
1. 选好自提点，填写手机号
2. 点击确认兑换

Expected:
- 兑换成功
- 接口请求体中 `pickupLocationId` 正确传递

---

## Self-Review

**1. Spec coverage:**
- 3.1 商品列表过滤 → Task 1 (api.ts) + Task 2 (loadData) ✓
- 3.2 兑换弹窗自提点逻辑 → Task 3 (loadPickupLocations) + Task 4 (showProductDetail) ✓
- 3.3 UI 内联单选 → Task 6 (template + selectPickupLocation) ✓
- 3.4 配送方式可选性 → Task 5 (showPickup / canConfirm) ✓
- 3.5 样式 → Task 7 ✓
- 5 边界情况 → Task 4 (无 channelId 不拉取) + Task 5 (length=0 隐藏) ✓
- 7 验收标准 → Task 8 全覆盖 ✓

**2. Placeholder scan:** 无 TBD/TODO/"implement later"，所有代码块完整。

**3. Type consistency:**
- `pickupLocations: ref<any[]>` 在 Task 3 定义，Task 4/5/6 使用一致 ✓
- `loadPickupLocations(channelId: string)` 在 Task 3 定义，Task 4 调用一致 ✓
- `selectPickupLocation(loc: any)` 在 Task 6 改造，template 中 `@click="selectPickupLocation(loc)"` 一致 ✓
- `getAvailableChannels` 在 Task 1 定义，Task 2 import 使用 ✓
- `getPickupLocationList` 在 Task 3 import，loadPickupLocations 调用 ✓

无问题。
