import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { alternateLocaleSegments } from "@/lib/i18n";
import { SITE_URL } from "@/lib/env";
import {
  SECTION_KINDS,
  getSection,
  listSectionContent,
  listSections,
  sectionKindLabel,
} from "@/lib/section";
import { parseSectionRoute, sectionPath } from "@/lib/section-route";
import { SectionListView } from "@/components/views/SectionView";

/** 板块列表路由（三段）：/{locale}/{section}/{kind}，如 /en/ski/guides */
export async function generateStaticParams() {
  const params: { locale: string; section: string; kind: string }[] = [];
  for (const { locale } of alternateLocaleSegments()) {
    for (const section of await listSections(locale)) {
      for (const kind of SECTION_KINDS) params.push({ locale, section: section.slug, kind });
    }
  }
  if (params.length === 0) params.push({ locale: "en", section: "__missing__", kind: "guides" });
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; section: string; kind: string }>;
}): Promise<Metadata> {
  const { locale: first, section: second, kind: third } = await params;
  const route = parseSectionRoute(first, second, third);
  if (!route || !route.kind) return {};
  const section = await getSection(route.sectionSlug, route.locale);
  if (!section) return {};
  return {
    title: `${sectionKindLabel(route.kind, route.locale)} · ${section.name} | joho.cn`,
    description: section.seoDescription || section.description || undefined,
    alternates: {
      canonical: `${SITE_URL}${sectionPath(route.locale, section.slug, route.kind)}`,
    },
  };
}

export default async function SectionKindPage({
  params,
}: {
  params: Promise<{ locale: string; section: string; kind: string }>;
}) {
  const { locale: first, section: second, kind: third } = await params;
  const route = parseSectionRoute(first, second, third);
  if (!route || !route.kind) notFound();

  const section = await getSection(route.sectionSlug, route.locale);
  if (!section) notFound();

  const items = await listSectionContent(route.kind, section.slug, route.locale);
  return (
    <SectionListView section={section} locale={route.locale} kind={route.kind} items={items} />
  );
}
