<template>
  <view class="page-container">
    <PageHeader title="自提点管理">
      <view class="header-right">
        <button class="btn-primary" @click="openAdd">+ 新增</button>
      </view>
    </PageHeader>

    <view class="search-section">
      <view class="search-box">
        <input v-model="searchName" class="search-input" placeholder="搜索自提点名称" @confirm="handleSearch" />
        <text class="search-icon">🔍</text>
      </view>
      <view class="filter-row">
        <picker mode="selector" :range="statusLabels" @change="handleStatusChange">
          <view class="filter-item">
            <text>{{ statusLabels[statusIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="location-list">
      <view v-for="item in list" :key="item.id || item.documentId" class="location-card">
        <view class="location-cover" v-if="item.coverImage">
          <image :src="getMediaUrl(item.coverImage)" mode="aspectFill" />
        </view>
        <view class="location-cover placeholder" v-else>
          <text>📍</text>
        </view>
        <view class="location-info">
          <view class="location-header">
            <text class="location-name">{{ item.name }}</text>
            <view class="status-badge" :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</view>
          </view>
          <text class="location-address" v-if="item.address">{{ item.address }}</text>
          <view class="location-meta">
            <text class="meta-item" v-if="item.phone">📞 {{ item.phone }}</text>
            <text class="meta-item" v-if="item.businessHours">🕐 {{ item.businessHours }}</text>
            <text class="meta-item" v-if="item.channels?.length">📍 {{ item.channels.map(c => c.name || c.documentId || c).join(', ') }}</text>
          </view>
        </view>
        <view class="location-actions">
          <view class="action-btn edit" @click="openEdit(item)">编辑</view>
          <view class="action-btn delete" @click="handleDelete(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>

    <view v-if="!loading && list.length === 0" class="empty-state">
      <text class="empty-icon">📍</text>
      <text class="empty-text">暂无自提点</text>
      <button class="btn-primary" @click="openAdd">立即添加</button>
    </view>

    <view class="pagination" v-if="pagination.total > pagination.pageSize">
      <view class="pagination-btn" @click="prevPage" :class="{ disabled: currentPage === 1 }">上一页</view>
      <text class="pagination-info">{{ currentPage }} / {{ totalPages }}</text>
      <view class="pagination-btn" @click="nextPage" :class="{ disabled: currentPage >= totalPages }">下一页</view>
    </view>

    <!-- 新增/编辑弹窗 -->
    <view class="modal-mask" v-if="showModal" @click="closeModal">
      <view class="modal-content large" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEdit ? '编辑自提点' : '新增自提点' }}</text>
          <text class="modal-close" @click="closeModal">✕</text>
        </view>
        <scroll-view scroll-y class="modal-body">
          <!-- 基本信息 -->
          <view class="form-section-title">基本信息</view>
          <view class="form-item">
            <text class="form-label">名称 <text class="required">*</text></text>
            <input type="text" v-model="form.name" placeholder="请输入自提点名称" class="form-input" />
          </view>
          <view class="form-item">
            <text class="form-label">地址</text>
            <input type="text" v-model="form.address" placeholder="请输入详细地址" class="form-input" />
          </view>
          <view class="form-row">
            <view class="form-item half">
              <text class="form-label">纬度</text>
              <input type="digit" v-model="form.latitude" placeholder="如 39.908823" class="form-input" />
            </view>
            <view class="form-item half">
              <text class="form-label">经度</text>
              <input type="digit" v-model="form.longitude" placeholder="如 116.397470" class="form-input" />
            </view>
          </view>
          <view class="form-item">
            <button class="btn-map-pick" @click="openMapPicker" :disabled="!tencentMapKey">📍 地图选点</button>
            <text class="form-hint" v-if="!tencentMapKey">请先在积分配置中设置腾讯地图密钥</text>
          </view>
          <view class="form-item">
            <text class="form-label">联系电话</text>
            <input type="text" v-model="form.phone" placeholder="请输入联系电话" class="form-input" />
          </view>
          <view class="form-item">
            <text class="form-label">营业时间</text>
            <input type="text" v-model="form.businessHours" placeholder="如 周一至周五 9:00-18:00" class="form-input" />
          </view>

          <!-- 媒体 -->
          <view class="form-section-title">图片与证照</view>
          <view class="form-item">
            <text class="form-label">封面图</text>
            <view class="media-select" @click="openMediaPicker('coverImage')">
              <image v-if="form.coverImageUrl" :src="form.coverImageUrl" mode="aspectFill" class="media-preview" />
              <view v-else class="media-placeholder"><text>+ 选择封面</text></view>
              <text v-if="form.coverImageUrl" class="media-remove" @click.stop="removeMedia('coverImage')">✕</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">营业执照</text>
            <view class="media-select" @click="openMediaPicker('businessLicense')">
              <image v-if="form.businessLicenseUrl" :src="form.businessLicenseUrl" mode="aspectFill" class="media-preview" />
              <view v-else class="media-placeholder"><text>+ 选择证照</text></view>
              <text v-if="form.businessLicenseUrl" class="media-remove" @click.stop="removeMedia('businessLicense')">✕</text>
            </view>
          </view>

          <!-- 其他 -->
          <view class="form-section-title">其他设置</view>
          <view class="form-item">
            <text class="form-label">描述</text>
            <textarea v-model="form.description" placeholder="自提点描述信息" class="form-textarea" />
          </view>
          <view class="form-item">
            <text class="form-label">关联渠道</text>
            <view class="channel-checkbox-group">
              <view v-for="ch in channelOptions" :key="ch.documentId || ch.id" class="channel-checkbox-item" @click="toggleChannel(ch.documentId || ch.id)">
                <view :class="['checkbox-icon', { checked: form.channels.includes(ch.documentId || ch.id) }]">
                  <text v-if="form.channels.includes(ch.documentId || ch.id)">✓</text>
                </view>
                <text class="checkbox-label">{{ ch.name }}</text>
              </view>
              <view v-if="channelOptions.length === 0" class="no-channel-tip"><text>暂无渠道，请先创建渠道</text></view>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">状态</text>
            <view class="radio-group">
              <view
                :class="['radio-item', { active: form.status === 'active' }]"
                @click="form.status = 'active'"
              >
                <text>启用</text>
              </view>
              <view
                :class="['radio-item', { active: form.status === 'inactive' }]"
                @click="form.status = 'inactive'"
              >
                <text>停用</text>
              </view>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">排序（越小越靠前）</text>
            <input type="number" v-model="form.sortOrder" placeholder="0" class="form-input" />
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-submit" @click="handleSubmit" :loading="submitting">{{ isEdit ? '保存' : '创建' }}</button>
        </view>
      </view>
    </view>

    <!-- 媒体选择器 -->
    <MediaPicker
      :visible="showMediaPicker"
      :folder="mediaPickerTarget === 'businessLicense' ? '/licenses' : '/images'"
      accept="image/*"
      @select="onMediaSelected"
      @update:visible="showMediaPicker = $event"
    />

    <!-- 地图选点弹窗 -->
    <view class="modal-mask" v-if="showMapPicker" @click="closeMapPicker">
      <view class="modal-content large" @click.stop>
        <view class="modal-header">
          <text class="modal-title">地图选点</text>
          <text class="modal-close" @click="closeMapPicker">✕</text>
        </view>
        <view class="map-container">
          <iframe
            :src="mapPickerUrl"
            frameborder="0"
            style="width:100%;height:100%;border:none;"
            ref="mapIframe"
          ></iframe>
        </view>
        <view class="map-footer">
          <view class="map-coords" v-if="mapPickedLat">
            <text>纬度: {{ mapPickedLat }}  经度: {{ mapPickedLng }}</text>
          </view>
          <view class="map-coords" v-else>
            <text>请在地图上点击选择位置</text>
          </view>
          <view class="map-actions">
            <button class="btn-cancel" @click="closeMapPicker">取消</button>
            <button class="btn-submit" @click="confirmMapPick" :disabled="!mapPickedLat">确认选点</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getPickupLocationList, createPickupLocation, updatePickupLocation, deletePickupLocation, getPointConfig } from '../../src/api/points.js'
