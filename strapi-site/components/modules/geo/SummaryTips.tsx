import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：核心要点（summaryPoints）与本地贴士（localTips）两个子块，
 * 任一非空才渲染，两个子块各自独立。
 */
export default function SummaryTips({ article }: { article: GeoArticle }) {
  const hasSummary = !!article.summaryPoints?.trim();
  const hasLocal = !!article.localTips?.trim();
  if (!hasSummary && !hasLocal) return null;
  return (
    <section className="geo-summary-tips">
      {hasSummary && (
        <div className="geo-summary-tips-block">
          <h2>核心要点</h2>
          <p>{article.summaryPoints}</p>
        </div>
      )}
      {hasLocal && (
        <div className="geo-summary-tips-block">
          <h2>本地贴士</h2>
          <p>{article.localTips}</p>
        </div>
      )}
    </section>
  );
}
