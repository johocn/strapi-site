import type { GeoArticle } from "@/lib/geo-article";

export function buildGeoJsonLd(article: GeoArticle, site: any): Record<string, unknown> | null {
  const type = article.jsonLdType || (article.type === "geo-faq" ? "FAQPage" : "Article");
  const authorName = article.author?.name || article.authorName;
  const base = {
    "@context": "https://schema.org",
    "@type": type,
    headline: article.metaTitle || article.title,
    description: article.metaDescription || "",
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    image: article.coverImage?.url,
    author: authorName ? { "@type": "Person", name: authorName } : undefined,
    publisher: { "@type": "Organization", name: site?.siteName || "" },
    mainEntityOfPage: article.canonicalUrl || undefined,
  };
  if (type === "FAQPage") {
    return {
      ...base,
      mainEntity: [{
        "@type": "Question",
        name: article.faqQuestion || article.title,
        acceptedAnswer: { "@type": "Answer", text: article.content?.slice(0, 500) || "" },
      }],
    };
  }
  if (type === "LocalBusiness") {
    return {
      ...base,
      name: site?.siteName,
      address: { "@type": "PostalAddress", streetAddress: site?.organizationAddress || "" },
      telephone: site?.organizationPhone || "",
    };
  }
  if (type === "ItemList") {
    const items =
      (article.listItems ?? []).map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name })).length > 0
        ? (article.listItems ?? []).map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name }))
        : (article.comparisonData ?? []).flatMap((d) =>
            (d.items ?? []).map((it) => ({ "@type": "ListItem", name: it.name }))
          ).map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name }));
    if (items.length === 0) return null;
    return { ...base, name: site?.siteName, itemListElement: items };
  }
  return base;
}
