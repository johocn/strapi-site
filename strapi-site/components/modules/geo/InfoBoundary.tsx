import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：信息边界（infoBoundary）与统计数据范围（businessData：period/caliber/content）。
 * 任一非空才渲染。
 */
export default function InfoBoundary({ article }: { article: GeoArticle }) {
  const hasBoundary = !!article.infoBoundary?.trim();
  const items = Array.isArray(article.businessData)
    ? article.businessData.filter((d) => d && (d.period || d.content || d.caliber))
    : [];
  if (!hasBoundary && items.length === 0) return null;
  return (
    <section className="geo-info-boundary">
      {hasBoundary && (
        <div className="geo-info-boundary-block">
          <h2>信息边界</h2>
          <p>{article.infoBoundary}</p>
        </div>
      )}
      {items.length > 0 && (
        <div className="geo-info-boundary-block">
          <h2>统计数据范围</h2>
          <ul>
            {items.map((d, i) => (
              <li key={i}>
                {d.period && <span className="geo-info-boundary-item">统计周期：{d.period}</span>}
                {d.caliber && <span className="geo-info-boundary-item">统计口径：{d.caliber}</span>}
                {d.content && <p className="geo-info-boundary-content">{d.content}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
