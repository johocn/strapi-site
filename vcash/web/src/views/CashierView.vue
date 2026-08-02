<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { gql } from '@apollo/client/core';
import { apolloClient } from '@/api/client';
import { useSessionStore } from '@/stores/session';
import { useCartStore } from '@/stores/cart';
import { useOfflineStore } from '@/stores/offline';
import { useScanner } from '@/composables/useScanner';
import { db, type ProductSnapshot } from '@/db/dexie';
import ProductGrid, { type ProductCard } from '@/components/ProductGrid.vue';
import CategoryBar, { type Category } from '@/components/CategoryBar.vue';
import CartPanel from '@/components/CartPanel.vue';

const PRODUCTS_QUERY = gql`
  query Products($term: String, $take: Int, $skip: Int) {
    products(
      options: { filter: { name: { contains: $term } }, take: $take, skip: $skip }
    ) {
      items {
        id
        name
        slug
        variants {
          id
          sku
          name
          price
          priceWithTax
        }
        featuredAsset {
          preview
        }
      }
      totalItems
    }
  }
`;

const COLLECTIONS_QUERY = gql`
  query Collections {
    collections {
      items {
        id
        name
        slug
        featuredAsset {
          preview
        }
      }
    }
  }
`;

const COLLECTION_PRODUCTS_QUERY = gql`
  query CollectionProducts($collectionId: ID!, $take: Int, $skip: Int) {
    collection(id: $collectionId) {
      id
      name
      productVariants(options: { take: $take, skip: $skip }) {
        items {
          id
          sku
          name
          price
          priceWithTax
          product {
            id
            name
            featuredAsset {
              preview
            }
          }
        }
        totalItems
      }
    }
  }
`;

const PRODUCT_VARIANT_BY_SKU = gql`
  query ProductVariantBySku($sku: String!) {
    productVariants(options: { filter: { sku: { eq: $sku } } }) {
      items {
        id
        sku
        name
        price
        priceWithTax
        product {
          id
          name
        }
      }
    }
  }
`;

interface RawProduct {
  id: string;
  name: string;
  variants: Array<{ id: string; sku: string; name: string; price: number; priceWithTax: number }>;
  featuredAsset?: { preview?: string | null } | null;
}

interface RawVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  priceWithTax: number;
  product: { id: string; name: string; featuredAsset?: { preview?: string | null } | null };
}

const router = useRouter();
const sessionStore = useSessionStore();
const cart = useCartStore();
const offlineStore = useOfflineStore();

// 顶部班次信息
const session = computed(() => sessionStore.currentSession);
const isOnline = computed(() => offlineStore.isOnline);

// 商品列表状态
const PAGE_SIZE = 20;
const items = ref<ProductCard[]>([]);
const totalItems = ref(0);
const loading = ref(false);
const selectedCategory = ref('');
const categories = ref<Category[]>([]);
const searchTerm = ref('');
const debouncedTerm = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let searchSeq = 0;

const hasMore = computed(() => items.value.length < totalItems.value);

function mapProduct(p: RawProduct): ProductCard | null {
  if (!p.variants || p.variants.length === 0) return null;
  const v = p.variants[0];
  return {
    productId: p.id,
    variantId: v.id,
    name: v.name || p.name,
    sku: v.sku || '',
    price: v.price,
    priceWithTax: v.priceWithTax,
    preview: p.featuredAsset?.preview ?? null,
  };
}

function mapVariant(v: RawVariant): ProductCard {
  return {
    productId: v.product.id,
    variantId: v.id,
    name: v.name || v.product.name,
    sku: v.sku || '',
    price: v.price,
    priceWithTax: v.priceWithTax,
    preview: v.product.featuredAsset?.preview ?? null,
  };
}

function mapSnapshot(s: ProductSnapshot): ProductCard {
  return {
    productId: String(s.variantId),
    variantId: String(s.variantId),
    name: s.name,
    sku: s.sku,
    price: s.price,
    priceWithTax: s.priceWithTax,
    preview: null,
  };
}

