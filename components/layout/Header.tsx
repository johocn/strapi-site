import Link from "next/link";
import { DEFAULT_LOCALE, localizedPath, UI_STRINGS } from "@/lib/i18n";
import { resolveConfig, type SiteConfigBundle } from "@/lib/site-config";
import BrandLogo from "@/components/brand/BrandLogo";
import LanguageSwitcher from "./LanguageSwitcher";

type HeaderProps = {
  bundle: SiteConfigBundle | null;
  locale: string;
};

/**
 * 一级 layout 组件：站点头（logo + 导航 + 语言切换）。
 * 样式由 config.global.layout.header 驱动（sticky / style），缺省走内置默认。
 */
export default function Header({ bundle, locale }: HeaderProps) {
  const ui = UI_STRINGS[locale] ?? UI_STRINGS[DEFAULT_LOCALE];
  const headerCfg = resolveConfig(bundle, ["global", "layout", "header"]) || {};
  const sticky = headerCfg.sticky !== false;
  const siteName =
    bundle?.site?.siteName || bundle?.siteName || "strapi-site";

  return (
    <header className={`site-header${sticky ? " is-sticky" : ""}`}>
      <div className="site-header-inner">
        <Link href={localizedPath(locale, "/")} className="site-logo">
          <BrandLogo siteName={siteName} size={17} />
        </Link>
        <nav className="site-nav" aria-label="主导航">
          <Link href={localizedPath(locale, "/")}>{ui.navHome}</Link>
          <Link href={localizedPath(locale, "/articles")}>{ui.navArticles}</Link>
        </nav>
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
