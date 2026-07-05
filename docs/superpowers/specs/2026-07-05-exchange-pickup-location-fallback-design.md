# 积分兑换页自提点兜底与渠道过滤设计

- 日期：2026-07-05
- 涉及前端：shao/pages/exchange/exchange.vue
- 后端：无改动

## 1. 需求

页面 `http://localhost:5175/#/pages/exchange/exchange`（shao 目录积分兑换页）需增强：

1. 商品列表按"全渠道 + zhao-common 用户可访问渠道"过滤
2. 点击兑换按钮后，根据商品所属渠道查询自提点，按数量兜底处理：
   - 自提点数量 = 0 → 不显示自提点选项
   - 自提点数量 = 1 → 自动选中（兜底）
   - 自提点数量 > 1 → 允许用户单选

## 2. 现状分析

### 商品列表查询（exchange.vue:551）

```ts
getPointProductList({ status: 'on_shelf' })  // 未按渠道过滤
```

### 自提点选择（exchange.vue:222-230）

- 自提点是"可选"的（placeholder "请选择自提点（可选）"）
- 跳转独立列表页 `/pages/pickup-location/list?channelId=...` 选择
- 未根据商品渠道预筛选自提点
- 未做数量兜底

### 后端接口（已就绪，无需改动）

- `GET /zhao-common/v1/channels/available`：返回用户可访问渠道并集（site channels ∪ user channels）
- `GET /zhao-point/v1/point/pickup-locations?channelId=xxx`：公开自提点列表，channelId 兼容 numeric id 与 documentId（point.ts:200）
- `GET /zhao-point/v1/point/products`：商品列表

## 3. 设计方案

### 3.1 改动范围

仅前端 `shao/pages/exchange/exchange.vue`，后端无改动。

| 模块 | 改动 |
|------|------|
| 商品列表查询 | 接入 `/zhao-common/v1/channels/available`，按可访问渠道过滤 |
| 兑换弹窗自提点逻辑 | 按 `product.channelId` 拉取自提点，根据数量决定 UI |
| 自提点选择 UI | 从"跳转独立页"改为"弹窗内联单选列表" |
| 配送方式可选性 | 自提点为 0 时隐藏自提选项 |

### 3.2 商品列表过滤

`loadData()` 中并行调用三个接口，前端按可访问渠道二次过滤：

```ts
async function loadData() {
  loading.value = true
  try {
    const [balanceRes, availableChannelsRes, productRes] = await Promise.all([
      getPointBalance(),
      getAvailableChannels(),  // GET /zhao-common/v1/channels/available
      getPointProductList({ status: 'on_shelf' }),
    ])
    // ... balance 处理不变

    const accessibleChannelIds = (availableChannelsRes as any)?.data?.map(c => c.documentId) || []

    const rawList = (productRes as any)?.data?.records || (productRes as any)?.records || (productRes as any)?.data || []
    productList.value = rawList
      .filter((p: any) => {
        const cid = p.channel?.documentId || p.channel?.id || p.channelId
        // 商品未配渠道（全渠道商品）/ allowCrossChannel / 在可访问渠道列表内
        return !cid || p.allowCrossChannel || accessibleChannelIds.includes(String(cid))
      })
      .map((p: any) => ({
        // ... 字段映射不变
        channelId: p.channel?.documentId || p.channel?.id || p.channelId || '',
        // ...
      }))
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    loading.value = false
  }
}
```

**过滤规则**：
- `!cid` → 商品未配渠道（全渠道商品），放行
- `allowCrossChannel` → 显式跨渠道商品，放行
- `accessibleChannelIds.includes(String(cid))` → 商品渠道在用户可访问渠道列表内，放行

**字段统一**：`channelId` 取 `documentId` 优先（与 pickup-locations 接口兼容 documentId）。

### 3.3 兑换弹窗自提点逻辑

新增响应式状态：

```ts
const pickupLocations = ref<any[]>([])

async function loadPickupLocations(channelId: string) {
  if (!channelId) { pickupLocations.value = []; return }
  try {
    const res = await getPickupLocationList({ channelId })
    pickupLocations.value = (res as any)?.data?.records
      || (res as any)?.data?.list
      || (Array.isArray((res as any)?.data) ? (res as any).data : [])
  } catch {
    pickupLocations.value = []
  }
}
```

在 `showProductDetail(product)` 中：

```ts
async function showProductDetail(product: Product) {
  selectedProduct.value = product
  // ... 默认 deliveryType 设置、用户信息填充不变

  // 拉取自提点
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
  } else if (showPickup.value && !product.channelId) {
    // 全渠道商品且支持自提：不拉取（无 channelId），保持原"请选择自提点（可选）"行为
    pickupLocations.value = []
  }

  // ... 自动选中渠道积分逻辑不变
  showDetail.value = true
}
```

**注意**：`showPickup` computed 在 `selectedProduct.value` 赋值后已能正确计算，可安全使用。

### 3.4 UI 调整：内联单选列表

移除 `exchange.vue:222-230` 的"跳转独立页"逻辑，改为弹窗内联单选列表：

