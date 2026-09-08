import { API_ORIGIN } from "@/lib/env";

/**
 * 活动数据层（zhao-point / zhao-tag 插件，公开接口，无需登录）。
 * 注意：两个接口前缀与 geo-article 的 zhao-website/v1 不同，不能复用 API_ROOT。
 * 活动不启用 i18n（localized:false），fetch 不需要也不传 locale。
 */
const ACTIVITY_API_ROOT = `${API_ORIGIN}/api/zhao-point/v1`;
const TAG_API_ROOT = `${API_ORIGIN}/api/zhao-tag/v1`;

export type ActivityTag = { documentId?: string; name?: string };
export type ActivityLecturer = { name?: string; position?: string };
export type ActivityVenue = { name?: string };

export type ActivityOverrideItem = {
  documentId?: string;
  title?: string;
  summary?: string;
  url?: string;
};

/** 活动 schema 字段子集（全部可选，构建/运行期按需兜底） */
export type ActivityCard = {
  documentId?: string;
  title?: string;
  type?: string;
  category?: string;
  tags?: ActivityTag[];
  assets?: unknown[];
  description?: string;
  startTime?: string;
  endTime?: string;
  venueName?: string;
  lat?: number | null;
  lng?: number | null;
  capacity?: number | null;
  usedCapacity?: number | null;
  status?: string;
  pricingMode?: string;
  feeTiers?: unknown[];
  feeFactors?: unknown[];
  promoTemplate?: string;
  promoModules?: unknown;
  promoContact?: string;
  promoColors?: unknown;
  promoAssets?: { cover?: { url?: string } };
  customPromoHtml?: string;
  customPromoActive?: boolean;
  lecturer?: ActivityLecturer | ActivityLecturer[] | null;
  venue?: ActivityVenue | null;
  slug?: string;
  relatedOverride?: {
    articles?: ActivityOverrideItem[];
    cases?: ActivityOverrideItem[];
    products?: ActivityOverrideItem[];
    faqs?: ActivityOverrideItem[];
    courses?: ActivityOverrideItem[];
    lessons?: ActivityOverrideItem[];
    tutorials?: ActivityOverrideItem[];
    activities?: ActivityOverrideItem[];
  };
  showRelatedSection?: boolean;
};

/** 标签聚合结果：key 为内容类型（article/geoArticle/case/product/faq/tutorial/course/lesson/activity） */
export type RelatedGroup = Record<
  string,
  { type?: string; documentId?: string; title?: string; summary?: string; url?: string }[]
>;

/** 活动详情：res.json() 后取 .data（data 是对象）；失败返回 {status:500, activity:null} */
export async function getActivity(
  documentId: string
): Promise<{ status: number; activity: ActivityCard | null }> {
  try {
    const res = await fetch(`${ACTIVITY_API_ROOT}/activities/${encodeURIComponent(documentId)}`);
    if (!res.ok) return { status: res.status, activity: null };
    const body = await res.json();
    return { status: res.status, activity: body?.data ?? null };
  } catch {
    return { status: 500, activity: null };
  }
}

/** 构建期枚举全部活动 documentId（静态导出 generateStaticParams 数据源） */
export async function listActivityDocumentIds(): Promise<string[]> {
  try {
    const res = await fetch(`${ACTIVITY_API_ROOT}/activities?pageSize=200`);
    if (!res.ok) return [];
    const body = await res.json();
    const data = body?.data ?? [];
    return data.map((r: any) => r?.documentId).filter(Boolean);
  } catch {
    return [];
  }
}

/** 列表页数据源：过滤 draft/archived 状态 */
export async function listActivities(): Promise<ActivityCard[]> {
  try {
    const res = await fetch(`${ACTIVITY_API_ROOT}/activities?pageSize=100`);
    if (!res.ok) return [];
    const body = await res.json();
    const data = body?.data ?? [];
    return data.filter((r: any) => r?.status !== "draft" && r?.status !== "archived");
  } catch {
    return [];
  }
}

/** 标签联动聚合：空标签直接返回 {}；响应取 body?.data（形如 { article:[...], geoArticle:[...], ... }） */
export async function getRelatedByTags(tagIds: string[]): Promise<RelatedGroup> {
  if (tagIds.length === 0) return {};
  try {
    const res = await fetch(`${TAG_API_ROOT}/related-by-tags?tags=${tagIds.join(",")}&limit=3`);
    if (!res.ok) return {};
    const body = await res.json();
    return body?.data ?? {};
  } catch {
    return {};
  }
}

/** 活动时间展示：ISO 时间 → 北京时间 YYYY-MM-DD HH:mm（无值返回"待定"） */
export function formatActivityTime(iso?: string): string {
  if (!iso) return "待定";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}
