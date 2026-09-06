import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：权威来源（sourceName/sourceUrl/sourcePublishedAt）。
 */
export default function Citation({ article }: { article: GeoArticle }) {
  if (!article.sourceName && !article.sourceUrl && !article.sourcePublishedAt) return null;
  return (
    <section className="geo-citation">
      <h2>权威来源</h2>
      <dl>
        {article.sourceName && <dt>来源</dt>}
        {article.sourceName && <dd>{article.sourceName}</dd>}
        {article.sourcePublishedAt && <dt>发布时间</dt>}
        {article.sourcePublishedAt && (
          <dd>{new Date(article.sourcePublishedAt).toLocaleDateString("zh-CN")}</dd>
        )}
        {article.sourceUrl && (
          <dd>
            <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">查看公开信源</a>
          </dd>
        )}
      </dl>
    </section>
  );
}