import { getAdminChannelList } from '../../src/api/channel.js'
import { getMediaUrl } from '../../src/utils/format.js'
import PageHeader from '../../src/components/PageHeader.vue'
import MediaPicker from '../../src/components/MediaPicker.vue'

const searchName = ref('')
const statusIndex = ref(0)
const statusValues = ['', 'active', 'inactive']
const statusLabels = ['全部状态', '启用', '停用']

const list = ref([])
const pagination = ref({ page: 1, pageSize: 20, total: 0 })
const currentPage = ref(1)
const loading = ref(false)

const showModal = ref(false)
const isEdit = ref(false)
const editId = ref('')
const submitting = ref(false)
const channelOptions = ref([])

async function loadChannels() {
  try {
    const res = await getAdminChannelList({ pageSize: 200 })
    channelOptions.value = (res?.list ?? res?.records ?? []).filter(Boolean)
  } catch { channelOptions.value = [] }
}

function emptyForm() {
  return {
    name: '', address: '', latitude: '', longitude: '',
    phone: '', businessHours: '', description: '',
    channels: [], status: 'active', sortOrder: '0',
    coverImageId: null, coverImageUrl: '',
    businessLicenseId: null, businessLicenseUrl: '',
  }
}
const form = ref(emptyForm())

// 媒体选择器
const showMediaPicker = ref(false)
const mediaPickerTarget = ref('coverImage')

