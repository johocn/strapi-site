<template>
  <view v-if="renderedHtml" class="promo-custom-page">
    <rich-text :nodes="renderedHtml" class="custom-rich" />
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activity: { type: Object, default: null },
})

// 活动要素占位符 → 实际值映射
const placeholderMap = computed(() => {
  const a = props.activity || {}
  const fmtTime = (v) => {
    if (!v) return ''
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const cost = Number(a.cashPrice ?? 0)
  return {
    title: a.title || '',
    startTime: fmtTime(a.startTime),
    endTime: fmtTime(a.endTime),
    venueName: a.venueName || (a.venue && a.venue.name) || '',
    capacity: a.capacity == null ? '' : String(a.capacity),
    cashPrice: cost > 0 ? String(cost) : '',
    lecturer: (a.lecturer && a.lecturer.name) || '',
    description: a.description || '',
  }
})

const renderedHtml = computed(() => {
  const raw = (props.activity && props.activity.customPromoHtml) || ''
  if (!raw) return ''
  // 实时替换占位符；未提供的替换为空串
  return raw.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    return placeholderMap.value[key] !== undefined ? placeholderMap.value[key] : ''
  })
})
</script>

<style lang="scss" scoped>
.promo-custom-page { padding: 24rpx; }
.custom-rich { font-size: 28rpx; color: var(--c-text); line-height: 1.7; }
</style>