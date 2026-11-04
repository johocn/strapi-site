import type { Metadata } from "next";
import { DEFAULT_LOCALE, normalizeLocale, alternateLocaleSegments, localizedPath } from "@/lib/i18n";
import { getSiteConfig, resolveConfig } from "@/lib/site-config";
import { API_ROOT, SITE_URL } from "@/lib/env";
import Hero from "@/components/modules/Hero";
import ArticleFeed from "@/components/modules/ArticleFeed";
import MapBlock from "@/components/modules/MapBlock";
import { SectionHomeView } from "@/components/views/SectionView";
import { listSections, getSection, listSectionHighlights } from "@/lib/section";
import { parseSectionRoute } from "@/lib/section-route";
import type { GeoArticleType } from "@/lib/geo-article";

/** 静态导出：仅备选语言（en）带 /en/ 前缀；默认语言首页由 (default) 路由组在根路径生成
 *  板块首页无前缀（/{板块}）也由本路由承载：首段未命中语言时按板块 slug 解析 */
export async function generateStaticParams() {
  const sections = await listSections(DEFAULT_LOCALE);
  return [...alternateLocaleSegments(), ...sections.map((s) => ({ locale: s.slug }))];
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

  // 板块首页元数据：首段未命中语言时按板块 slug 解析
  const sectionRoute = normalizeLocale(rawLocale) ? null : parseSectionRoute(rawLocale);
  if (sectionRoute) {
    const section = await getSection(sectionRoute.sectionSlug, sectionRoute.locale);
    if (section) {
      return {
        title: section.seoTitle || `${section.name} | joho.cn`,
        description: section.seoDescription || section.description || undefined,
        alternates: { canonical: `${SITE_URL}/${section.slug}` },
      };
    }
  }

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

  // 板块首页：首段未命中语言 → 当作板块 slug；查不到板块时回退站点首页
  const sectionRoute = normalizeLocale(rawLocale) ? null : parseSectionRoute(rawLocale);
  if (sectionRoute) {
    const section = await getSection(sectionRoute.sectionSlug, sectionRoute.locale);
    if (section) {
      const highlights = await listSectionHighlights(section.slug, sectionRoute.locale);
      return (
        <SectionHomeView
          section={section}
          locale={sectionRoute.locale}
          highlights={highlights}
        />
      );
    }
  }

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

  return (
    <main className="home">
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
