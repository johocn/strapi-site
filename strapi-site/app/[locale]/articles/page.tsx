import type { Metadata } from "next";
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  localizedPath,
  alternateLocaleSegments,
} from "@/lib/i18n";
import { getSiteConfig } from "@/lib/site-config";
import { API_ROOT, SITE_URL } from "@/lib/env";
import ArticleGrid from "@/components/modules/ArticleGrid";
import type { FeedArticle } from "@/components/modules/ArticleFeed";

/** 资讯列表页：聚合 GEO 全部类型文章（geo-article/geo-faq/local-list/local-comparison） */

/** 构建期枚举某语言已发布 GEO 文章（静态导出 generateStaticParams 数据源） */
async function listGeoArticles(locale: string): Promise<FeedArticle[]> {
  try {
    const res = await fetch(`${API_ROOT}/geo-articles?locale=${locale}&pageSize=200`);
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data) ? data : data?.results ?? [];
    return results.map((r: any) => ({
      id: r?.id,
      documentId: r?.documentId,
      title: r?.title,
      slug: r?.slug,
      type: r?.type,
    })).filter((a: FeedArticle) => a.slug);
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  return alternateLocaleSegments();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;
  const title = locale === "en" ? "Articles" : "资讯";
  return {
    title: `${title} | joho.cn`,
    alternates: { canonical: `${SITE_URL}${localizedPath(locale, "/articles")}` },
  };
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;
  const [bundle, articles] = await Promise.all([
    getSiteConfig(SITE_URL),
    listGeoArticles(locale),
  ]);

  return (
    <main className="articles-page">
      <ArticleGrid
        bundle={bundle}
        locale={locale}
        articles={articles}
        heading={locale === "en" ? "Articles" : "资讯"}
      />
    </main>
  );
}
