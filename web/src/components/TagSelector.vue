<template>
  <view class="tag-selector">
    <view class="selector-trigger" @click="openPicker">
      <view v-if="selectedTags.length === 0" class="placeholder">请选择标签</view>
      <view v-else class="selected-list">
        <view v-for="tag in selectedTags" :key="tag.documentId" class="selected-chip">
          <text class="chip-name">{{ tag.name }}</text>
          <text class="chip-badge" :class="{ public: tag.isPublic, site: !tag.isPublic }">
            {{ tag.isPublic ? '公共' : '站点' }}
          </text>
          <text class="chip-remove" @click.stop="removeTag(tag)">×</text>
        </view>
      </view>
    </view>

    <TagPicker
      :visible="pickerVisible"
      :selected="selectedTags"
      :siteId="siteId"
      @select="handleSelect"
      @update:visible="pickerVisible = $event"
    />
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import TagPicker from './TagPicker.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  siteId: { type: String, default: null },
  label: { type: String, default: '标签' },
})
const emit = defineEmits(['update:modelValue'])

const pickerVisible = ref(false)
const selectedTags = ref([])

watch(() => props.modelValue, (newVal) => {
  const currentIds = selectedTags.value.map(t => t.documentId)
  if (JSON.stringify(currentIds) === JSON.stringify(newVal)) return
  // modelValue 是 documentId 数组；selectedTags 完整对象由 picker 返回时填充
}, { immediate: true })

function openPicker() {
  pickerVisible.value = true
}

function handleSelect(tags) {
  selectedTags.value = tags
  emit('update:modelValue', tags.map(t => t.documentId))
}

function removeTag(tag) {
  selectedTags.value = selectedTags.value.filter(t => t.documentId !== tag.documentId)
  emit('update:modelValue', selectedTags.value.map(t => t.documentId))
}
</script>

<style scoped>
.tag-selector { width: 100%; }
.selector-trigger {
  min-height: 72rpx;
  padding: 12rpx 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  align-items: center;
}
.placeholder { color: #999; font-size: 28rpx; }
.selected-list { display: flex; flex-wrap: wrap; gap: 8rpx; }
.selected-chip {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 4rpx 12rpx;
  background: #e3f2fd;
  border-radius: 16rpx;
  font-size: 24rpx;
}
.chip-name { color: #1989fa; }
.chip-badge {
  font-size: 18rpx;
  padding: 1rpx 8rpx;
  border-radius: 4rpx;
}
.chip-badge.public { background: #fff3e0; color: #faad14; }
.chip-badge.site { background: #e8f5e9; color: #07c160; }
.chip-remove { color: #999; margin-left: 4rpx; }
</style>
