import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：相关阅读（internalLinks 数组）。
 */
export default function InternalLinks({ article }: { article: GeoArticle }) {
  const links = Array.isArray(article.internalLinks)
    ? article.internalLinks.filter((l) => l?.text && l?.url)
    : [];
  if (links.length === 0) return null;
  return (
    <section className="geo-internal-links">
      <h2>相关阅读</h2>
      <ul>
        {links.map((l, i) => (
          <li key={i}>
            <a href={l.url}>{l.text}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
