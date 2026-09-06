import { DEFAULT_LOCALE } from "@/lib/i18n";
import { listGeoArticleSlugs } from "@/lib/geo-article";

// 默认语言（zh-CN）本地报告：根路径 /local-report/[slug]，复用 [locale] 页面（locale=undefined → DEFAULT_LOCALE）
export { default, generateMetadata } from "../../../[locale]/local-report/[slug]/page";

/** 静态导出：默认语言（无前缀）按已发布 local-report slug 预渲染 */
export async function generateStaticParams() {
  return (await listGeoArticleSlugs("local-report", DEFAULT_LOCALE)).map((slug) => ({ slug }));
}
