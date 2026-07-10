<template>
  <view class="tenant-selector" v-if="visible">
    <text class="label">租户：</text>
    <picker mode="selector" :range="tenantNames" @change="onChange" :value="selectedIndex">
      <view class="picker-value">{{ tenantNames[selectedIndex] || '全部租户' }}</view>
    </picker>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../store/user.js'
import { get } from '../utils/request.js'
import { extractList } from '../utils/format.js'

defineProps({
  modelValue: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'change'])

const userStore = useUserStore()
const visible = computed(() => userStore.hasPermission('menu.tenant'))

const tenants = ref([])
const selectedIndex = ref(0)

const tenantNames = computed(() => ['全部租户', ...tenants.value.map(t => t.name || t.tenantName || '未知')])

onMounted(async () => {
  if (!visible.value) return
  try {
    const res = await get('/zhao-auth/v1/admin/tenants').then(extractList)
    tenants.value = res?.list || []
  } catch (e) {
    console.warn('TenantSelector: 加载租户列表失败', e)
  }
})

const onChange = (e) => {
  selectedIndex.value = e.detail.value
  const tenantId = e.detail.value === 0 ? '' : (tenants.value[e.detail.value - 1]?.documentId || '')
  emit('update:modelValue', tenantId)
  emit('change', tenantId)
}
</script>

<style scoped>
.tenant-selector {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 12px;
}
.label {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
  white-space: nowrap;
}
.picker-value {
  font-size: 14px;
  color: #333;
  padding: 4px 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>
