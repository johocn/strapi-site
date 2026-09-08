import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：作者卡片（author 关系 → 回退 authorName/authorBio 扁平字段）。
 * 姓名/职位/从业年限常显（信任要素）；作者简介折叠（默认收起，内容仍在 HTML 可被爬虫抓取）。
 */
export default function AuthorCard({ article }: { article: GeoArticle }) {
  const author = article.author;
  const name = author?.name || article.authorName;
  const bio = author?.bio || article.authorBio;
  if (!name && !bio) return null;
  return (
    <section className="geo-author-card">
      {author?.avatar?.url && (
        <img src={author.avatar.url} alt={name || "作者"} className="geo-author-avatar" />
      )}
      <div className="geo-author-info">
        {name && <div className="geo-author-name">{name}</div>}
        {(author?.position || author?.experienceYears) && (
          <div className="geo-author-sub">
            {author?.position && <span className="geo-author-position">{author.position}</span>}
            {author?.experienceYears ? (
              <span className="geo-author-exp">从业 {author.experienceYears} 年</span>
            ) : null}
          </div>
        )}
        {bio && (
          <details className="geo-collapse">
            <summary className="geo-collapse-summary">查看作者简介</summary>
            <p className="geo-author-bio">{bio}</p>
          </details>
        )}
      </div>
    </section>
  );
}
