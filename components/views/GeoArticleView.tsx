import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, UI_STRINGS, localizedPath } from "@/lib/i18n";
import { getSiteConfig } from "@/lib/site-config";
import {
  getGeoArticle,
  getGeoModules,
  resolveGeoRoutePrefix,
  type GeoArticleType,
} from "@/lib/geo-article";
import { buildGeoJsonLd, buildBreadcrumbJsonLd } from "@/lib/geo-seo";
import GeoAnalytics from "@/components/geo/GeoAnalytics";
import Breadcrumb from "@/components/modules/Breadcrumb";
import RiskTip from "@/components/modules/geo/RiskTip";
import GeoHeader from "@/components/modules/geo/GeoHeader";
import GeoBody from "@/components/modules/geo/GeoBody";
import Citation from "@/components/modules/geo/Citation";
import InternalLinks from "@/components/modules/geo/InternalLinks";
import SummaryTips from "@/components/modules/geo/SummaryTips";
import InfoBoundary from "@/components/modules/geo/InfoBoundary";
import ComparisonTable from "@/components/modules/geo/ComparisonTable";
import LocalList from "@/components/modules/geo/LocalList";
import TruthBasis from "@/components/modules/geo/TruthBasis";
import EntityMentions from "@/components/modules/geo/EntityMentions";
import AuthorCard from "@/components/modules/geo/AuthorCard";
import Cta from "@/components/modules/geo/Cta";
import LeadForm from "@/components/modules/geo/LeadForm";
import FloatingService from "@/components/modules/geo/FloatingService";
import GeoFooter from "@/components/modules/geo/GeoFooter";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** 面包屑当前分类名（按文章类型 + locale） */
const CATEGORY_LABELS: Record<GeoArticleType, Record<string, string>> = {
  "geo-article": { "zh-CN": "本地资讯", en: "Local Guide" },
  "geo-faq": { "zh-CN": "本地问答", en: "Local FAQ" },
  "local-report": { "zh-CN": "本地报告", en: "Local Report" },
  "local-comparison": { "zh-CN": "对比评测", en: "Local Comparison" },
  "local-list": { "zh-CN": "本地清单", en: "Local List" },
};

/** 站点级绝对 URL（默认语言无前缀，其他语言带 /{locale}/ 前缀） */
function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/**
 * GEO 文章页共享 generateMetadata：title/description/canonical + hreflang。
 * hreflang 基于当前文档 + 兄弟翻译（localized 文档 slug 可跨语言不同，不能按 slug 探测）。
 */
export async function generateGeoMetadata({
  type,
  slug,
  locale,
}: {
  type: GeoArticleType;
  slug: string;
  locale: string;
}): Promise<Metadata> {
  const { status, article } = await getGeoArticle(slug, locale);
  if (status === 404 || !article) return {};

  const prefix = resolveGeoRoutePrefix(type);
  const languages: Record<string, string> = {};
  // 当前文档版本
  languages[locale] = absoluteUrl(localizedPath(locale, `${prefix}/${article.slug}`));
  // 兄弟翻译版本
  for (const loc of article.localizations ?? []) {
    if (loc?.locale && loc?.slug) {
      languages[loc.locale] = absoluteUrl(localizedPath(loc.locale, `${prefix}/${loc.slug}`));
    }
  }
  // x-default 指向默认语言版本（无翻译则回退当前版本）
  const defLoc = (article.localizations ?? []).find((l) => l.locale === DEFAULT_LOCALE);
  const defSlug = defLoc?.slug ?? article.slug;
  languages["x-default"] = absoluteUrl(localizedPath(DEFAULT_LOCALE, `${prefix}/${defSlug}`));

  const alternates: Metadata["alternates"] = { languages };
  if (article.canonicalUrl) alternates.canonical = article.canonicalUrl;

  // OG/Twitter 共用基础信息
  const ogTitle = article.metaTitle || article.title;
  const ogDescription = article.metaDescription;
  // 当前页绝对 URL：优先 canonicalUrl，否则用本地化路径
  const pageUrl = article.canonicalUrl || absoluteUrl(localizedPath(locale, `${prefix}/${article.slug}`));
  // 作者名：结构化 author 优先，其次 authorName 字段
  const authorName = article.author?.name || article.authorName;
  // 封面图：coverImage.url 已是 /uploads/xxx 相对路径，直接拼站点域
  const ogImages = article.coverImage?.url ? [{ url: `${SITE_URL}${article.coverImage.url}` }] : undefined;

  return {
    title: ogTitle,
    description: ogDescription,
    alternates,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: pageUrl,
      siteName: "joho.cn",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      // 可选字段按 Next Metadata 约定缺失时不输出
      ...(authorName ? { authors: [authorName] } : {}),
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      ...(ogImages ? { images: ogImages } : {}),
    },
    // allowIndex 默认 true（仅显式 false 才禁止收录），noFollow 默认 false
    robots: {
      index: article.allowIndex !== false,
      follow: !article.noFollow,
    },
  };
}

