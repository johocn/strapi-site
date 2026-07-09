<template>
  <view class="page-container">
    <PageHeader title="客户档案">
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.customer-profile.create')">+ 新增</button>
    </PageHeader>

    <view class="search-section">
      <view class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索客户名 / 电话"
          @confirm="loadData(1)"
          class="search-input"
        />
        <text class="search-icon">🔍</text>
      </view>
      <view class="filter-row">
        <picker mode="selector" :range="stageOptions" @change="handleStageChange">
          <view class="filter-item">
            <text>{{ stageOptions[stageIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
        <picker mode="selector" :range="typeOptions" @change="handleTypeChange">
          <view class="filter-item">
            <text>{{ typeOptions[typeIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="profile-list">
      <view
        v-for="item in profileList"
        :key="item.documentId"
        class="profile-card"
        @click="goEdit(item.documentId)"
      >
        <view class="profile-info">
          <view class="profile-title">{{ item.name }}</view>
          <view class="profile-meta">
            <text class="meta-item">📞 {{ item.contactPhone }}</text>
            <text class="meta-item" v-if="item.company">🏢 {{ item.company }}</text>
            <text class="meta-item">🏷 {{ customerTypeText(item.customerType) }}</text>
            <text class="meta-item" v-if="item.country">🌐 {{ item.country }}</text>
          </view>
          <view class="profile-footer">
            <view class="profile-stage" :class="item.lifecycleStage">{{ stageText(item.lifecycleStage) }}</view>
            <view class="profile-stats">
              <text class="meta-item">报价 {{ item.totalQuoteCount || 0 }}</text>
              <text class="meta-item">订单 {{ item.totalOrderCount || 0 }}</text>
            </view>
          </view>
        </view>
        <view class="profile-actions">
          <view v-if="hasPermission('logistics.customer-profile.update')" class="action-btn merge" @click.stop="handleMerge(item)">合并</view>
          <view v-if="hasPermission('logistics.customer-profile.update')" class="action-btn edit" @click.stop="goEdit(item.documentId)">编辑</view>
          <view v-if="hasPermission('logistics.customer-profile.update')" class="action-btn delete" @click.stop="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>

    <view v-if="!loading && profileList.length === 0" class="empty-state">
      <text class="empty-icon">👤</text>
      <text class="empty-text">暂无客户档案</text>
      <button class="btn-primary" @click="goCreate" v-if="hasPermission('logistics.customer-profile.create')">立即添加</button>
    </view>

    <view class="pagination" v-if="pagination.total > (pagination.pageSize || 10)">
      <view class="pagination-btn" @click="prevPage" :class="{ disabled: currentPage === 1 }">上一页</view>
      <text class="pagination-info">{{ currentPage }} / {{ totalPages }}</text>
      <view class="pagination-btn" @click="nextPage" :class="{ disabled: currentPage >= totalPages }">下一页</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { customerProfileApi, logisticsActionApi } from '../../../src/api/logistics.js'
import { useUserStore } from '../../../src/store/user.js'
import { formatDate } from '../../../src/utils/format.js'
import PageHeader from '../../../src/components/PageHeader.vue'

const userStore = useUserStore()
const hasPermission = userStore.hasPermission

const searchKeyword = ref('')
const stageIndex = ref(0)
const stageOptions = ['全部阶段', '线索', '活跃', '复购', 'VIP', '流失']
const stageValues = ['', 'lead', 'active', 'repeat', 'vip', 'churned']
const stageMap = { lead: '线索', active: '活跃', repeat: '复购', vip: 'VIP', churned: '流失' }
function stageText(v) { return stageMap[v] || v || '-' }

const typeIndex = ref(0)
const typeOptions = ['全部类型', '个人', '企业', 'FBA 卖家']
const typeValues = ['', 'individual', 'business', 'fba_seller']
const customerTypeMap = { individual: '个人', business: '企业', fba_seller: 'FBA 卖家' }
function customerTypeText(v) { return customerTypeMap[v] || v || '-' }

const profileList = ref([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

const totalPages = computed(() => Math.ceil(pagination.value.total / (pagination.value.pageSize || 10)) || 1)

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = {
      'pagination[page]': page,
      'pagination[pageSize]': 10
    }
    if (searchKeyword.value) {
      params['filters[name][$contains]'] = searchKeyword.value
    }
    if (stageIndex.value > 0) {
      params['filters[lifecycleStage]'] = stageValues[stageIndex.value]
    }
    if (typeIndex.value > 0) {
      params['filters[customerType]'] = typeValues[typeIndex.value]
    }
    const { list, pagination: pg } = await customerProfileApi.list(params)
    profileList.value = list
    pagination.value = pg
    currentPage.value = page
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function handleStageChange(e) {
  stageIndex.value = e.detail.value
  loadData(1)
}
function handleTypeChange(e) {
  typeIndex.value = e.detail.value
  loadData(1)
}

function goCreate() {
  uni.navigateTo({ url: '/pages/logistics/customer-profile/edit' })
}
function goEdit(id) {
  uni.navigateTo({ url: `/pages/logistics/customer-profile/edit?documentId=${id}` })
}

async function handleDelete(item) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除客户档案「${item.name}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await customerProfileApi.delete(item.documentId)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadData(currentPage.value)
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

async function handleMerge(item) {
  uni.showModal({
    title: '合并客户档案',
    editable: true,
    placeholderText: `请输入目标客户档案 documentId（「${item.name}」将合并到目标档案）`,
    success: async (res) => {
      if (res.confirm && res.content) {
        try {
          await logisticsActionApi.profileMerge(item.documentId, res.content.trim())
          uni.showToast({ title: '合并成功', icon: 'success' })
          loadData(currentPage.value)
        } catch (e) {
          uni.showToast({ title: '合并失败', icon: 'none' })
        }
      }
    }
  })
}

function prevPage() {
  if (currentPage.value > 1) loadData(currentPage.value - 1)
}
function nextPage() {
  if (currentPage.value < totalPages.value) loadData(currentPage.value + 1)
}

onShow(() => {
  loadData(1)
})
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx; box-sizing: border-box; }

.btn-primary {
  background: #ff0000; color: #ffffff;
  padding: 16rpx 32rpx; font-size: 30rpx;
  border-radius: 8rpx; border: none; line-height: 1.2;
}

.search-section {
  background: #fff; padding: 20rpx;
  border-radius: 12rpx; margin-bottom: 20rpx;
}
.search-box {
  display: flex; align-items: center;
  background: #f5f5f5; border-radius: 8rpx;
  padding: 0 20rpx; margin-bottom: 20rpx;
}
.search-input { flex: 1; height: 72rpx; font-size: 28rpx; }
.search-icon { font-size: 32rpx; }

.filter-row { display: flex; gap: 20rpx; align-items: center; }
.filter-item {
  display: flex; align-items: center; gap: 8rpx;
  padding: 12rpx 24rpx; background: #f5f5f5;
  border-radius: 8rpx; font-size: 26rpx;
}
.arrow { font-size: 20rpx; color: #999; }

.profile-list { display: flex; flex-direction: column; gap: 20rpx; }
.profile-card {
  background: #fff; border-radius: 12rpx; padding: 24rpx;
  display: flex; align-items: center;
}
.profile-info { flex: 1; display: flex; flex-direction: column; }
.profile-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.profile-meta { flex: 1; }
.meta-item { font-size: 24rpx; color: #999; margin-right: 16rpx; }
.profile-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12rpx;
}
.profile-stage {
  padding: 4rpx 16rpx; border-radius: 4rpx;
  font-size: 22rpx; color: #fff;
}
.profile-stage.lead { background: #faad14; }
.profile-stage.active { background: #07c160; }
.profile-stage.repeat { background: #1989fa; }
.profile-stage.vip { background: #722ed1; }
.profile-stage.churned { background: #999; }
.profile-stats { display: flex; align-items: center; }

.profile-actions { display: flex; flex-direction: column; gap: 12rpx; }
.action-btn {
  padding: 12rpx 24rpx; border-radius: 8rpx;
  font-size: 24rpx; text-align: center;
}
.action-btn.edit { background: #f5f5f5; color: #1989fa; }
.action-btn.delete { background: #fff0f0; color: #ff4d4f; }
.action-btn.merge { background: #e3f2fd; color: #1989fa; }

.loading, .empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 100rpx 0;
}
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-bottom: 20rpx; }

.pagination {
  display: flex; justify-content: center; align-items: center;
  gap: 40rpx; padding: 40rpx 0;
}
.pagination-btn {
  padding: 16rpx 32rpx; background: #fff;
  border-radius: 8rpx; font-size: 28rpx;
}
.pagination-btn.disabled { color: #999; background: #f5f5f5; }
.pagination-info { font-size: 28rpx; color: #666; }
</style>
