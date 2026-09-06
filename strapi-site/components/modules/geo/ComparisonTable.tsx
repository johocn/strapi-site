import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：对比评测表（local-comparison 的 comparisonData 评分维度）。
 */
export default function ComparisonTable({ article }: { article: GeoArticle }) {
  const dims = article.comparisonData ?? [];
  if (dims.length === 0) return null;
  const rows = dims.flatMap((d) => (d.items ?? []).map((it) => ({ dimension: d.dimension, ...it })));
  return (
    <section className="geo-comparison">
      <h2>对比评测</h2>
      <div className="geo-table-wrap">
        <table className="geo-comparison-table">
          <thead>
            <tr><th>维度</th><th>选项</th><th>评分</th><th>说明</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.dimension}</td>
                <td>{r.name}</td>
                <td>{r.score}</td>
                <td>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
