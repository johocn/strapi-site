import { DEFAULT_LOCALE } from "@/lib/i18n";
import { listGeoArticleSlugs } from "@/lib/geo-article";

// 默认语言（zh-CN）GEO 常见问题：根路径 /geo-faq/[slug]，复用 [locale] 页面（locale=undefined → DEFAULT_LOCALE）
export { default, generateMetadata } from "../../../[locale]/geo-faq/[slug]/page";

/** 静态导出：默认语言（无前缀）按已发布 geo-faq slug 预渲染 */
export async function generateStaticParams() {
  return (await listGeoArticleSlugs("geo-faq", DEFAULT_LOCALE)).map((slug) => ({ slug }));
}
