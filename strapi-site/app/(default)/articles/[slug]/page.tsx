import { DEFAULT_LOCALE } from "@/lib/i18n";
import { API_ROOT } from "@/lib/env";

// 默认语言（zh-CN）资讯详情：根路径 /articles/[slug]，复用 [locale] 页面（locale=undefined → DEFAULT_LOCALE）
export { default, generateMetadata } from "../../../[locale]/articles/[slug]/page";

/** 构建期枚举默认语言已发布文章 slug */
async function listArticleSlugs(locale: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_ROOT}/articles?locale=${locale}&pageSize=200`);
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data) ? data : data?.results ?? [];
    return results.map((r: any) => r?.slug).filter(Boolean);
  } catch {
    return [];
  }
}

/** 静态导出：默认语言（无前缀）按已发布 slug 预渲染，缺失组合不生成 → 自然 404 */
export async function generateStaticParams() {
  return (await listArticleSlugs(DEFAULT_LOCALE)).map((slug) => ({ slug }));
}