/** GEO 文章页视图（Server Component）：数据获取 + 模块组装 + JSON-LD + 悬浮客服 */
export async function GeoArticleView({
  type,
  slug,
  locale,
}: {
  type: GeoArticleType;
  slug: string;
  locale: string;
}) {
  const { status, article } = await getGeoArticle(slug, locale);
  // 静态导出：缺失组合已由 generateStaticParams 排除，此处仅兜底
  if (!article) notFound();

  const bundle = await getSiteConfig(SITE_URL);
  const modules = getGeoModules(bundle, type);
  const jsonLd = buildGeoJsonLd(article, bundle?.site);
  const customerServiceUrl = (bundle?.site as any)?.customerServiceUrl;
  const homeLabel = UI_STRINGS[locale]?.navHome ?? "首页";
  const prefix = resolveGeoRoutePrefix(type);
  const pageUrl = article.canonicalUrl || absoluteUrl(localizedPath(locale, `${prefix}/${article.slug}`));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { label: homeLabel, href: "/" },
      { label: CATEGORY_LABELS[type][locale] ?? CATEGORY_LABELS[type][DEFAULT_LOCALE] },
    ],
    pageUrl,
  );

  return (
    <main className="geo-page">
      <RiskTip riskType={article.riskType} riskDisclaimer={article.riskDisclaimer} />
      {modules.map((name, i) => {
        switch (name) {
          case "breadcrumb":
            return (
              <Breadcrumb
                key={i}
                bundle={bundle}
                locale={locale}
                items={[
                  { label: homeLabel, href: "/" },
                  { label: CATEGORY_LABELS[type][locale] ?? CATEGORY_LABELS[type][DEFAULT_LOCALE] },
                ]}
              />
            );
          case "article-header": return <GeoHeader key={i} article={article} />;
          case "geo-body": return <GeoBody key={i} article={article} />;
          case "comparison-table": return <ComparisonTable key={i} article={article} />;
          case "local-list": return <LocalList key={i} article={article} />;
          case "citation": return <Citation key={i} article={article} />;
          case "internal-link": return <InternalLinks key={i} article={article} />;
          case "summary-tips": return <SummaryTips key={i} article={article} />;
          case "info-boundary": return <InfoBoundary key={i} article={article} />;
          case "truth-basis": return <TruthBasis key={i} article={article} />;
          case "entity-mentions": return <EntityMentions key={i} article={article} locale={locale} />;
          case "author-card": return <AuthorCard key={i} article={article} />;
          case "cta": return <Cta key={i} article={article} />;
          case "lead-form": return <LeadForm key={i} article={article} />;
          case "geo-footer": return <GeoFooter key={i} site={bundle?.site} bundle={bundle} />;
          default: return null;
        }
      })}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      {customerServiceUrl && <FloatingService customerServiceUrl={customerServiceUrl} article={article} />}
      <GeoAnalytics article={article} />
    </main>
  );
}
