import { resolveConfig, type SiteConfigBundle } from "@/lib/site-config";

type FooterProps = {
  bundle: SiteConfigBundle | null;
  locale: string;
};

/**
 * 一级 layout 组件：站点页脚（品牌 + ICP 备案）。
 * 样式由 config.global.layout.footer 驱动（columns），缺省走内置默认。
 */
export default function Footer({ bundle }: FooterProps) {
  const footerCfg = resolveConfig(bundle, ["global", "layout", "footer"]) || {};
  const columns = typeof footerCfg.columns === "number" ? footerCfg.columns : 3;
  const site = bundle?.site ?? {};
  const siteName = site.siteName || bundle?.siteName || "strapi-site";
  const icp = site.icpNumber || bundle?.icpNumber || "";

  return (
    <footer className="site-footer">
      <div className="site-footer-inner" style={{ "--footer-columns": columns } as React.CSSProperties}>
        <div className="site-footer-brand">
          <span className="site-footer-name">{siteName}</span>
          {icp ? (
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noreferrer"
              className="site-footer-icp"
            >
              {icp}
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
