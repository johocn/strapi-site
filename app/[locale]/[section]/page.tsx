import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, alternateLocaleSegments } from "@/lib/i18n";
import { SITE_URL } from "@/lib/env";
import {
  SECTION_KINDS,
  getSection,
  listSectionContent,
  listSectionHighlights,
  listSections,
  sectionKindLabel,
} from "@/lib/section";
import { parseSectionRoute, sectionPath } from "@/lib/section-route";
import { SectionHomeView, SectionListView } from "@/components/views/SectionView";

/**
 * 板块路由（二段）：首段兼任语言/板块。
 * - /{locale}/{section}（如 /en/ski）→ 板块首页
 * - /{section}/{kind}（如 /ski/guides）→ 默认语言板块列表
 */
export async function generateStaticParams() {
  const params: { locale: string; section: string }[] = [];

  for (const { locale } of alternateLocaleSegments()) {
    for (const section of await listSections(locale)) params.push({ locale, section: section.slug });
  }

  const sections = await listSections(DEFAULT_LOCALE);
  for (const section of sections) {
    for (const kind of SECTION_KINDS) params.push({ locale: section.slug, section: kind });
  }

  // 静态导出要求动态路由至少一页：无板块时生成占位（页面 notFound）
  if (params.length === 0) params.push({ locale: "en", section: "__missing__" });
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}): Promise<Metadata> {
  const { locale: first, section: second } = await params;
  const route = parseSectionRoute(first, second);
  if (!route) return {};
  const section = await getSection(route.sectionSlug, route.locale);
  if (!section) return {};

  if (!route.kind) {
    return {
      title: section.seoTitle || `${section.name} | joho.cn`,
      description: section.seoDescription || section.description || undefined,
      alternates: { canonical: `${SITE_URL}${sectionPath(route.locale, section.slug)}` },
    };
  }

  const label = sectionKindLabel(route.kind, route.locale);
  return {
    title: `${label} · ${section.name} | joho.cn`,
    description: section.seoDescription || section.description || undefined,
    alternates: {
      canonical: `${SITE_URL}${sectionPath(route.locale, section.slug, route.kind)}`,
    },
  };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale: first, section: second } = await params;
  const route = parseSectionRoute(first, second);
  if (!route) notFound();

  const section = await getSection(route.sectionSlug, route.locale);
  if (!section) notFound();

  if (!route.kind) {
    const highlights = await listSectionHighlights(section.slug, route.locale);
    return (
      <SectionHomeView section={section} locale={route.locale} highlights={highlights} />
    );
  }

  const items = await listSectionContent(route.kind, section.slug, route.locale);
  return (
    <SectionListView section={section} locale={route.locale} kind={route.kind} items={items} />
  );
}
