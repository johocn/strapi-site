import type { Metadata } from "next";
import { DEFAULT_LOCALE, normalizeLocale, alternateLocaleSegments, localizedPath } from "@/lib/i18n";
import { getSiteConfig, resolveConfig } from "@/lib/site-config";
import { API_ROOT, SITE_URL } from "@/lib/env";
import Hero from "@/components/modules/Hero";
import ArticleFeed from "@/components/modules/ArticleFeed";
import MapBlock from "@/components/modules/MapBlock";
import type { GeoArticleType } from "@/lib/geo-article";

/** 静态导出：仅备选语言（en）带 /en/ 前缀；默认语言由 (default) 路由组在根路径生成 */
export async function generateStaticParams() {
  return alternateLocaleSegments();
}

type SiteInfo = {
  siteName: string;
  siteDescription: string;
  domain: string;
};

type Article = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  type?: GeoArticleType;
};

/** 首页无配置时回退的内置模块列表（一级兜底，硬编码于前端） */
const DEFAULT_HOME_MODULES = ["hero", "article-feed"];

async function getSiteInfo(): Promise<SiteInfo | null> {
  try {
    const res = await fetch(`${API_ROOT}/site-info`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** 首页精选数据源：GEO 文章（geo_articles 表，按发布时间倒序取最新） */
async function getFeaturedArticles(locale: string): Promise<Article[]> {
  try {
    const res = await fetch(`${API_ROOT}/geo-articles/featured?locale=${locale}&limit=5`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.results ?? [];
  } catch {
    return [];
  }
}

/** 地图模块数据源：seo-meta（geo 四标签，geoPosition 落在 geo["geo.position"]） */
async function getSeoMeta(): Promise<any> {
  try {
    const res = await fetch(`${API_ROOT}/seo-meta`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** 首页元数据：站点名/描述 + canonical（站点级 Organization/WebSite JSON-LD 在页面内渲染） */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;
  const site = await getSiteInfo();
  return {
    title: site?.siteName || "joho.cn",
    description: site?.siteDescription || undefined,
    alternates: { canonical: `${SITE_URL}${localizedPath(locale, "/")}` },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;

  const bundle = await getSiteConfig(SITE_URL);
  const [site, articles] = await Promise.all([
    getSiteInfo(),
    getFeaturedArticles(locale),
  ]);

  // 三级页面配置 → 模块数组（缺失/空数组回退内置默认）
  const configuredModules = resolveConfig(bundle, ["pages", "home", "modules"]);
  const modules: string[] =
    Array.isArray(configuredModules) && configuredModules.length > 0
      ? configuredModules
      : DEFAULT_HOME_MODULES;

  // 仅当地图模块在列时才拉取 seo-meta（避免无谓请求）
  const seoMeta = modules.includes("map") ? await getSeoMeta() : null;

  // 站点级结构化数据：Organization + WebSite（供文章 JSON-LD 的 publisher 与搜索引擎引用）
  const siteName = site?.siteName || "joho.cn";
  const siteJsonLd = [
    { "@context": "https://schema.org", "@type": "Organization", name: siteName, url: SITE_URL },
    { "@context": "https://schema.org", "@type": "WebSite", name: siteName, url: SITE_URL },
  ];

  return (
    <main className="home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />
      {modules.map((name, i) => {
        switch (name) {
          case "hero":
            return (
              <Hero
                key={i}
                bundle={bundle}
                siteName={site?.siteName}
                siteDescription={site?.siteDescription}
              />
            );
          case "article-feed":
            return (
              <ArticleFeed key={i} bundle={bundle} locale={locale} articles={articles} />
            );
          case "map":
            return (
              <MapBlock
                key={i}
                bundle={bundle}
                geoPosition={seoMeta?.geo?.["geo.position"]}
                geoPlacename={seoMeta?.geo?.["geo.placename"]}
              />
            );
          default:
            return null;
        }
      })}
    </main>
  );
}
