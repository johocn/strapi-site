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

/** 知识关系条目：outgoing=本实体作为主体；incoming=本实体作为客体（关联实体为 subjectEntity） */
function relationItems(entity: KnowledgeEntity, direction: "outgoing" | "incoming"): { label: string; value: string; href?: string }[] {
  const items: { label: string; value: string; href?: string }[] = [];
  const rels = direction === "incoming"
    ? (Array.isArray(entity.incoming) ? entity.incoming : [])
    : (Array.isArray(entity.outgoing) ? entity.outgoing : []);
  for (const rel of rels) {
    const target = direction === "incoming" ? rel.subjectEntity : rel.objectEntity;
    if (target?.name) {
      const href = target.slug ? `/knowledge/${target.slug}` : undefined;
      items.push({ label: rel.predicate, value: target.name, href });
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

  const outgoing = relationItems(entity, "outgoing");
  const incoming = relationItems(entity, "incoming");
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

      {outgoing.length > 0 || incoming.length > 0 ? (
        <section className="entity-section">
          <h2>知识关系</h2>
          {outgoing.length > 0 ? (
            <>
              <h3 className="entity-subsection">本实体指向</h3>
              <ul className="entity-relations">
                {outgoing.map((r, i) => (
                  <li key={`o${i}`}>
                    <span className="rel-predicate">{r.label}</span>
                    {r.href ? <a href={localizedPath(locale, r.href)}>{r.value}</a> : <span>{r.value}</span>}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {incoming.length > 0 ? (
            <>
              <h3 className="entity-subsection">指向本实体</h3>
              <ul className="entity-relations">
                {incoming.map((r, i) => (
                  <li key={`i${i}`}>
                    {r.href ? <a href={localizedPath(locale, r.href)}>{r.value}</a> : <span>{r.value}</span>}
                    <span className="rel-predicate">{r.label}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
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
