import Link from "next/link";
import { localizedPath } from "@/lib/i18n";
import { resolveConfig, type SiteConfigBundle } from "@/lib/site-config";
import type { FeedArticle } from "./ArticleFeed";

type ArticleGridProps = {
  bundle: SiteConfigBundle | null;
  locale: string;
  articles: FeedArticle[];
  heading?: string;
};

/**
 * 四级模块：资讯卡片网格（列表页）。
 * 配置：config.modules["article-grid"] { enabled, style: card|list, columns, showCover }
 * 未配置 → 组件内置默认；enabled:false → 不渲染。
 */
export default function ArticleGrid({
  bundle,
  locale,
  articles,
  heading,
}: ArticleGridProps) {
  const cfg = resolveConfig(bundle, ["modules", "article-grid"]) || {};
  if (cfg.enabled === false) return null;
  const style = typeof cfg.style === "string" ? cfg.style : "card";
  const columns = typeof cfg.columns === "number" ? cfg.columns : 3;
  const showCover = cfg.showCover !== false;

  if (!Array.isArray(articles) || articles.length === 0) {
    return (
      <section className="module-article-grid">
        {heading ? <h2>{heading}</h2> : null}
        <p>暂无内容</p>
      </section>
    );
  }

  return (
    <section
      className={`module-article-grid style-${style}`}
      style={{ "--grid-columns": columns } as React.CSSProperties}
    >
      {heading ? <h2>{heading}</h2> : null}
      <ul className="article-grid">
        {articles.map((a) => (
          <li key={a.id ?? a.documentId} className="article-grid-item">
            {showCover ? <div className="article-grid-cover" aria-hidden="true" /> : null}
            <Link href={localizedPath(locale, `/articles/${a.slug}`)}>
              {a.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
