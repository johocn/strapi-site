import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：本地清单（local-list 的 listItems 条目）。
 */
export default function LocalList({ article }: { article: GeoArticle }) {
  const items = article.listItems ?? [];
  if (items.length === 0) return null;
  return (
    <section className="geo-local-list">
      <h2>本地清单</h2>
      <ul>
        {items.map((it, i) => (
          <li key={i} className="geo-list-item">
            {it.link ? (
              <a href={it.link} target="_blank" rel="noopener noreferrer" className="geo-list-name">{it.name}</a>
            ) : (
              <span className="geo-list-name">{it.name}</span>
            )}
            {it.price && <span className="geo-list-price">{it.price}</span>}
            {it.desc && <div className="geo-list-desc">{it.desc}</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}