/** 离线加载商品：从 IndexedDB 按 name 前缀或全量分页查询 */
async function loadProductsOffline(reset: boolean) {
  if (reset) {
    items.value = [];
    totalItems.value = 0;
  }
  loading.value = true;
  const mySeq = ++searchSeq;
  try {
    const term = debouncedTerm.value.trim();
    let collection: import('dexie').Collection<ProductSnapshot, number>;
    if (term) {
      collection = db.products.where('name').startsWithIgnoreCase(term);
    } else {
      collection = db.products.orderBy('updatedAt').reverse();
    }
    const page = await collection
      .offset(items.value.length)
      .limit(PAGE_SIZE)
      .toArray();
    if (mySeq !== searchSeq) return;
    const mapped = page.map(mapSnapshot);
    items.value = reset ? mapped : [...items.value, ...mapped];
    // 离线无精确 totalItems，按已加载量估算以允许 load-more
    if (page.length === PAGE_SIZE) {
      totalItems.value = items.value.length + 1;
    } else {
      totalItems.value = items.value.length;
    }
    if (reset && mapped.length === 0) {
      ElMessage.info('离线商品缓存为空，请联网同步后重试');
    }
  } catch (e) {
    if (mySeq !== searchSeq) return;
    ElMessage.error('离线加载商品失败：' + (e instanceof Error ? e.message : ''));
  } finally {
    if (mySeq === searchSeq) loading.value = false;
  }
}

async function loadProducts(reset: boolean) {
  if (!isOnline.value) {
    await loadProductsOffline(reset);
    return;
  }
  if (reset) {
    items.value = [];
    totalItems.value = 0;
  }
  loading.value = true;
  const mySeq = ++searchSeq;
  try {
    if (selectedCategory.value === '') {
      const { data, errors } = await apolloClient.query({
        query: PRODUCTS_QUERY,
        variables: {
          term: debouncedTerm.value || null,
          take: PAGE_SIZE,
          skip: items.value.length,
        },
        fetchPolicy: 'network-only',
      });
      if (mySeq !== searchSeq) return;
      if (errors?.length && !data) throw new Error(errors[0].message);
      const list = (data?.products?.items ?? []) as RawProduct[];
      const mapped = list.map(mapProduct).filter((c): c is ProductCard => c !== null);
      items.value = reset ? mapped : [...items.value, ...mapped];
      totalItems.value = data?.products?.totalItems ?? 0;
    } else {
      const { data, errors } = await apolloClient.query({
        query: COLLECTION_PRODUCTS_QUERY,
        variables: {
          collectionId: selectedCategory.value,
          take: PAGE_SIZE,
          skip: items.value.length,
        },
        fetchPolicy: 'network-only',
      });
      if (mySeq !== searchSeq) return;
      if (errors?.length && !data) throw new Error(errors[0].message);
      const variants = (data?.collection?.productVariants?.items ?? []) as RawVariant[];
      const mapped = variants.map(mapVariant);
      items.value = reset ? mapped : [...items.value, ...mapped];
      totalItems.value = data?.collection?.productVariants?.totalItems ?? 0;
    }
  } catch (e) {
    if (mySeq !== searchSeq) return;
    ElMessage.error('加载商品失败：' + (e instanceof Error ? e.message : ''));
  } finally {
    if (mySeq === searchSeq) loading.value = false;
  }
}

async function loadCollections() {
  if (!isOnline.value) return;
  try {
    const { data } = await apolloClient.query({
      query: COLLECTIONS_QUERY,
      fetchPolicy: 'network-only',
    });
    categories.value = (data?.collections?.items ?? []) as Category[];
  } catch {
    // 分类加载失败不阻断主流程
  }
}

function handleSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedTerm.value = searchTerm.value.trim();
    // 切回"全部"分类时才用搜索词（分类模式下不支持搜索）
    if (selectedCategory.value !== '') {
      selectedCategory.value = '';
    } else {
      loadProducts(true);
    }
  }, 300);
}

watch(selectedCategory, () => {
  // 切分类时清空搜索词
  searchTerm.value = '';
  debouncedTerm.value = '';
  loadProducts(true);
});

// 网络状态切换：重新加载商品列表
watch(isOnline, () => {
  loadProducts(true);
});

function handleSelect(card: ProductCard) {
  if (!isOnline.value) {
    ElMessage.warning('离线模式暂不支持加购，请联网后操作');
    return;
  }
  cart.addItem(card.variantId, 1).catch((e) => {
    ElMessage.error('加购失败：' + (e instanceof Error ? e.message : ''));
  });
}

function handleLoadMore() {
  loadProducts(false);
}

/** 离线扫码：按 barcode 或 sku 在 IndexedDB 查商品 */
async function findProductOffline(barcode: string): Promise<ProductSnapshot | null> {
  try {
    const byBarcode = await db.products.where('barcode').equals(barcode).first();
    if (byBarcode) return byBarcode;
    const bySku = await db.products.where('sku').equals(barcode).first();
    return bySku ?? null;
  } catch {
    return null;
  }
}

