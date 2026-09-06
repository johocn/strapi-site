// 默认语言（zh-CN）知识实体：根路径 /knowledge/[slug]，复用 [locale] 页面
export { default, generateMetadata } from "../../../[locale]/knowledge/[slug]/page";

import { listKnowledgeEntitySlugs } from "@/lib/knowledge-entity";

export async function generateStaticParams() {
  const slugs = await listKnowledgeEntitySlugs();
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "__missing__" }];
}
