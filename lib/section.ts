import { API_ROOT } from "@/lib/env";

/**
 * 业务板块前台数据层（公开接口）。
 *
 * 数据源：
 * - GET /sections?locale=           板块列表（仅上线、按 order 升序）
 * - GET /sections/{slug}?locale=    板块详情（含六类已发布内容计数）
 * - GET /geo-articles|/articles|/tutorials|/products?section=  板块内内容
 */

export type SectionKind = "guides" | "blog" | "courses" | "products";

export type SectionThemeConfig = {
  mode?: "inherit" | "custom";
  theme?: string;
};

export type Section = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  themeConfig?: SectionThemeConfig;
  icon?: { url?: string } | null;
  cover?: { url?: string } | null;
  order?: number;
  /** 六类已发布内容计数，键为模型名：article / geo-article / tutorial / faq / product / download */
  counts?: Record<string, number>;
};

export type SectionItem = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  coverImage?: any;
};

export const SECTION_KINDS: SectionKind[] = ["guides", "blog", "courses", "products"];

export const SECTION_KIND_META: Record<
  SectionKind,
  { endpoint: string; countKey: string; zh: string; en: string }
> = {
  guides: { endpoint: "/geo-articles", countKey: "geo-article", zh: "攻略指南", en: "Guides" },
  blog: { endpoint: "/articles", countKey: "article", zh: "资讯文章", en: "Blog" },
  courses: { endpoint: "/tutorials", countKey: "tutorial", zh: "课程教程", en: "Courses" },
  products: { endpoint: "/products", countKey: "product", zh: "产品服务", en: "Products" },
};

/** 已存在的前台详情路由前缀；未列出的类型暂只展示标题，避免指向不存在的页面 */
const DETAIL_ROUTE: Partial<Record<SectionKind, string>> = {
  guides: "/geo-article",
  blog: "/articles",
};

export function isSectionKind(value: string | undefined): value is SectionKind {
  return !!value && (SECTION_KINDS as string[]).includes(value);
}

export function sectionKindLabel(kind: SectionKind, locale: string): string {
  const meta = SECTION_KIND_META[kind];
  return locale === "en" ? meta.en : meta.zh;
}

export function sectionCount(section: Section, kind: SectionKind): number {
  return Number(section.counts?.[SECTION_KIND_META[kind].countKey] ?? 0);
}

/** 板块内内容的详情链接（无对应详情页时返回 null） */
export function sectionItemPath(locale: string, slug: string, kind: SectionKind): string | null {
  const prefix = DETAIL_ROUTE[kind];
  if (!prefix) return null;
  const base = `${prefix}/${encodeURIComponent(slug)}`;
  return locale === "en" ? `/en${base}` : base;
}

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function normalizeItem(raw: any): SectionItem | null {
  const slug = String(raw?.slug ?? "").trim();
  if (!slug) return null;
  return {
    id: Number(raw?.id ?? 0),
    documentId: raw?.documentId,
    title: String(raw?.title ?? raw?.name ?? raw?.question ?? slug),
    slug,
    excerpt: raw?.excerpt ?? raw?.summary ?? undefined,
    publishedAt: raw?.publishedAt,
    coverImage: raw?.coverImage,
  };
}

export async function listSections(locale: string): Promise<Section[]> {
  const data = await getJson(`${API_ROOT}/sections?locale=${encodeURIComponent(locale)}`);
  const list = Array.isArray(data) ? data : data?.results ?? [];
  return list.filter((s: any) => s?.slug);
}

export async function getSection(slug: string, locale: string): Promise<Section | null> {
  if (!slug) return null;
  const data = await getJson(
    `${API_ROOT}/sections/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`
  );
  if (!data || !data.slug) return null;
  return data as Section;
}

export async function listSectionContent(
  kind: SectionKind,
  sectionSlug: string,
  locale: string,
  pageSize = 60
): Promise<SectionItem[]> {
  const { endpoint } = SECTION_KIND_META[kind];
  const data = await getJson(
    `${API_ROOT}${endpoint}?section=${encodeURIComponent(sectionSlug)}&locale=${encodeURIComponent(locale)}&pageSize=${pageSize}`
  );
  const list = Array.isArray(data) ? data : data?.results ?? [];
  return list.map(normalizeItem).filter(Boolean) as SectionItem[];
}

/** 板块首页聚合：各类型取前 N 条 */
export async function listSectionHighlights(
  sectionSlug: string,
  locale: string,
  limit = 6
): Promise<{ kind: SectionKind; items: SectionItem[] }[]> {
  const results = await Promise.all(
    SECTION_KINDS.map(async (kind) => ({
      kind,
      items: await listSectionContent(kind, sectionSlug, locale, limit),
    }))
  );
  return results;
}
