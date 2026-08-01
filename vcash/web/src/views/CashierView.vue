<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStore } from '@/stores/session';

const sessionStore = useSessionStore();
const sessionInfo = computed(() => sessionStore.currentSession);
</script>

<template>
  <div class="cashier-placeholder">
    <h2>收银台 - 待实现</h2>
    <p v-if="sessionInfo">
      当前班次：{{ sessionInfo.code }} | 终端：{{ sessionInfo.terminal?.name }}
    </p>
  </div>
</template>

<style scoped>
.cashier-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #999;
}
</style>
