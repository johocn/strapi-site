// 默认语言（zh-CN）首页：根路径 /，复用 [locale]/page（params.locale=undefined → DEFAULT_LOCALE）
// 必须同时 re-export generateMetadata，否则根路径首页丢失 SEO 元数据（canonical/description）
export { default, generateMetadata } from "../[locale]/page";
