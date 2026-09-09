import type { GeoArticle } from "@/lib/geo-article";

const STATUS_LABEL: Record<string, string> = {
  verified: "已验证",
  pending: "待验证",
  outdated: "已过期",
  conflict: "存在冲突",
};

/** 无绑定数据时的兜底展示条数 */
const FALLBACK_VISIBLE = 3;

/**
 * GEO 模块：权威依据（文章背书的真值声明）。
 * 用户侧：一行总述 + 折叠详情（仅已绑定正文段落的依据，标注对应段落）。
 * AI 侧：全部真值声明仍在 SSR HTML 中（含未绑定/通用定义），SEO 爬虫可抓取完整数据。
 */
export default function TruthBasis({ article }: { article: GeoArticle }) {
  const basis = article.truthBasis ?? [];
  if (basis.length === 0) return null;

  const sections = article.truthBasisSections ?? [];
  const sectionByKey = new Map(
    sections.filter((s) => s?.claimKey && s?.section).map((s) => [s.claimKey, s.section])
  );
  const bound = basis.filter((t) => t.claimKey && sectionByKey.has(t.claimKey));
  const unbound = basis.filter((t) => !(t.claimKey && sectionByKey.has(t.claimKey)));
  const visible = bound.length > 0 ? bound : unbound.slice(0, FALLBACK_VISIBLE);
  const summarySource = article.sourceName || "相关权威政策文件";
  const summaryCount = bound.length > 0 ? bound.length : basis.length;

  return (
    <section className="geo-truth-basis">
      <h2>权威依据</h2>
      <p className="geo-truth-summary">
        本文观点参考{summarySource}，配套 {summaryCount} 条核心依据。
      </p>
      <details className="geo-collapse">
        <summary className="geo-collapse-summary">
          {bound.length > 0 ? `查看全部依据（${basis.length} 条）` : `查看真值声明（${basis.length} 条）`}
        </summary>
        <ul>
          {visible.map((t) => {
            const section = t.claimKey ? sectionByKey.get(t.claimKey) : undefined;
            return (
              <li key={t.id} className="geo-truth-item">
                {section && <div className="geo-truth-section">对应：{section}</div>}
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
            );
          })}
          {unbound.length > 0 && bound.length > 0 && (
            <li className="geo-truth-item geo-truth-unbound">
              <details className="geo-collapse-inner">
                <summary>另有 {unbound.length} 条支撑声明（点击展开）</summary>
                {unbound.map((t) => (
                  <div key={t.id} className="geo-truth-claim">{t.claim}</div>
                ))}
              </details>
            </li>
          )}
        </ul>
      </details>
    </section>
  );
}
