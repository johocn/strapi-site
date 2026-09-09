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
  };
  const mentions =
    (article.mentionedEntities ?? [])
      .map((e) => ({ "@type": "DefinedTerm", name: e.name, ...(e.slug ? { url: `${SITE_URL}/knowledge/${e.slug}` } : {}) }))
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
