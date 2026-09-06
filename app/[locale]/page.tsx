import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n";
import { getSiteConfig, resolveConfig } from "@/lib/site-config";
import Hero from "@/components/modules/Hero";
import ArticleFeed from "@/components/modules/ArticleFeed";
import MapBlock from "@/components/modules/MapBlock";

export const dynamic = "force-dynamic";

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
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/zhao-website/v1";
// 服务端组件 fetch 必须用绝对 URL（相对路径由代理在 :3000 层解析）
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const API_ROOT = `${SITE_URL}${API_BASE}`;

/** 首页无配置时回退的内置模块列表（一级兜底，硬编码于前端） */
const DEFAULT_HOME_MODULES = ["hero", "article-feed"];

async function getSiteInfo(): Promise<SiteInfo | null> {
  try {
    const res = await fetch(`${API_ROOT}/site-info`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getFeaturedArticles(locale: string): Promise<Article[]> {
  try {
    const res = await fetch(`${API_ROOT}/articles/featured?locale=${locale}`, {
      cache: "no-store",
    });
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
    const res = await fetch(`${API_ROOT}/seo-meta`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
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
