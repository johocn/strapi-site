<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑知识点' : '新增知识点'">
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        
        <view class="form-item">
          <text class="form-label">名称 <text class="required">*</text></text>
          <input 
            type="text" 
            v-model="form.name" 
            placeholder="请输入知识点名称"
            class="form-input"
          />
        </view>

        <view class="form-item">
          <text class="form-label">描述</text>
          <textarea 
            v-model="form.description" 
            placeholder="请输入知识点描述（可选）"
            class="form-textarea"
          />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">属性设置</view>
        
        <view class="form-item">
          <text class="form-label">分组</text>
          <picker mode="selector" :range="groupOptions" range-key="name" @change="handleGroupChange">
            <view class="picker-value">
              <text>{{ selectedGroupName || '请选择分组' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">排序</text>
          <input 
            type="number" 
            v-model="form.sort" 
            placeholder="0"
            class="form-input"
          />
        </view>
      </view>
    </scroll-view>

    <view class="bottom-action">
      <button class="btn-save" @click="handleSubmit">保存知识点</button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import PageHeader from '../../src/components/PageHeader.vue'
import { getTagDetail, createTag, updateTag, getTagGroupList } from '../../src/api/tag.js'

const isEdit = ref(false)
const knowledgeId = ref('')
const groupOptions = ref([])

const form = reactive({
  name: '',
  description: '',
  tagGroup: null,
  sort: 0
})

const selectedGroupName = ref('')

async function loadGroups() {
  try {
    const { list } = await getTagGroupList()
    // 只保留"知识点"分组，自动绑定
    groupOptions.value = list.filter(g => g.slug === 'knowledge-point')
    if (groupOptions.value.length > 0) {
      const kpGroup = groupOptions.value[0]
      form.tagGroup = { documentId: kpGroup.documentId }
      selectedGroupName.value = kpGroup.name
    }
  } catch (e) {
    console.error('加载分组失败', e)
  }
}

function handleGroupChange(e) {
  const index = e.detail.value
  const group = groupOptions.value[index]
  if (group) {
    form.tagGroup = { documentId: group.documentId }
    selectedGroupName.value = group.name
  }
}

async function loadKnowledgeDetail() {
  if (!knowledgeId.value) return
  try {
    const data = await getTagDetail(knowledgeId.value)
    Object.assign(form, {
      name: data.name || '',
      description: data.description || '',
      tagGroup: data.tagGroup ? { documentId: data.tagGroup.documentId } : null,
      sort: data.sort || 0
    })
    if (data.tagGroup) {
      selectedGroupName.value = data.tagGroup.name
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.name) {
    uni.showToast({ title: '请输入知识点名称', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '保存中...' })
    
    if (isEdit.value) {
      await updateTag(knowledgeId.value, { ...form })
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      await createTag({ ...form })
      uni.showToast({ title: '创建成功', icon: 'success' })
    }
    
    uni.hideLoading()
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

onMounted(async () => {
  await loadGroups()
  
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}
  
  if (options.id) {
    isEdit.value = true
    knowledgeId.value = options.id
    await loadKnowledgeDetail()
  }
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 15rpx 30rpx;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.form-scroll {
  padding: 100rpx 30rpx 140rpx;
  height: 100vh;
}

.form-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.required {
  color: #ff4d4f;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  min-height: 160rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.picker-arrow {
  font-size: 20rpx;
  color: #999;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.btn-save {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
}
</style>
