export const DEFAULT_LOCALE = "zh-CN";
export const SUPPORTED_LOCALES = [DEFAULT_LOCALE, "en"];

export function normalizeLocale(raw: string | undefined): string | null {
  if (!raw) return null; // 无前缀 = 默认语言
  const match = SUPPORTED_LOCALES.find(
    (l) => l.toLowerCase() === raw.toLowerCase() || l.split("-")[0].toLowerCase() === raw.toLowerCase()
  );
  return match || null;
}

/**
 * 生成带语言前缀的路径：默认语言无前缀，其他语言加 /{locale}/ 前缀。
 * 例：localizedPath("en", "/articles/x") → "/en/articles/x"；zh-CN → "/articles/x"
 */
export function localizedPath(locale: string, path: string): string {
  const resolved = normalizeLocale(locale) ?? DEFAULT_LOCALE;
  if (resolved === DEFAULT_LOCALE) return path;
  return `/${resolved}${path.startsWith("/") ? path : `/${path}`}`;
}

export const UI_STRINGS: Record<string, Record<string, string>> = {
  "zh-CN": { navHome: "首页", navArticles: "资讯", langName: "EN" },
  en: { navHome: "Home", navArticles: "Articles", langName: "中文" },
};
