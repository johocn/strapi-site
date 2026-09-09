import type { GeoArticle } from "@/lib/geo-article";
import { SITE_URL } from "@/lib/env";

export function buildGeoJsonLd(article: GeoArticle, site: any): Record<string, unknown> | null {
  const type = article.jsonLdType || (article.type === "geo-faq" ? "FAQPage" : "Article");
  const authorName = article.author?.name || article.authorName;
  const image = article.coverImage?.url ? `${SITE_URL}${article.coverImage.url}` : undefined;
  const base = {
    "@context": "https://schema.org",
    "@type": type,
    headline: article.metaTitle || article.title,
    description: article.metaDescription || "",
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    ...(image ? { image } : {}),
    author: authorName ? { "@type": "Person", name: authorName } : undefined,
    publisher: { "@type": "Organization", name: site?.siteName || "" },
    mainEntityOfPage: article.canonicalUrl || undefined,
    // 语音搜索 GEO 信号：告知搜索引擎正文区块可朗读
    speakable: [{ "@type": "SpeakableSpecification", cssSelector: [".geo-body"] }],
  };
  const mentions =
    (article.mentionedEntities ?? [])
      .map((e) => ({
        "@type": "DefinedTerm",
        name: e.name,
        ...(e.slug ? { url: `${SITE_URL}/knowledge/${e.slug}` } : {}),
        // 实体类型非默认 DefinedTerm 时补充 additionalType，避免与 @type 重复
        ...(e.entityType && e.entityType !== "DefinedTerm" ? { additionalType: e.entityType } : {}),
      }))
      .filter((m) => m.name);
  const citation = (article.truthBasis ?? [])
    .map((t) => ({
      "@type": "CreativeWork",
      name: t.claim,
      ...(t.canonicalSourceUrl ? { url: t.canonicalSourceUrl } : {}),
      ...(t.verificationStatus === "verified" ? { review: { "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" } } } : {}),
    }))
    .filter((c) => c.name);
  const withMeta = (extra: Record<string, unknown>) => ({
    ...base,
    ...extra,
    ...(mentions.length ? { mentions } : {}),
    ...(citation.length ? { citation } : {}),
  });
  if (type === "FAQPage") {
    return withMeta({
      mainEntity: [{
        "@type": "Question",
        name: article.faqQuestion || article.title,
        acceptedAnswer: { "@type": "Answer", text: article.content?.slice(0, 500) || "" },
      }],
    });
  }
  if (type === "LocalBusiness") {
    return withMeta({
      name: site?.siteName,
      address: { "@type": "PostalAddress", streetAddress: site?.organizationAddress || "" },
      telephone: site?.organizationPhone || "",
    });
  }
  if (type === "ItemList") {
    const items =
      (article.listItems ?? []).map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name })).length > 0
        ? (article.listItems ?? []).map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name }))
        : (article.comparisonData ?? []).flatMap((d) =>
            (d.items ?? []).map((it) => ({ "@type": "ListItem", name: it.name }))
          ).map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name }));
    if (items.length === 0) return null;
    return withMeta({ name: site?.siteName, itemListElement: items });
  }
  return withMeta({});
}

// 相对路径转绝对 URL：已带协议的原样返回
function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}

/**
 * 生成面包屑 BreadcrumbList JSON-LD
 * 末层无 href 时兜底为当前页 pageUrl；无 item 的项会被过滤；空数组返回 null
 */
export function buildBreadcrumbJsonLd(crumbs: { label: string; href?: string }[], pageUrl: string): Record<string, unknown> | null {
  if (crumbs.length === 0) return null;
  const itemListElement = crumbs
    .map((c, i) => {
      const item = c.href ? absoluteUrl(c.href) : i === crumbs.length - 1 ? pageUrl : undefined;
      return item === undefined ? null : { "@type": "ListItem", position: i + 1, name: c.label, item };
    })
    .filter((el): el is { "@type": "ListItem"; position: number; name: string; item: string } => el !== null);
  if (itemListElement.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}
