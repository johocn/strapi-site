// 默认语言（zh-CN）资讯列表：根路径 /articles，复用 [locale] 页面（locale=undefined → DEFAULT_LOCALE）
// 必须同时 re-export generateMetadata，否则根路径丢失 SEO 元数据
export { default, generateMetadata } from "../../[locale]/articles/page";
