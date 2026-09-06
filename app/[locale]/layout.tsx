import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n";
import { getSiteConfig, resolveConfig } from "@/lib/site-config";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** 一级 designTokens → CSS 变量内联注入（值来自自有后端配置，仍做基础清洗） */
function designTokenCss(tokens: any): string {
  if (!tokens || typeof tokens !== "object") return "";
  const safe = (v: any) => String(v ?? "").replace(/[;{}]/g, "").trim();
  const parts: string[] = [];
  const colors = tokens.colors || {};
  if (safe(colors.primary)) parts.push(`--color-primary:${safe(colors.primary)};`);
  if (safe(colors.bg)) parts.push(`--color-bg:${safe(colors.bg)};`);
  if (safe(colors.text)) parts.push(`--color-text:${safe(colors.text)};`);
  const fonts = tokens.fonts || {};
  if (safe(fonts.body)) parts.push(`--font-body:${safe(fonts.body)};`);
  if (safe(fonts.heading)) parts.push(`--font-heading:${safe(fonts.heading)};`);
  const radius = Number(tokens.radius);
  if (Number.isFinite(radius)) parts.push(`--radius:${radius}px;`);
  const spacing = tokens.spacing || {};
  const base = Number(spacing.base);
  if (Number.isFinite(base)) parts.push(`--space-base:${base}px;`);
  const section = Number(spacing.section);
  if (Number.isFinite(section)) parts.push(`--space-section:${section}px;`);
  return parts.join("");
}

/** 二级风格 class 名清洗（config.style 可能来自租户配置） */
function styleClass(style: any): string {
  const cleaned = String(style ?? "").replace(/[^a-z0-9-]/gi, "");
  return cleaned || "default";
}

/**
 * [locale] 级布局：读取合并配置一次，注入设计令牌 + 二级风格 class（config.style），
 * 挂载 Header/Footer。语言取 params（静态导出下不可用 headers()）。
 * 配置经 props 传给服务端组件（不建 context：模块均为服务端组件，props 最简）。
 */
export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale?: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale) ?? DEFAULT_LOCALE;

  const bundle = await getSiteConfig(SITE_URL);
  const style = resolveConfig(bundle, ["style"]) ?? "default";
  const designTokens = resolveConfig(bundle, ["global", "designTokens"]);
  const tokenCss = designTokenCss(designTokens);

  return (
    <div className={`site-root style-${styleClass(style)}`}>
      {tokenCss ? (
        <style id="design-tokens" dangerouslySetInnerHTML={{ __html: `:root{${tokenCss}}` }} />
      ) : null}
      <Header bundle={bundle} locale={locale} />
      {children}
      <Footer bundle={bundle} locale={locale} />
    </div>
  );
}
