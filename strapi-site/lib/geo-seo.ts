import type { GeoArticle } from "@/lib/geo-article";

export function buildGeoJsonLd(article: GeoArticle, site: any): Record<string, unknown> | null {
  const type = article.jsonLdType || (article.type === "geo-faq" ? "FAQPage" : "Article");
  const base = {
    "@context": "https://schema.org",
    "@type": type,
    headline: article.metaTitle || article.title,
    description: article.metaDescription || "",
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    image: article.coverImage?.url,
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
  return base;
}
