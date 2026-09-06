import Link from "next/link";
import { localizedPath } from "@/lib/i18n";
import { resolveConfig, type SiteConfigBundle } from "@/lib/site-config";

export type FeedArticle = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
};

type ArticleFeedProps = {
  bundle: SiteConfigBundle | null;
  locale: string;
  articles: FeedArticle[];
  heading?: string;
};

/**
 * 四级模块：资讯信息流（首页精选）。
 * 配置：config.modules["article-feed"] { enabled, style: card|compact, columns }
 * 未配置 → 组件内置默认；enabled:false → 不渲染；无数据 → 空态文案。
 */
export default function ArticleFeed({
  bundle,
  locale,
  articles,
  heading = "精选资讯",
}: ArticleFeedProps) {
  const cfg = resolveConfig(bundle, ["modules", "article-feed"]) || {};
  if (cfg.enabled === false) return null;
  const style = typeof cfg.style === "string" ? cfg.style : "card";
  const columns = typeof cfg.columns === "number" ? cfg.columns : 1;

  if (!Array.isArray(articles) || articles.length === 0) {
    return (
      <section className="articles module-article-feed">
        <h2>{heading}</h2>
        <p>暂无精选文章（或本地库未录入内容）</p>
      </section>
    );
  }

  return (
    <section
      className={`articles module-article-feed style-${style}`}
      style={{ "--feed-columns": columns } as React.CSSProperties}
    >
      <h2>{heading}</h2>
      <ul className="article-feed-list">
        {articles.map((a) => (
          <li key={a.id ?? a.documentId}>
            <Link href={localizedPath(locale, `/articles/${a.slug}`)}>
              {a.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
