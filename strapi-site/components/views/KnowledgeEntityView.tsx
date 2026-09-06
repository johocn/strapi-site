import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getKnowledgeEntity, type KnowledgeEntity } from "@/lib/knowledge-entity";
import { localizedPath } from "@/lib/i18n";
import type { GeoArticleType } from "@/lib/geo-article";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const TYPE_LABELS: Record<string, string> = {
  Organization: "机构", Person: "人物", Product: "产品", Service: "服务",
  Place: "地点", Event: "事件", Brand: "品牌",
};

const ROUTE_PREFIX: Record<string, string> = {
  "geo-article": "/geo-article", "geo-faq": "/geo-faq",
  "local-report": "/local-report", "local-comparison": "/local-comparison", "local-list": "/local-list",
};

function relationItems(entity: KnowledgeEntity): { label: string; value: string; href?: string }[] {
  const items: { label: string; value: string; href?: string }[] = [];
  const outgoing = Array.isArray(entity.outgoing) ? entity.outgoing : [];
  for (const rel of outgoing) {
    if (rel.objectEntity?.name) {
      const href = rel.objectEntity.slug ? `/knowledge/${rel.objectEntity.slug}` : undefined;
      items.push({ label: rel.predicate, value: rel.objectEntity.name, href });
    } else if (rel.objectText) {
      items.push({ label: rel.predicate, value: rel.objectText });
    } else if (rel.objectValue !== undefined && rel.objectValue !== null) {
      items.push({ label: rel.predicate, value: String(rel.objectValue) });
    }
  }
  return items;
}

export async function generateEntityMetadata(slug: string): Promise<Metadata> {
  const { status, entity } = await getKnowledgeEntity(slug);
  if (status === 404 || !entity) return {};
  return {
    title: `${entity.name} - ${TYPE_LABELS[String(entity["@type"] || "")] || "知识实体"}`,
    description: entity.description || undefined,
  };
}

export async function KnowledgeEntityView({ slug, locale }: { slug: string; locale: string }) {
  const { status, entity } = await getKnowledgeEntity(slug);
  if (status === 404 || !entity) notFound();

  const relations = relationItems(entity);
  const articles = Array.isArray(entity.articles) ? entity.articles : [];

  return (
    <div className="entity-page">
      <header className="entity-header">
        <span className="entity-type">{TYPE_LABELS[String(entity["@type"] || "")] || String(entity["@type"] || "实体")}</span>
        <h1>{entity.name}</h1>
        {entity.description ? <p>{entity.description}</p> : null}
        {(entity.verificationStatus || entity.confidence !== undefined) ? (
          <p className="entity-meta">
            核验：{entity.verificationStatus || "unknown"}
            {entity.confidence !== undefined ? ` · 置信度 ${entity.confidence}` : ""}
          </p>
        ) : null}
      </header>

      {relations.length > 0 ? (
        <section className="entity-section">
          <h2>知识关系</h2>
          <ul className="entity-relations">
            {relations.map((r, i) => (
              <li key={i}>
                <span className="rel-predicate">{r.label}</span>
                {r.href ? <a href={localizedPath(locale, r.href)}>{r.value}</a> : <span>{r.value}</span>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {articles.length > 0 ? (
        <section className="entity-section">
          <h2>相关文章</h2>
          <ul className="entity-articles">
            {articles.map((a) => (
              <li key={a.slug}>
                <a href={localizedPath(locale, `${ROUTE_PREFIX[a.type as GeoArticleType] || "/geo-article"}/${a.slug}`)}>{a.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
