import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  normalizeLocale,
  localizedPath,
} from "@/lib/i18n";
import { getSiteConfig, resolveConfig } from "@/lib/site-config";
import Breadcrumb from "@/components/modules/Breadcrumb";

export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/zhao-website/v1";
// 服务端组件 fetch 必须用绝对 URL（相对路径由代理在 :3000 层解析）
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const API_ROOT = `${SITE_URL}${API_BASE}`;

type Article = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  publishedAt?: string;
};

/** 详情页无配置时回退的内置模块列表 */
const DEFAULT_DETAIL_MODULES = ["breadcrumb", "article-body"];

/** 按 locale 请求文章；同一渲染周期内同 URL 的 fetch 会被 React 请求去重 */
async function getArticle(
  slug: string,
  locale: string
): Promise<{ status: number; article: Article | null }> {
  try {
    const res = await fetch(`${API_ROOT}/articles/${slug}?locale=${locale}`, {
      cache: "no-store",
    });
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
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;

  const current = await getArticle(slug, locale);
  if (current.status === 404) return {};

  // 仅输出实际存在的翻译版本 + x-default（存在性探测）
  const languages: Record<string, string> = {};
  for (const alt of SUPPORTED_LOCALES) {
    const probe = await getArticle(slug, alt);
    if (probe.status === 200) {
      languages[alt] = absoluteUrl(localizedPath(alt, `/articles/${slug}`));
    }
  }
  languages["x-default"] = absoluteUrl(localizedPath(DEFAULT_LOCALE, `/articles/${slug}`));
  return { alternates: { languages } };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;

  const { status, article } = await getArticle(slug, locale);

  // 当前语言无此文章 → 302 回退默认语言同路径（无前缀）
  if (status === 404 && locale !== DEFAULT_LOCALE) {
    redirect(localizedPath(DEFAULT_LOCALE, `/articles/${slug}`));
  }
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
