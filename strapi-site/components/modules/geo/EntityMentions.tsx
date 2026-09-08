import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：实体关联（文中提及的知识图谱实体，展示名称与类型，不输出死链）。
 * 默认折叠（<details> 收起），内容仍在 SSR HTML 中，SEO 爬虫可抓取、不影响正文阅读。
 */
export default function EntityMentions({ article }: { article: GeoArticle }) {
  const entities = article.mentionedEntities ?? [];
  if (entities.length === 0) return null;
  return (
    <section className="geo-entity-mentions">
      <h2>文中涉及</h2>
      <details className="geo-collapse">
        <summary className="geo-collapse-summary">
          查看知识实体（{entities.length} 个）
        </summary>
        <ul className="geo-entity-list">
          {entities.map((e) => (
            <li key={e.id} className="geo-entity-item">
              <span className="geo-entity-name">{e.name}</span>
              {e.entityType && <span className="geo-entity-type">{e.entityType}</span>}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
