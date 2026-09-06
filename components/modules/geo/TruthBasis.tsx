import type { GeoArticle } from "@/lib/geo-article";

const STATUS_LABEL: Record<string, string> = {
  verified: "已验证",
  pending: "待验证",
  outdated: "已过期",
  conflict: "存在冲突",
};

/**
 * GEO 模块：权威依据（文章背书的真值声明）。
 */
export default function TruthBasis({ article }: { article: GeoArticle }) {
  const basis = article.truthBasis ?? [];
  if (basis.length === 0) return null;
  return (
    <section className="geo-truth-basis">
      <h2>权威依据</h2>
      <ul>
        {basis.map((t) => (
          <li key={t.id} className="geo-truth-item">
            <div className="geo-truth-claim">{t.claim}</div>
            {t.canonicalValue && <div className="geo-truth-value">权威值：{t.canonicalValue}</div>}
            <div className="geo-truth-meta">
              {t.canonicalSourceUrl ? (
                <a href={t.canonicalSourceUrl} target="_blank" rel="noopener noreferrer">查看来源</a>
              ) : t.canonicalSourceType ? (
                <span>来源类型：{t.canonicalSourceType}</span>
              ) : null}
              {t.verificationStatus && (
                <span className={`geo-truth-badge geo-truth-${t.verificationStatus}`}>
                  {STATUS_LABEL[t.verificationStatus] ?? t.verificationStatus}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