```html
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
        <text class="form-hint" v-if="pickupLocations.length === 1">（已自动选择）</text>
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
    <!-- 联系电话输入框保持原样 -->
  </view>
</view>
```

```ts
function selectPickupLocation(loc: any) {
  form.value.pickupLocationId = loc.documentId || loc.id
  form.value.pickupLocationName = loc.name
}
```

移除原 `selectPickupLocation` 跳转函数与 `uni.$on('selectPickupLocation')` 监听。

### 3.5 配送方式可选性

`showPickup` / `showExpress` / `canConfirm` computed 调整：

```ts
const showPickup = computed(() => {
  const dt = selectedProduct.value?.deliveryType
  if (!(dt === 'self_pickup' || dt === 'both')) return false
  // 自提点为 0 时隐藏自提选项（仅当有 channelId 时判断；全渠道商品保持原行为）
  if (selectedProduct.value?.channelId && pickupLocations.value.length === 0) return false
  return true
})

const canConfirm = computed(() => {
  if (!selectedProduct.value) return false
  const mode = selectedProduct.value.salesMode || 'points_only'
  if (mode !== 'purchase_only') {
    if (deductionDetail.value.shortfall > 0) return false
  }
  if (selectedProduct.value.stock <= 0) return false
  if (form.value.deliveryType === 'express') {
    return form.value.receiverName.trim() !== '' &&
      isValidPhone(form.value.receiverPhone) &&
      form.value.receiverAddress.trim() !== ''
  }
  if (form.value.deliveryType === 'self_pickup') {
    // 多个自提点时必须选一个
    if (pickupLocations.value.length > 1 && !form.value.pickupLocationId) return false
    return isValidPhone(form.value.receiverPhone)
  }
  return true
})
```

### 3.6 样式新增

```scss
.pickup-radio-list {
  display: flex; flex-direction: column; gap: 12rpx;
}
.pickup-radio-item {
  display: flex; align-items: flex-start; gap: 16rpx;
  padding: 20rpx; background: #f5f5f5; border-radius: 12rpx;
  border: 2rpx solid transparent;
  &.active { background: #f0f4ff; border-color: #667eea; }
}
.pickup-radio-icon {
  width: 36rpx; height: 36rpx; border-radius: 50%;
  border: 2rpx solid #d9d9d9; display: flex;
  align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 4rpx;
  .pickup-radio-item.active & { background: #667eea; border-color: #667eea; }
}
.pickup-radio-info { flex: 1; }
.pickup-radio-name { display: block; font-size: 28rpx; color: #333; font-weight: 500; }
.pickup-radio-address { display: block; font-size: 24rpx; color: #999; margin-top: 4rpx; }
.pickup-radio-phone { display: block; font-size: 22rpx; color: #999; margin-top: 4rpx; }
.form-hint { font-size: 22rpx; color: #999; margin-left: 8rpx; }
```

## 4. 数据流

1. 用户进入兑换页 → `loadData()` 并行调 3 个接口（balance / available-channels / products）
2. 前端按可访问渠道过滤商品列表
3. 用户点兑换 → `showProductDetail(product)` 拉取该商品渠道的自提点
4. 根据自提点数量决定 UI：
   - 0 → 隐藏自提选项，强制 express
   - 1 → 自动选中（兜底）
   - >1 → 显示内联单选列表，用户必须选一个
5. 用户确认 → `confirmExchange()` 提交（pickupLocationId 已自动或手动填好）

## 5. 边界情况

| 场景 | 处理 |
|------|------|
| 商品 `channelId` 为空（全渠道商品） | 不拉取自提点，保持原"请选择自提点（可选）"行为（若 deliveryType 含 self_pickup） |
| 商品 `deliveryType` 不含 `self_pickup` | 不拉取自提点，仅显示快递选项 |
| `loadPickupLocations` 失败 | `pickupLocations.value = []`，按 0 个处理（隐藏自提选项） |
| 用户切换 `deliveryType` 为 express | 不影响已选自提点（提交时若 express 则忽略 pickupLocationId） |
| 自提点 = 1 时用户改选 express | 自提点 ID 仍保留在 form 中，但提交时 express 分支不传 pickupLocationId（已有逻辑） |

## 6. 风险与回滚

- **风险**：
  - `/zhao-common/v1/channels/available` 需登录态 → 复用 `checkLoginStatus()` 已有逻辑，已登录才进页
  - 前端二次过滤可能漏掉某些边界 → 过滤规则保守（全渠道商品、allowCrossChannel 均放行）
- **回滚**：还原 `exchange.vue` 即可（shao 目录在 git 仓库外，无 commit 压力）

## 7. 验收标准

1. 商品列表仅显示：全渠道商品 / allowCrossChannel 商品 / 商品渠道在用户可访问渠道列表内的商品
2. 点击兑换按钮：
   - 商品无自提点 → 自提选项隐藏
   - 商品有 1 个自提点 → 自动选中，自提选项可见
   - 商品有多个自提点 → 显示内联单选列表，未选时无法确认
3. 提交兑换时 pickupLocationId 正确传递
4. 全渠道商品（无 channelId）保持原有"可选自提点"行为不破坏