// 扫码枪：扫码后查 SKU → 加购
useScanner({
  onScan: async (barcode: string) => {
    if (!isOnline.value) {
      try {
        const snap = await findProductOffline(barcode);
        if (!snap) {
          ElMessage.warning(`离线未找到条码对应的商品：${barcode}`);
          return;
        }
        ElMessage.info(`离线找到：${snap.name}（联网后可加购）`);
      } catch (e) {
        ElMessage.error('离线扫码查询失败：' + (e instanceof Error ? e.message : ''));
      }
      return;
    }
    try {
      const { data, errors } = await apolloClient.query({
        query: PRODUCT_VARIANT_BY_SKU,
        variables: { sku: barcode },
        fetchPolicy: 'network-only',
      });
      if (errors?.length && !data) throw new Error(errors[0].message);
      const variants = (data?.productVariants?.items ?? []) as RawVariant[];
      if (variants.length === 0) {
        ElMessage.warning(`未找到条码对应的商品：${barcode}`);
        return;
      }
      const v = variants[0];
      await cart.addItem(v.id, 1);
      ElMessage.success(`已加入：${v.name}`);
    } catch (e) {
      ElMessage.error('扫码加购失败：' + (e instanceof Error ? e.message : ''));
    }
  },
});

// F1 跳结账页
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'F1') {
    e.preventDefault();
    if (!cart.isEmpty) router.push('/checkout');
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown);
  // 1. 加载已有活跃订单到购物车（离线时跳过）
  if (isOnline.value) {
    await cart.loadActiveOrder().catch(() => {
      // 加载失败不阻断，可在 CartPanel 内重试
    });
  }
  // 2. 加载分类 + 商品列表
  await Promise.all([loadCollections(), loadProducts(true)]);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<template>
  <div class="cashier-view">
    <!-- 顶部：班次信息 -->
    <header class="top-bar">
      <div class="session-info">
        <span class="label">班次</span>
        <span class="value">{{ session?.code || '-' }}</span>
        <el-divider direction="vertical" />
        <span class="label">终端</span>
        <span class="value">{{ session?.terminal?.code || '-' }}</span>
        <span class="terminal-name" v-if="session?.terminal?.name">
          ({{ session.terminal.name }})
        </span>
        <el-divider direction="vertical" />
        <span class="label">开班时间</span>
        <span class="value">
          {{ session?.openedAt ? new Date(session.openedAt).toLocaleString('zh-CN') : '-' }}
        </span>
        <el-divider direction="vertical" />
        <span class="net-badge" :class="isOnline ? 'online' : 'offline'">
          {{ isOnline ? '● 在线' : '● 离线' }}
        </span>
      </div>
      <div class="actions">
        <el-tooltip content="F1 快捷键" placement="bottom">
          <el-button size="small" @click="router.push('/checkout')" :disabled="cart.isEmpty">
            结账
          </el-button>
        </el-tooltip>
        <el-button size="small" @click="router.push('/shift')">班次</el-button>
      </div>
    </header>

    <!-- 主体：左商品 / 右购物车 -->
    <div class="main">
      <section class="left-pane">
        <div class="search-bar">
          <el-input
            v-model="searchTerm"
            :placeholder="isOnline ? '搜索商品名称（仅在「全部」分类下生效）' : '离线搜索本地商品缓存'"
            clearable
            @input="handleSearchInput"
            @clear="handleSearchInput"
          >
            <template #prefix>
              <span class="search-icon">🔍</span>
            </template>
          </el-input>
        </div>
        <CategoryBar
          v-model="selectedCategory"
          :categories="categories"
        />
        <div class="grid-area">
          <ProductGrid
            :items="items"
            :loading="loading"
            :has-more="hasMore"
            @select="handleSelect"
            @load-more="handleLoadMore"
          />
        </div>
      </section>
      <aside class="right-pane">
        <CartPanel />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.cashier-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
  overflow: hidden;
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}
.session-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}
.session-info .label {
  color: #909399;
}
.session-info .value {
  color: #303133;
  font-weight: 500;
}
.terminal-name {
  color: #909399;
}
.net-badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 500;
}
.net-badge.online {
  color: #67c23a;
  background: #f0f9eb;
}
.net-badge.offline {
  color: #f56c6c;
  background: #fef0f0;
}
.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.left-pane {
  display: flex;
  flex-direction: column;
  width: 70%;
  min-width: 0;
}
.search-bar {
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}
.search-icon {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
}
.grid-area {
  flex: 1;
  overflow: hidden;
}
.right-pane {
  width: 30%;
  min-width: 320px;
  max-width: 420px;
}
</style>
