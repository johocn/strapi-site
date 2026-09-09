import { resolveConfig } from "@/lib/site-config";
import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n";
import { API_ROOT } from "@/lib/env";

export type GeoArticleType = "geo-article" | "geo-faq" | "local-report" | "local-comparison" | "local-list";

export type RiskType =
  | "none" | "finance-general" | "finance-stock" | "finance-fund" | "finance-bond"
  | "finance-wealth" | "finance-futures" | "finance-precious-metals" | "finance-forex"
  | "finance-trust" | "finance-convertible-bond" | "finance-hk-us-stock" | "finance-index"
  | "finance-insurance" | "finance-otc" | "finance-reverse-repo" | "finance-cd"
  | "health" | "legal" | "other";

export type GeoArticle = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: string;
  type: GeoArticleType;
  faqQuestion?: string;
  publishedAt?: string;
  updatedAt?: string;
  articleNo?: string;
  authorName?: string;
  authorBio?: string;
  reviewerName?: string;
  reviewedAt?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourcePublishedAt?: string;
  serviceScope?: string;
  businessData?: { period?: string; content?: string; caliber?: string }[];
  caseContent?: string;
  internalLinks?: { text?: string; url?: string }[];
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  jsonLdType?: "Article" | "FAQPage" | "LocalBusiness" | "ItemList";
  author?: {
    id: number;
    name: string;
    position?: string;
    bio?: string;
    avatar?: { url?: string };
    experienceYears?: number;
  };
  truthBasis?: {
    id: number;
    claim: string;
    claimKey?: string;
    claimCategory?: string;
    canonicalValue?: string;
    canonicalSourceUrl?: string;
    canonicalSourceType?: string;
    verificationStatus?: string;
    lastVerifiedAt?: string;
  }[];
  truthBasisSections?: { claimKey?: string; section?: string }[];
  mentionedEntities?: {
    id: number;
    name: string;
    slug: string;
    entityType?: string;
  }[];
  comparisonData?: { dimension?: string; items?: { name?: string; score?: string | number; note?: string }[] }[];
  listItems?: { name?: string; desc?: string; price?: string; link?: string }[];
  coverImage?: any;
  riskType?: RiskType;
  riskDisclaimer?: string;
  ctaType?: "none" | "download-list" | "consult-appointment";
  leadFormEnabled?: boolean;
  vendureProductListId?: string;
  readPoints?: number;
  miniProgramPath?: string;
  summaryPoints?: string;
  localTips?: string;
  infoBoundary?: string;
  localizations?: { id: number; locale: string; slug: string; title: string }[];
};

export async function getGeoArticle(slug: string, locale: string): Promise<{ status: number; article: GeoArticle | null }> {
  try {
    const res = await fetch(`${API_ROOT}/geo-articles/${encodeURIComponent(slug)}?locale=${locale}`);
    if (!res.ok) return { status: res.status, article: null };
    return { status: res.status, article: await res.json() };
  } catch {
    return { status: 500, article: null };
  }
}

/** 构建期枚举某类型已发布文章的 slug（静态导出 generateStaticParams 数据源） */
export async function listGeoArticleSlugs(type: GeoArticleType, locale: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${API_ROOT}/geo-articles?locale=${locale}&type=${type}&pageSize=200`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data) ? data : data?.results ?? [];
    return results.map((r: any) => r?.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export const DEFAULT_GEO_MODULES = [
  "risk-tip", "breadcrumb", "article-header", "geo-body", "comparison-table", "local-list",
  "citation", "internal-link", "summary-tips", "info-boundary", "truth-basis", "entity-mentions",
  "author-card", "cta", "lead-form", "geo-footer",
];

export function getGeoModules(bundle: any, type: GeoArticleType): string[] {
  const key =
    type === "geo-faq" ? "geoFaq" :
    type === "local-report" ? "localReport" :
    type === "local-comparison" ? "localComparison" :
    type === "local-list" ? "localList" : "geoArticle";
  const configured = resolveConfig(bundle, ["pages", key, "modules"]);
  if (Array.isArray(configured) && configured.length > 0) return configured;
  const detail = resolveConfig(bundle, ["pages", "detail", "modules"]);
  if (Array.isArray(detail) && detail.length > 0) return detail;
  return DEFAULT_GEO_MODULES;
}

export function resolveGeoRoutePrefix(type: GeoArticleType): string {
  return type === "geo-faq" ? "/geo-faq" :
    type === "local-report" ? "/local-report" :
    type === "local-comparison" ? "/local-comparison" :
    type === "local-list" ? "/local-list" : "/geo-article";
}
