import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：金融风险提示条（isFinance 时置顶展示，不可折叠）。
 */
export default function RiskTip({ article }: { article: GeoArticle }) {
  if (!article.isFinance) return null;
  const text = article.riskDisclaimer || "仅供学习，不构成投资建议。市场有风险，决策需谨慎。";
  return (
    <aside className="geo-risk-tip" role="alert" aria-live="polite">
      <span className="geo-risk-tip-label">风险提示</span>
      <p>{text}</p>
    </aside>
  );
}
