import type { GeoArticle } from "@/lib/geo-article";

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("zh-CN");
}

/**
 * GEO 模块：大标题 + 元信息行（发布时间/更新时间/编号/作者/作者简介）。
 */
export default function GeoHeader({ article }: { article: GeoArticle }) {
  const title = article.type === "geo-faq" ? article.faqQuestion || article.title : article.title;
  if (!title) return null;
  const authorName = article.author?.name || article.authorName;
  const authorBio = article.author?.bio || article.authorBio;
  const meta = [
    article.publishedAt ? `发布时间 ${formatDate(article.publishedAt)}` : "",
    article.updatedAt ? `更新时间 ${formatDate(article.updatedAt)}` : "",
    article.articleNo ? `编号 ${article.articleNo}` : "",
    authorName ? `作者 ${authorName}` : "",
    authorBio ? authorBio : "",
    article.reviewerName || article.reviewedAt
      ? `审核 ${article.reviewerName || ""}${article.reviewedAt ? ` ${formatDate(article.reviewedAt)}` : ""}`
      : "",
  ].filter(Boolean);
  return (
    <header className="geo-header">
      <h1 className="geo-header-title">{title}</h1>
      {meta.length > 0 && (
        <div className="geo-header-meta">
          {meta.map((m, i) => (
            <span key={i} className="geo-header-meta-item">{m}</span>
          ))}
        </div>
      )}
    </header>
  );
}
