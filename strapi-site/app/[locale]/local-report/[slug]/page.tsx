import type { Metadata } from "next";
import { GeoArticleView, generateGeoMetadata } from "@/components/views/GeoArticleView";
import { normalizeLocale, DEFAULT_LOCALE, alternateLocaleSegments } from "@/lib/i18n";
import { listGeoArticleSlugs } from "@/lib/geo-article";

/** 静态导出：仅备选语言（en）预渲染 /en/...；无内容时生成占位路由（页面 notFound()，静态导出要求动态路由至少一页） */
export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const { locale } of alternateLocaleSegments()) {
    const slugs = await listGeoArticleSlugs("local-report", locale);
    if (slugs.length === 0) {
      params.push({ locale, slug: "__missing__" });
      continue;
    }
    for (const slug of slugs) params.push({ locale, slug });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;
  return generateGeoMetadata({ type: "local-report", slug, locale });
}

export default async function LocalReportPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;
  return <GeoArticleView type="local-report" slug={slug} locale={locale} />;
}
