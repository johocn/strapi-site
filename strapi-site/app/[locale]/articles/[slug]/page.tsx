import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  localizedPath,
  alternateLocaleSegments,
} from "@/lib/i18n";
import { getSiteConfig, resolveConfig } from "@/lib/site-config";
import { API_ROOT, SITE_URL } from "@/lib/env";
import Breadcrumb from "@/components/modules/Breadcrumb";

type Localization = {
  locale: string;
  slug: string;
  title?: string;
};

type Article = {
  id: number;
  documentId?: string;
  locale?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  publishedAt?: string;
  localizations?: Localization[];
};

/** 详情页无配置时回退的内置模块列表 */
const DEFAULT_DETAIL_MODULES = ["breadcrumb", "article-body"];

/** 构建期枚举某语言已发布文章 slug（静态导出 generateStaticParams 数据源） */
async function listArticleSlugs(locale: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_ROOT}/articles?locale=${locale}&pageSize=200`);
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data) ? data : data?.results ?? [];
    return results.map((r: any) => r?.slug).filter(Boolean);
  } catch {
    return [];
  }
}

/** 静态导出：仅备选语言（en）预渲染 /en/...；无内容时生成占位路由（页面 notFound()，静态导出要求动态路由至少一页） */
export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const { locale } of alternateLocaleSegments()) {
    const slugs = await listArticleSlugs(locale);
    if (slugs.length === 0) {
      params.push({ locale, slug: "__missing__" });
      continue;
    }
    for (const slug of slugs) params.push({ locale, slug });
  }
  return params;
}

/** 按 locale 请求文章；同一渲染周期内同 URL 的 fetch 会被 React 请求去重 */
async function getArticle(
  slug: string,
  locale: string
): Promise<{ status: number; article: Article | null }> {
  try {
    const res = await fetch(`${API_ROOT}/articles/${slug}?locale=${locale}`);
    if (!res.ok) return { status: res.status, article: null };
    return { status: res.status, article: await res.json() };
  } catch {
    return { status: 500, article: null };
  }
}

/** 站点级 URL（默认语言无前缀，其他语言带 /{locale}/ 前缀） */
function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;

  const current = await getArticle(slug, locale);
  if (current.status === 404 || !current.article) return {};

  const article = current.article;
  // 基于 document 的兄弟翻译生成 alternate（slug 因 localized 可跨语言不同，不能按 slug 探测）
  const languages: Record<string, string> = {};
  languages[article.locale ?? locale] = absoluteUrl(
    localizedPath(locale, `/articles/${article.slug}`)
  );
  for (const loc of article.localizations ?? []) {
    languages[loc.locale] = absoluteUrl(localizedPath(loc.locale, `/articles/${loc.slug}`));
  }
  // x-default 指向默认语言版本（无翻译则回退当前版本）
  const defLoc = (article.localizations ?? []).find((l) => l.locale === DEFAULT_LOCALE);
  const defSlug = defLoc?.slug ?? article.slug;
  languages["x-default"] = absoluteUrl(localizedPath(DEFAULT_LOCALE, `/articles/${defSlug}`));
  return { alternates: { languages } };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale?: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;

  const { status, article } = await getArticle(slug, locale);

  // 静态导出：缺失组合已由 generateStaticParams 排除，此处仅兜底
  if (status === 404 || !article) notFound();

  const bundle = await getSiteConfig(SITE_URL);
  // 三级页面配置 → 模块数组（缺失/空数组回退内置默认）
  const configuredModules = resolveConfig(bundle, ["pages", "detail", "modules"]);
  const modules: string[] =
    Array.isArray(configuredModules) && configuredModules.length > 0
      ? configuredModules
      : DEFAULT_DETAIL_MODULES;

  const homeHref = localizedPath(locale, "/");

  return (
    <main className="article-detail">
      {modules.map((name, i) => {
        if (name === "breadcrumb") {
          return (
            <Breadcrumb
              key={i}
              bundle={bundle}
              locale={locale}
              items={[
                { label: "首页", href: homeHref },
                { label: article.title },
              ]}
            />
          );
        }
        if (name === "article-body") {
          return (
            <article key={i}>
              <h1>{article.title}</h1>
              {article.publishedAt ? (
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString(locale)}
                </time>
              ) : null}
              {article.excerpt ? <p className="article-excerpt">{article.excerpt}</p> : null}
              {article.content ? <div className="article-content">{article.content}</div> : null}
            </article>
          );
        }
        return null;
      })}
    </main>
  );
}
