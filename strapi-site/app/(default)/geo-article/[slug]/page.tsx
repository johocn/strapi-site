import { DEFAULT_LOCALE } from "@/lib/i18n";
import { listGeoArticleSlugs } from "@/lib/geo-article";

// 默认语言（zh-CN）GEO 评测文章：根路径 /geo-article/[slug]，复用 [locale] 页面（locale=undefined → DEFAULT_LOCALE）
export { default, generateMetadata } from "../../../[locale]/geo-article/[slug]/page";

/** 静态导出：默认语言（无前缀）按已发布 geo-article slug 预渲染 */
export async function generateStaticParams() {
  const slugs = await listGeoArticleSlugs("geo-article", DEFAULT_LOCALE);
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "__missing__" }];
}
