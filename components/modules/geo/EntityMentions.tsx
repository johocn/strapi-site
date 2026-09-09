import type { GeoArticle } from "@/lib/geo-article";
import Link from "next/link";
import { listKnowledgeEntitySlugs } from "@/lib/knowledge-entity";
import { localizedPath } from "@/lib/i18n";

/** 通用概念词（DefinedTerm 基础概念，用户不可见；AI/爬虫仍可在 HTML 中抓取） */
const GENERIC_ENTITY_WORDS = ["教育", "学习", "课程", "在线教育", "在线课程", "学习方法", "学习资源", "学历教育", "考试认证"];

function isGeneric(entity: { name?: string; entityType?: string }): boolean {
  if (entity.entityType !== "DefinedTerm") return false;
  return GENERIC_ENTITY_WORDS.includes(entity.name || "");
}

/**
 * GEO 模块：实体关联（文中提及的知识图谱实体，标签云展示强相关实体）。
 * 用户侧：只展示过滤后的强相关实体（标签 chip）。
 * AI 侧：全部实体仍在 SSR HTML 中，SEO 爬虫可抓取完整数据。
 */
export default async function EntityMentions({ article, locale }: { article: GeoArticle; locale: string }) {
  const entities = article.mentionedEntities ?? [];
  const visible = entities.filter((e) => !isGeneric(e));
  if (visible.length === 0) return null;
  // 构建期拉取知识实体 slug 白名单（走 Next fetch-cache，全站复用），仅白名单内实体可链
  const whitelist = new Set(await listKnowledgeEntitySlugs());
  return (
    <section className="geo-entity-mentions">
      <h2>文中涉及</h2>
      <details className="geo-collapse">
        <summary className="geo-collapse-summary">
          查看涉及概念（{visible.length} 个）
        </summary>
        <ul className="geo-entity-tags">
          {visible.map((e) => (
            <li key={e.id} className="geo-entity-tag">
              {e.slug && whitelist.has(e.slug) ? (
                <Link
                  href={localizedPath(locale, `/knowledge/${e.slug}`)}
                  className="geo-entity-name"
                >
                  {e.name}
                </Link>
              ) : (
                <span className="geo-entity-name">{e.name}</span>
              )}
              {e.entityType && <span className="geo-entity-type">{e.entityType}</span>}
            </li>
          ))}
        </ul>
        {entities.filter((e) => isGeneric(e)).length > 0 && (
          <div className="geo-entity-generic" aria-hidden="true">
            {entities.filter((e) => isGeneric(e)).map((e) => (
              <span key={e.id} className="geo-entity-generic-item">{e.name}</span>
            ))}
          </div>
        )}
      </details>
    </section>
  );
}
