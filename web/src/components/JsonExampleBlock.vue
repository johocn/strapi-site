<template>
  <view class="json-example-block">
    <view class="example-header">
      <text class="example-label">{{ fieldLabel }} 示例</text>
      <button class="btn-fill" @click="handleFill">填入示例</button>
    </view>
    <view class="example-content">
      <text class="example-text">{{ exampleJson }}</text>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  fieldLabel: { type: String, default: '' },
  exampleJson: { type: String, default: '' },
  fieldName: { type: String, default: '' },
})
const emit = defineEmits(['fill'])

function handleFill() {
  emit('fill', { fieldName: props.fieldName, exampleJson: props.exampleJson })
}
</script>

<style scoped>
.json-example-block {
  margin-top: 12rpx;
  padding: 16rpx;
  background: #f9f9f9;
  border: 1rpx dashed #ddd;
  border-radius: 8rpx;
}
.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}
.example-label {
  font-size: 24rpx;
  color: #666;
}
.btn-fill {
  background: #667eea;
  color: #fff;
  border: none;
  padding: 0 20rpx;
  height: 48rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  line-height: 48rpx;
}
.example-content {
  background: #fff;
  padding: 12rpx;
  border-radius: 6rpx;
  max-height: 200rpx;
  overflow-y: auto;
}
.example-text {
  font-size: 22rpx;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
}
</style>
