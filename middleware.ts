import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, normalizeLocale } from "./lib/i18n";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  const locale = normalizeLocale(first);

  const requestHeaders = new Headers(request.headers);

  // 解析出的语言（无前缀时回退默认语言），供 layout 输出 html lang
  const resolved = locale ?? DEFAULT_LOCALE;
  requestHeaders.set("x-locale", resolved);

  // 无合法语言前缀（含 /、/articles/xxx、非法前缀 /xx/）→ 内部 rewrite 到默认语言路径，
  // URL 保持不变；"URL 即语言、无前缀=默认语言"，业务路径首段（如 articles）不得被误判重定向
  if (!locale) {
    const url = request.nextUrl.clone();
    url.pathname = "/" + [resolved, ...segments].join("/");
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  // 已带合法语言前缀（如 /en/...）→ 放行
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // 排除静态资源、API 代理与 next.config 直连映射的文件（避免 /sitemap.xml 等被当作非法语言前缀处理）
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|sitemap.xml|robots.txt|llms.txt).*)"],
};