function openMediaPicker(target) {
  mediaPickerTarget.value = target
  showMediaPicker.value = true
}

function onMediaSelected(file) {
  if (mediaPickerTarget.value === 'coverImage') {
    form.value.coverImageId = file.id
    form.value.coverImageUrl = file.url
  } else if (mediaPickerTarget.value === 'businessLicense') {
    form.value.businessLicenseId = file.id
    form.value.businessLicenseUrl = file.url
  }
  showMediaPicker.value = false
}

function removeMedia(target) {
  if (target === 'coverImage') {
    form.value.coverImageId = null
    form.value.coverImageUrl = ''
  } else if (target === 'businessLicense') {
    form.value.businessLicenseId = null
    form.value.businessLicenseUrl = ''
  }
}

const statusMap = {
  active: { text: '启用', cls: 'active' },
  inactive: { text: '停用', cls: 'inactive' },
}
function getStatusText(status) { return statusMap[status]?.text || status || '-' }
function getStatusClass(status) { return statusMap[status]?.cls || 'inactive' }

async function loadData(page = 1) {
  loading.value = true
  try {
    const params = { page, pageSize: pagination.value.pageSize }
    if (searchName.value) params.name = searchName.value
    if (statusIndex.value > 0) params.status = statusValues[statusIndex.value]
    const res = await getPickupLocationList(params)
    list.value = res.list ?? []
    pagination.value = res.pagination ?? { page: 1, pageSize: 20, total: 0 }
    currentPage.value = page
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function handleSearch() { loadData(1) }
function handleStatusChange(e) { statusIndex.value = e.detail.value; loadData(1) }
function prevPage() { if (currentPage.value > 1) loadData(currentPage.value - 1) }
function nextPage() { if (currentPage.value < totalPages.value) loadData(currentPage.value + 1) }
const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.pageSize))

function openAdd() {
  isEdit.value = false; editId.value = ''
  form.value = emptyForm()
  showModal.value = true
}

