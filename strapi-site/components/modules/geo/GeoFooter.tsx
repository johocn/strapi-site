import { resolveConfig, type SiteConfigBundle } from "@/lib/site-config";
import BrandLogo from "@/components/brand/BrandLogo";

const FOOTER_LINKS: { label: string; key: "privacyUrl" | "afterSaleUrl" | "returnUrl" }[] = [
  { label: "隐私政策", key: "privacyUrl" },
  { label: "售后服务", key: "afterSaleUrl" },
  { label: "退换货政策", key: "returnUrl" },
];

const DISCLAIMER = "本页内容仅供参考，不构成任何承诺或保证，具体以门店实际服务为准。";

/**
 * GEO 模块：站点信息（siteName/organizationAddress/organizationPhone）
 * + 链接组（privacyUrl/afterSaleUrl/returnUrl，取自 bundle config.global.footer，缺失用内置文案）
 * + 免责声明。
 */
export default function GeoFooter({
  site,
  bundle,
}: {
  site?: Record<string, any> | null;
  bundle?: SiteConfigBundle | null;
}) {
  const siteInfo = site ?? bundle?.site ?? {};
  const siteName = siteInfo.siteName || bundle?.siteName || "本站";
  const organizationAddress = siteInfo.organizationAddress || "";
  const organizationPhone = siteInfo.organizationPhone || "";
  const footerCfg = resolveConfig(bundle ?? null, ["global", "footer"]) || {};
  return (
    <footer className="geo-footer">
      <div className="geo-footer-info">
        <span className="geo-footer-site-name">
          <BrandLogo siteName={siteName} />
        </span>
        {organizationAddress && <span className="geo-footer-address">{organizationAddress}</span>}
        {organizationPhone && <span className="geo-footer-phone">{organizationPhone}</span>}
      </div>
      <nav className="geo-footer-links" aria-label="站点链接">
        {FOOTER_LINKS.map(({ label, key }) => {
          const url = footerCfg[key];
          return url ? (
            <a key={key} className="geo-footer-link" href={url} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ) : (
            <span key={key} className="geo-footer-link">{label}</span>
          );
        })}
      </nav>
      <p className="geo-footer-disclaimer">{DISCLAIMER}</p>
    </footer>
  );
}
