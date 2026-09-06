import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：实体关联（文中提及的知识图谱实体，展示名称与类型，不输出死链）。
 */
export default function EntityMentions({ article }: { article: GeoArticle }) {
  const entities = article.mentionedEntities ?? [];
  if (entities.length === 0) return null;
  return (
    <section className="geo-entity-mentions">
      <h2>文中涉及</h2>
      <ul className="geo-entity-list">
        {entities.map((e) => (
          <li key={e.id} className="geo-entity-item">
            <span className="geo-entity-name">{e.name}</span>
            {e.entityType && <span className="geo-entity-type">{e.entityType}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
