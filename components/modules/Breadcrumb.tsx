import Link from "next/link";
import { localizedPath } from "@/lib/i18n";
import { resolveConfig, type SiteConfigBundle } from "@/lib/site-config";

export type Crumb = { label: string; href?: string };

type BreadcrumbProps = {
  bundle: SiteConfigBundle | null;
  locale: string;
  items: Crumb[];
};

/**
 * 四级模块：面包屑导航（列表页/详情页）。
 * 配置：config.modules.breadcrumb { enabled }
 * enabled:false → 不渲染（缺省视为启用）。
 */
export default function Breadcrumb({ bundle, locale, items }: BreadcrumbProps) {
  const cfg = resolveConfig(bundle, ["modules", "breadcrumb"]) || {};
  if (cfg.enabled === false) return null;
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <nav className="article-breadcrumb" aria-label="面包屑">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i}>
            {i > 0 ? <span aria-hidden="true"> / </span> : null}
            {it.href && !last ? (
              <Link href={localizedPath(locale, it.href)}>{it.label}</Link>
            ) : (
              <span>{it.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
