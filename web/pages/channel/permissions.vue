<template>
  <view class="page-container">
    <PageHeader title="渠道权限">
      <button class="btn-primary" @click="openAssign" v-if="hasPermission('channel.user-channel.assign')">+ 分配渠道</button>
    </PageHeader>

    <view class="filter-bar">
      <input type="text" v-model="keyword" placeholder="搜索用户名/邮箱" class="filter-input" @confirm="loadData" />
      <button class="btn-search" @click="loadData">搜索</button>
    </view>

    <view class="user-list">
      <view v-for="user in userList" :key="user.userId" class="user-card">
        <view class="user-header">
          <view class="user-info">
            <view class="user-avatar">{{ (user.username || user.email || '?')[0].toUpperCase() }}</view>
            <view class="user-detail">
              <view class="user-name">{{ user.username || user.email || `用户 #${user.userId}` }}</view>
              <view class="user-email" v-if="user.username && user.email">{{ user.email }}</view>
            </view>
          </view>
          <view class="user-meta">
            <view class="count-badge">{{ user.channels.length }} 个渠道</view>
            <view class="action-btn assign" @click="openAssignForUser(user)" v-if="hasPermission('channel.user-channel.assign')">+ 分配</view>
          </view>
        </view>

        <view class="channel-tags" v-if="user.channels.length > 0">
          <view v-for="ch in user.channels" :key="ch.relationId" class="channel-tag">
            <text class="channel-tag-name">{{ ch.name || `渠道 #${ch.channelId}` }}</text>
            <text class="channel-tag-remove" v-if="hasPermission('channel.user-channel.revoke')" @click="handleRevoke(user, ch)">✕</text>
          </view>
        </view>
        <view v-else class="no-channel">暂无关联渠道</view>
      </view>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-if="!loading && userList.length === 0" class="empty-state">
      <text class="empty-icon">🔗</text>
      <text class="empty-text">暂无用户渠道数据</text>
    </view>

    <!-- 分配渠道弹窗 -->
    <view class="modal-mask" v-if="showAssignModal" @click="closeAssign">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">分配渠道</text>
          <text class="modal-close" @click="closeAssign">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item" v-if="!assignForm.userId">
            <text class="form-label">用户 ID <text class="required">*</text></text>
            <input type="number" v-model="assignForm.userIdInput" placeholder="请输入用户 ID" class="form-input" />
          </view>
          <view class="form-item" v-else>
            <text class="form-label">目标用户</text>
            <view class="form-picker disabled">
              <text>{{ assignForm.userName || `用户 #${assignForm.userId}` }}</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">渠道 <text class="required">*</text></text>
            <picker mode="selector" :range="channelOptions" :range-key="'name'" @change="handleChannelChange">
              <view class="form-picker">
                <text>{{ assignForm.channelName || '请选择渠道' }}</text>
                <text class="arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeAssign">取消</button>
          <button class="btn-submit" @click="handleAssign" :loading="assigning">确认分配</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  getUserChannelList,
  assignUserChannel,
  revokeUserChannel,
  getAdminChannelList,
} from '../../src/api/channel.js'
import { useUserStore } from '../../src/store/user.js'
import PageHeader from '../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const userList = ref([])
const channelOptions = ref([])
const loading = ref(false)
const keyword = ref('')
const showAssignModal = ref(false)
const assigning = ref(false)

const assignForm = ref({
  userId: null,
  userIdInput: '',
  userName: '',
  channelId: null,
  channelName: '',
})

function groupByUser(list) {
  const map = new Map()
  list.forEach(item => {
    const user = item.user || {}
    const channel = item.channel || {}
    const userId = user.id || user.documentId || item.userId
    if (!userId) return
    if (!map.has(userId)) {
      map.set(userId, {
        userId,
        username: user.username || '',
        email: user.email || '',
        channels: [],
      })
    }
    map.get(userId).channels.push({
      relationId: item.id || item.documentId,
      channelId: channel.id || channel.documentId || item.channelId,
      name: channel.name || '',
    })
  })
  return Array.from(map.values())
}

async function loadData() {
  loading.value = true
  try {
    const params = { populate: ['user', 'channel'] }
    const res = await getUserChannelList(params)
    let list = res.list ?? []
    if (keyword.value) {
      const kw = keyword.value.toLowerCase()
      list = list.filter(item => {
        const u = item.user || {}
        return (u.username && u.username.toLowerCase().includes(kw)) ||
               (u.email && u.email.toLowerCase().includes(kw))
      })
    }
    userList.value = groupByUser(list)
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadChannels() {
  try {
    const res = await getAdminChannelList({ 'pagination[pageSize]': 200 })
    channelOptions.value = res.list ?? []
  } catch (e) {
    // ignore
  }
}

function openAssign() {
  assignForm.value = {
    userId: null,
    userIdInput: '',
    userName: '',
    channelId: null,
    channelName: '',
  }
  showAssignModal.value = true
}

function openAssignForUser(user) {
  assignForm.value = {
    userId: user.userId,
    userIdInput: String(user.userId),
    userName: user.username || user.email,
    channelId: null,
    channelName: '',
  }
  showAssignModal.value = true
}

function closeAssign() {
  showAssignModal.value = false
}

function handleChannelChange(e) {
  const selected = channelOptions.value[e.detail.value]
  if (!selected) return
  assignForm.value.channelId = selected.id || selected.documentId
  assignForm.value.channelName = selected.name || ''
}

async function handleAssign() {
  const userId = assignForm.value.userId || Number(assignForm.value.userIdInput)
  if (!userId) {
    return uni.showToast({ title: '请输入用户 ID', icon: 'none' })
  }
  if (!assignForm.value.channelId) {
    return uni.showToast({ title: '请选择渠道', icon: 'none' })
  }
  assigning.value = true
  try {
    await assignUserChannel({ userId, channelId: assignForm.value.channelId })
    uni.showToast({ title: '分配成功', icon: 'success' })
    closeAssign()
    loadData()
  } catch (e) {
    uni.showToast({ title: '分配失败', icon: 'none' })
  } finally {
    assigning.value = false
  }
}

function handleRevoke(user, channel) {
  uni.showModal({
    title: '确认撤销',
    content: `确定要撤销「${user.username || user.email || `用户 #${user.userId}`}」对渠道「${channel.name || channel.channelId}」的访问权限吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await revokeUserChannel(channel.relationId)
          uni.showToast({ title: '已撤销', icon: 'success' })
          loadData()
        } catch (e) {
          uni.showToast({ title: '撤销失败', icon: 'none' })
        }
      }
    }
  })
}

