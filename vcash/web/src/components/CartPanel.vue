<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore, type OrderLine } from '@/stores/cart';
import { formatMoney } from '@/utils/format';

const cart = useCartStore();
const router = useRouter();

const lines = computed(() => cart.lines);
const totalWithTax = computed(() => cart.totalWithTax);
const itemCount = computed(() => cart.itemCount);
const isEmpty = computed(() => cart.isEmpty);
const loading = computed(() => cart.loading);

function handleMinus(line: OrderLine) {
  const next = line.quantity - 1;
  // quantity=0 触发后端 adjustOrderLine 删除该行
  cart.updateItem(line.id, Math.max(0, next));
}

function handlePlus(line: OrderLine) {
  cart.updateItem(line.id, line.quantity + 1);
}

function handleCheckout() {
  if (isEmpty.value) return;
  router.push('/checkout');
}
</script>

<template>
  <div class="cart-panel">
    <div class="cart-header">
      <span class="title">购物车</span>
      <el-tag size="small" type="info" v-if="!isEmpty">{{ itemCount }} 件</el-tag>
    </div>

    <div class="cart-body" v-loading="loading">
      <div v-if="isEmpty" class="empty">请添加商品</div>
      <div v-else class="lines">
        <div v-for="line in lines" :key="line.id" class="line">
          <div class="line-info">
            <div class="line-name" :title="line.productVariant.name">
              {{ line.productVariant.name }}
            </div>
            <div class="line-sku" v-if="line.productVariant.sku">
              SKU: {{ line.productVariant.sku }}
            </div>
            <div class="line-unit">
              单价 ¥{{ formatMoney(line.unitPriceWithTax) }}
            </div>
            <div
              v-if="line.customFields.discount && line.customFields.discount < 100"
              class="line-discount"
            >
              {{ line.customFields.discount }}折
            </div>
          </div>
          <div class="line-qty">
            <el-button
              size="small"
              circle
              :disabled="loading"
              @click="handleMinus(line)"
            >
              −
            </el-button>
            <span class="qty">{{ line.quantity }}</span>
            <el-button
              size="small"
              circle
              :disabled="loading"
              @click="handlePlus(line)"
            >
              +
            </el-button>
          </div>
          <div class="line-subtotal">
            ¥{{ formatMoney(line.linePriceWithTax) }}
          </div>
        </div>
      </div>
    </div>

    <div class="cart-footer">
      <div class="total-row">
        <span class="total-label">合计</span>
        <span class="total-amount">¥{{ formatMoney(totalWithTax) }}</span>
      </div>
      <el-button
        type="primary"
        size="large"
        :disabled="isEmpty"
        :loading="loading"
        class="checkout-btn"
        @click="handleCheckout"
      >
        结账 (F1)
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.cart-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-left: 1px solid #ebeef5;
  box-sizing: border-box;
}
.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}
.title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.cart-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.empty {
  text-align: center;
  color: #909399;
  padding: 60px 0;
  font-size: 14px;
}
.lines {
  display: flex;
  flex-direction: column;
}
.line {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid #f0f2f5;
}
.line-info {
  min-width: 0;
}
.line-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.line-sku {
  font-size: 11px;
  color: #c0c4cc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.line-unit {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}
.line-discount {
  display: inline-block;
  font-size: 10px;
  color: #e6a23c;
  background: #fdf6ec;
  padding: 0 4px;
  border-radius: 2px;
  margin-top: 2px;
}
.line-qty {
  display: flex;
  align-items: center;
  gap: 6px;
}
.qty {
  min-width: 24px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}
.line-subtotal {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 600;
  min-width: 70px;
  text-align: right;
}
.cart-footer {
  border-top: 1px solid #ebeef5;
  padding: 12px 16px;
  background: #fafafa;
}
.total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}
.total-label {
  font-size: 14px;
  color: #606266;
}
.total-amount {
  font-size: 22px;
  color: #f56c6c;
  font-weight: 700;
}
.checkout-btn {
  width: 100%;
}
</style>
