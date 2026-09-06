import type { Metadata } from "next";
import { GeoArticleView, generateGeoMetadata } from "@/components/views/GeoArticleView";
import { normalizeLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;
  return generateGeoMetadata({ type: "local-comparison", slug, locale });
}

export default async function LocalComparisonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;
  return <GeoArticleView type="local-comparison" slug={slug} locale={locale} />;
}