onMounted(() => {
  if (hasPermission('channel.user-channel.read')) {
    loadData()
    loadChannels()
  }
})
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx; box-sizing: border-box; }

.btn-primary {
  background: #07c160; color: #fff; padding: 16rpx 32rpx;
  font-size: 30rpx; border-radius: 8rpx; border: none; line-height: 1.2;
}

.filter-bar {
  display: flex; gap: 16rpx; margin-bottom: 20rpx;
}
.filter-input {
  flex: 1; height: 80rpx; background: #fff; border-radius: 8rpx;
  padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box;
}
.btn-search {
  width: 140rpx; height: 80rpx; line-height: 80rpx; text-align: center;
  background: #1989fa; color: #fff; font-size: 28rpx; border-radius: 8rpx; border: none;
}

.user-list { display: flex; flex-direction: column; gap: 16rpx; }

.user-card {
  background: #fff; border-radius: 12rpx; padding: 24rpx;
}

.user-header {
  display: flex; justify-content: space-between; align-items: center;
}
.user-info { display: flex; align-items: center; gap: 20rpx; flex: 1; }
.user-avatar {
  width: 72rpx; height: 72rpx; border-radius: 36rpx;
  background: #e3f2fd; color: #1976d2; display: flex;
  align-items: center; justify-content: center;
  font-size: 32rpx; font-weight: bold; flex-shrink: 0;
}
.user-detail { flex: 1; }
.user-name { font-size: 30rpx; font-weight: bold; color: #333; }
.user-email { font-size: 24rpx; color: #999; margin-top: 4rpx; }

.user-meta { display: flex; align-items: center; gap: 16rpx; }
.count-badge {
  font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 16rpx;
  background: #f5f5f5; color: #666;
}

.action-btn { padding: 12rpx 24rpx; border-radius: 8rpx; font-size: 24rpx; text-align: center; }
.action-btn.assign { background: #e3f2fd; color: #1976d2; }

.channel-tags {
  display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 20rpx;
}
.channel-tag {
  display: flex; align-items: center; gap: 8rpx;
  background: #f0f7ff; color: #1976d2; padding: 8rpx 16rpx;
  border-radius: 8rpx; font-size: 24rpx;
}
.channel-tag-name { }
.channel-tag-remove {
  color: #ff4d4f; font-size: 24rpx; padding: 0 4rpx;
}
.no-channel {
  font-size: 24rpx; color: #bbb; margin-top: 16rpx;
}

.loading, .empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 100rpx 0;
}
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #999; }

.modal-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
}
.modal-content {
  width: 90%; background: #fff; border-radius: 16rpx;
  overflow: hidden; display: flex; flex-direction: column;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 30rpx; border-bottom: 1rpx solid #f0f0f0;
}
.modal-title { font-size: 32rpx; font-weight: bold; color: #333; }
.modal-close { font-size: 36rpx; color: #999; padding: 10rpx; }

.modal-body { padding: 30rpx; }

.form-item { margin-bottom: 32rpx; }
.form-item:last-child { margin-bottom: 0; }
.form-label { font-size: 28rpx; color: #333; margin-bottom: 12rpx; display: block; }
.required { color: #ff4d4f; }

.form-input {
  width: 100%; height: 80rpx; background: #f5f5f5; border-radius: 8rpx;
  padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box;
}
.form-picker {
  display: flex; justify-content: space-between; align-items: center;
  height: 80rpx; background: #f5f5f5; border-radius: 8rpx; padding: 0 20rpx;
  font-size: 28rpx;
}
.form-picker.disabled { color: #999; }
.arrow { font-size: 20rpx; color: #999; }

.modal-footer {
  display: flex; gap: 20rpx; padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
}
.btn-cancel {
  flex: 1; height: 88rpx; line-height: 88rpx; text-align: center;
  background: #f5f5f5; color: #666; font-size: 30rpx; border-radius: 8rpx; border: none;
}
.btn-submit {
  flex: 1; height: 88rpx; line-height: 88rpx; text-align: center;
  background: #07c160; color: #fff; font-size: 30rpx; border-radius: 8rpx; border: none;
}
</style>
