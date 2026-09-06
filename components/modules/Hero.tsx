import { resolveConfig, type SiteConfigBundle } from "@/lib/site-config";

type HeroProps = {
  bundle: SiteConfigBundle | null;
  siteName?: string;
  siteDescription?: string;
};

/**
 * 四级模块：首页 Hero 头图。
 * 配置：config.modules.hero { enabled, style: centered|split, height }
 * 未配置 → 组件内置默认；enabled:false → 不渲染。
 */
export default function Hero({ bundle, siteName, siteDescription }: HeroProps) {
  const cfg = resolveConfig(bundle, ["modules", "hero"]) || {};
  if (cfg.enabled === false) return null;
  const style = typeof cfg.style === "string" ? cfg.style : "default";
  const height = typeof cfg.height === "number" ? cfg.height : undefined;

  return (
    <header
      className={`hero module-hero style-${style}`}
      style={height ? { minHeight: height } : undefined}
    >
      <h1>{siteName ?? "strapi-site"}</h1>
      <p>{siteDescription ?? "环境验证页：未获取到站点配置"}</p>
    </header>
  );
}
