import Link from "next/link";
import { localizedPath } from "@/lib/i18n";
import { resolveConfig, type SiteConfigBundle } from "@/lib/site-config";

type PaginationProps = {
  bundle: SiteConfigBundle | null;
  locale: string;
  basePath: string;
  page: number;
  totalPages: number;
};

/**
 * 四级模块：分页（列表页）。
 * 配置：config.modules.pagination { enabled, style: numbered|load-more }
 * 本期仅实现 numbered；load-more 需交互态，配置时按空态不渲染（内置说明）。
 */
export default function Pagination({
  bundle,
  locale,
  basePath,
  page,
  totalPages,
}: PaginationProps) {
  const cfg = resolveConfig(bundle, ["modules", "pagination"]) || {};
  if (cfg.enabled === false) return null;
  if (!Number.isFinite(totalPages) || totalPages <= 1) return null;
  const style = typeof cfg.style === "string" ? cfg.style : "numbered";
  if (style === "load-more") return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav className="pagination" aria-label="分页">
      {pages.map((p) => (
        <Link
          key={p}
          href={
            p === 1
              ? localizedPath(locale, basePath)
              : localizedPath(locale, `${basePath}${basePath.includes("?") ? "&" : "?"}page=${p}`)
          }
          className={p === page ? "active" : undefined}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
