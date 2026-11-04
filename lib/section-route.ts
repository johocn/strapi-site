import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n";
import { isSectionKind, type SectionKind } from "@/lib/section";

export type SectionRoute = {
  /** 解析后的站点语言 */
  locale: string;
  sectionSlug: string;
  /** 板块内列表类型；null = 板块首页 */
  kind: SectionKind | null;
};

/**
 * 首段兼任解析（根路径动态段只能有一个，`(default)/[section]` 会与 `[locale]` 冲突）：
 * - 首段命中支持语言（en）→ /{locale}/{section}[/{kind}]
 * - 首段未命中语言 → /{section}[/{kind}]（默认语言无前缀）
 * 无法解析（类型的第二段非法、出现第三段）返回 null，由调用方 notFound。
 */
export function parseSectionRoute(
  first: string | undefined,
  second?: string,
  third?: string
): SectionRoute | null {
  if (!first) return null;
  const locale = normalizeLocale(first);

  if (locale) {
    if (!second) return null;
    if (third !== undefined && !isSectionKind(third)) return null;
    return {
      locale,
      sectionSlug: second,
      kind: isSectionKind(third) ? third : null,
    };
  }

  // 无语言前缀：首段即板块；第三段（详情路径）不在本期范围
  if (third !== undefined) return null;
  if (second !== undefined && !isSectionKind(second)) return null;
  return {
    locale: DEFAULT_LOCALE,
    sectionSlug: first,
    kind: isSectionKind(second) ? second : null,
  };
}

/** 板块内路径（默认语言无前缀，en 加 /en） */
export function sectionPath(locale: string, sectionSlug: string, kind?: SectionKind | null): string {
  const base = `/${sectionSlug}${kind ? `/${kind}` : ""}`;
  return normalizeLocale(locale) === "en" ? `/en${base}` : base;
}
