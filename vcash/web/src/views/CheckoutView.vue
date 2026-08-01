<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { formatMoney } from '@/utils/format';

const router = useRouter();
const cart = useCartStore();
const total = computed(() => cart.totalWithTax);
</script>

<template>
  <div class="checkout-placeholder">
    <h2>结账页 - 待实现</h2>
    <p class="hint">Task 3 将实现现金 / 聚合码支付流程</p>
    <p class="amount" v-if="!cart.isEmpty">应收：¥{{ formatMoney(total) }}</p>
    <el-button type="primary" @click="router.push('/cashier')">返回收银台</el-button>
  </div>
</template>

<style scoped>
.checkout-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
  color: #606266;
}
.checkout-placeholder h2 {
  color: #303133;
}
.hint {
  color: #909399;
  font-size: 13px;
}
.amount {
  font-size: 24px;
  color: #f56c6c;
  font-weight: 700;
}
</style>
