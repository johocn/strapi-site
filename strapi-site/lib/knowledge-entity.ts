import { API_ROOT } from "@/lib/env";

export type EntityRelation = {
  predicate: string;
  objectEntity?: { slug?: string; name?: string; "@id"?: string };
  objectValue?: unknown;
  objectText?: string;
  sourceType?: string;
};

export type KnowledgeEntity = {
  "@type"?: string;
  "@id"?: string;
  name: string;
  description?: string;
  url?: string;
  image?: string;
  slug?: string;
  verificationStatus?: string;
  confidence?: number;
  sameAs?: string[];
  articles?: { slug: string; title: string; type: string; publishedAt?: string }[];
  incoming?: any[];
  outgoing?: EntityRelation[];
  [key: string]: unknown;
};

/** 实体详情（content-api /knowledge-graph/:slug） */
export async function getKnowledgeEntity(slug: string): Promise<{ status: number; entity: KnowledgeEntity | null }> {
  try {
    const res = await fetch(`${API_ROOT}/knowledge-graph/${encodeURIComponent(slug)}`);
    if (!res.ok) return { status: res.status, entity: null };
    return { status: res.status, entity: await res.json() };
  } catch {
    return { status: 500, entity: null };
  }
}

/** 构建期枚举全部实体 slug（knowledge-graph.json @graph 的 @id 即 slug） */
export async function listKnowledgeEntitySlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_ROOT}/knowledge-graph.json`);
    if (!res.ok) return [];
    const data = await res.json();
    const graph = Array.isArray(data) ? data : data?.["@graph"];
    if (!Array.isArray(graph)) return [];
    return graph
      .map((n: any) => (typeof n?.["@id"] === "string" ? n["@id"] : n?.slug))
      .filter((s: unknown): s is string => typeof s === "string" && s.length > 0);
  } catch {
    return [];
  }
}