async function openEdit(item) {
  isEdit.value = true; editId.value = item.documentId || item.id
  form.value = {
    name: item.name || '',
    address: item.address || '',
    latitude: String(item.latitude ?? ''),
    longitude: String(item.longitude ?? ''),
    phone: item.phone || '',
    businessHours: item.businessHours || '',
    description: item.description || '',
    channels: Array.isArray(item.channels) ? item.channels.map(c => c.documentId || c.id || c) : [],
    status: item.status || 'active',
    sortOrder: String(item.sortOrder ?? 0),
    coverImageId: item.coverImage?.id || null,
    coverImageUrl: item.coverImage ? getMediaUrl(item.coverImage) : '',
    businessLicenseId: item.businessLicense?.id || null,
    businessLicenseUrl: item.businessLicense ? getMediaUrl(item.businessLicense) : '',
  }
  showModal.value = true
}

function closeModal() { showModal.value = false }

function toggleChannel(chId) {
  const idx = form.value.channels.indexOf(chId)
  if (idx >= 0) form.value.channels.splice(idx, 1)
  else form.value.channels.push(chId)
}

async function handleSubmit() {
  if (!form.value.name) return uni.showToast({ title: '请输入自提点名称', icon: 'none' })
  submitting.value = true
  try {
    const channelsArr = form.value.channels.filter(Boolean)
    const data = {
      name: form.value.name,
      address: form.value.address || undefined,
      latitude: form.value.latitude ? Number(form.value.latitude) : undefined,
      longitude: form.value.longitude ? Number(form.value.longitude) : undefined,
      phone: form.value.phone || undefined,
      businessHours: form.value.businessHours || undefined,
      description: form.value.description || undefined,
      channels: channelsArr.length > 0 ? channelsArr : undefined,
      status: form.value.status,
      sortOrder: Number(form.value.sortOrder) || 0,
      coverImage: form.value.coverImageId || undefined,
      businessLicense: form.value.businessLicenseId || undefined,
    }
    if (isEdit.value) {
      await updatePickupLocation(editId.value, data)
      uni.showToast({ title: '保存成功', icon: 'success' })
    } else {
      await createPickupLocation(data)
      uni.showToast({ title: '创建成功', icon: 'success' })
    }
    closeModal(); loadData(currentPage.value)
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  } finally { submitting.value = false }
}

