import type { Metadata } from "next";
import { KnowledgeEntityView, generateEntityMetadata } from "@/components/views/KnowledgeEntityView";
import { normalizeLocale, DEFAULT_LOCALE, alternateLocaleSegments } from "@/lib/i18n";
import { listKnowledgeEntitySlugs } from "@/lib/knowledge-entity";

export async function generateStaticParams() {
  const slugs = await listKnowledgeEntitySlugs();
  const params: { locale: string; slug: string }[] = [];
  for (const { locale } of alternateLocaleSegments()) {
    if (slugs.length === 0) {
      params.push({ locale, slug: "__missing__" });
      continue;
    }
    for (const slug of slugs) params.push({ locale, slug });
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;
  void locale;
  return generateEntityMetadata(slug);
}

export default async function KnowledgeEntityPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;
  return <KnowledgeEntityView slug={slug} locale={locale} />;
}