async function handleDelete(item) {
  uni.showModal({
    title: '确认删除', content: `确定要删除自提点「${item.name}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await deletePickupLocation(item.documentId || item.id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadData(currentPage.value)
        } catch (e) { uni.showToast({ title: '删除失败', icon: 'none' }) }
      }
    }
  })
}

// 地图选点
const tencentMapKey = ref('')
const showMapPicker = ref(false)
const mapPickedLat = ref('')
const mapPickedLng = ref('')
const mapPickedAddress = ref('')

const mapPickerUrl = computed(() => {
  if (!tencentMapKey.value) return ''
  const center = form.value.latitude && form.value.longitude
    ? `${form.value.latitude},${form.value.longitude}`
    : '39.908823,116.397470'
  return `https://apis.map.qq.com/tools/locpicker?search=1&type=1&key=${tencentMapKey.value}&center=${center}&referer=zhao-point-admin`
})

function openMapPicker() {
  if (!tencentMapKey.value) {
    return uni.showToast({ title: '请先在积分配置中设置腾讯地图密钥', icon: 'none' })
  }
  mapPickedLat.value = ''
  mapPickedLng.value = ''
  mapPickedAddress.value = ''
  showMapPicker.value = true
  // 监听 iframe postMessage
  window.addEventListener('message', onMapMessage)
}

function onMapMessage(event) {
  let loc = event.data
  // 腾讯地图 locpicker 可能返回 JSON 字符串
  if (typeof loc === 'string') {
    try { loc = JSON.parse(loc) } catch { return }
  }
  if (!loc || typeof loc !== 'object') return
  // 兼容多种回调格式
  if (loc.module === 'locPicker' || loc.latlng || loc.location) {
    const lat = loc.latlng?.lat || loc.location?.lat || loc.lat
    const lng = loc.latlng?.lng || loc.location?.lng || loc.lng
    const addr = loc.poiaddress || loc.address || ''
    if (lat && lng) {
      mapPickedLat.value = String(lat)
      mapPickedLng.value = String(lng)
      mapPickedAddress.value = addr
    }
  }
}

function closeMapPicker() {
  showMapPicker.value = false
  window.removeEventListener('message', onMapMessage)
}

function confirmMapPick() {
  if (mapPickedLat.value) {
    form.value.latitude = mapPickedLat.value
    form.value.longitude = mapPickedLng.value
    if (mapPickedAddress.value && !form.value.address) {
      form.value.address = mapPickedAddress.value
    }
  }
  closeMapPicker()
}

async function loadMapKey() {
  try {
    const res = await getPointConfig()
    tencentMapKey.value = res?.tencentMapKey ?? ''
  } catch {}
}

onMounted(() => { loadData(1); loadChannels(); loadMapKey() })
</script>

<style scoped>
page { background: #f5f5f5; }
.page-container { min-height: 100vh; padding: 20rpx; box-sizing: border-box; }

.btn-primary {
  background: #ff0000; color: #fff; padding: 16rpx 32rpx;
  font-size: 30rpx; border-radius: 8rpx; border: none; line-height: 1.2;
}

.search-section { background: #fff; padding: 20rpx; border-radius: 12rpx; margin-bottom: 20rpx; }
.search-box {
  display: flex; align-items: center; background: #f5f5f5;
  border-radius: 8rpx; padding: 0 20rpx; margin-bottom: 20rpx;
}
.search-input { flex: 1; height: 72rpx; font-size: 28rpx; }
.search-icon { font-size: 32rpx; }

.filter-row { display: flex; gap: 20rpx; }
.filter-item {
  display: flex; align-items: center; gap: 8rpx;
  padding: 12rpx 24rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 26rpx;
}
.arrow { font-size: 20rpx; color: #999; }

.location-list { display: flex; flex-direction: column; gap: 16rpx; }

.location-card {
  background: #fff; border-radius: 12rpx; padding: 24rpx;
  display: flex; align-items: center; gap: 20rpx;
}

.location-cover {
  width: 120rpx; height: 120rpx; border-radius: 8rpx; overflow: hidden; flex-shrink: 0;
  background: #f5f5f5;
}
.location-cover image { width: 100%; height: 100%; }
.location-cover.placeholder {
  display: flex; align-items: center; justify-content: center; font-size: 48rpx;
}

.location-info { flex: 1; min-width: 0; }
.location-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 4rpx;
}
.location-name { font-size: 30rpx; font-weight: bold; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; margin-right: 12rpx; }
.location-address { font-size: 24rpx; color: #999; margin-bottom: 4rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.status-badge { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 16rpx; flex-shrink: 0; }
.status-badge.active { background: #e8f5e9; color: #07c160; }
.status-badge.inactive { background: #ffebee; color: #ff4d4f; }

.location-meta { display: flex; gap: 12rpx; flex-wrap: wrap; }
.meta-item { font-size: 22rpx; color: #999; background: #f5f5f5; padding: 2rpx 10rpx; border-radius: 6rpx; }

.location-actions { display: flex; gap: 12rpx; flex-shrink: 0; }
.action-btn { padding: 12rpx 20rpx; border-radius: 8rpx; font-size: 24rpx; text-align: center; }
.action-btn.edit { background: #f5f5f5; color: #1989fa; }
.action-btn.delete { background: #fff0f0; color: #ff4d4f; }

.loading, .empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 100rpx 0;
}
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-bottom: 20rpx; }

.pagination {
  display: flex; justify-content: center; align-items: center;
  gap: 40rpx; padding: 40rpx 0;
}
.pagination-btn { padding: 16rpx 32rpx; background: #fff; border-radius: 8rpx; font-size: 28rpx; }
.pagination-btn.disabled { color: #999; background: #f5f5f5; }
.pagination-info { font-size: 28rpx; color: #666; }

/* 弹窗 */
.modal-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
}
.modal-content {
  width: 90%; max-height: 85vh; background: #fff;
  border-radius: 16rpx; overflow: hidden; display: flex; flex-direction: column;
}
.modal-content.large { width: 95%; max-height: 90vh; }
.modal-header {
  flex-shrink: 0;
  display: flex; justify-content: space-between; align-items: center;
  padding: 30rpx; border-bottom: 1rpx solid #f0f0f0;
}
.modal-title { font-size: 32rpx; font-weight: bold; color: #333; }
.modal-close { font-size: 36rpx; color: #999; padding: 10rpx; }

.modal-body {
  flex: 1;
  min-height: 0;
  padding: 30rpx;
  overflow-y: auto;
}

.form-section-title {
  font-size: 28rpx; font-weight: bold; color: #333;
  margin: 24rpx 0 16rpx; padding-bottom: 8rpx;
  border-bottom: 2rpx solid #667eea;
}
.form-section-title:first-child { margin-top: 0; }

.form-item { margin-bottom: 24rpx; }
.form-label { font-size: 28rpx; color: #333; margin-bottom: 10rpx; display: block; }
.required { color: #ff4d4f; }

.form-input {
  width: 100%; height: 76rpx; background: #f5f5f5; border-radius: 8rpx;
  padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box;
}
.form-textarea {
  width: 100%; min-height: 100rpx; background: #f5f5f5; border-radius: 8rpx;
  padding: 20rpx; font-size: 28rpx; box-sizing: border-box;
}

.form-row { display: flex; gap: 20rpx; }
.form-item.half { flex: 1; }

.radio-group { display: flex; gap: 16rpx; }
.radio-item {
  padding: 14rpx 28rpx; background: #f5f5f5; border-radius: 8rpx;
  font-size: 26rpx; color: #666; border: 2rpx solid transparent;
}
.radio-item.active { background: #f0f4ff; color: #667eea; border-color: #667eea; }

/* 媒体选择 */
.media-select {
  position: relative; width: 200rpx; height: 200rpx;
  border-radius: 8rpx; overflow: hidden; background: #f5f5f5;
}
.media-preview { width: 100%; height: 100%; }
.media-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 26rpx; color: #999; border: 2rpx dashed #ddd; border-radius: 8rpx; box-sizing: border-box;
}
.media-remove {
  position: absolute; top: 4rpx; right: 4rpx; width: 40rpx; height: 40rpx;
  background: rgba(0,0,0,0.5); color: #fff; border-radius: 50%;
  font-size: 24rpx; text-align: center; line-height: 40rpx;
}

.modal-footer {
  flex-shrink: 0;
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

.channel-checkbox-group {
  display: flex; flex-wrap: wrap; gap: 16rpx;
}
.channel-checkbox-item {
  display: flex; align-items: center; gap: 8rpx;
  padding: 10rpx 20rpx; background: #f5f5f5; border-radius: 8rpx;
}
.checkbox-icon {
  width: 36rpx; height: 36rpx; border: 2rpx solid #d9d9d9; border-radius: 6rpx;
  display: flex; align-items: center; justify-content: center; font-size: 22rpx; color: #fff;
}
.checkbox-icon.checked { background: #07c160; border-color: #07c160; }
.checkbox-label { font-size: 26rpx; color: #333; }
.no-channel-tip { font-size: 24rpx; color: #999; padding: 10rpx 0; }

.btn-map-pick {
  background: #f0f4ff; color: #667eea; padding: 16rpx 32rpx;
  font-size: 28rpx; border-radius: 8rpx; border: 2rpx solid #667eea;
  line-height: 1.2; text-align: center;
}
.btn-map-pick[disabled] { background: #f5f5f5; color: #999; border-color: #ddd; }
.form-hint { font-size: 22rpx; color: #999; margin-top: 6rpx; display: block; }

.map-container { width: 100%; height: 600rpx; margin: 0; }
.map-footer { padding: 20rpx 30rpx; border-top: 1rpx solid #f0f0f0; }
.map-coords { font-size: 26rpx; color: #666; margin-bottom: 16rpx; }
.map-actions { display: flex; gap: 20rpx; }
</style>
