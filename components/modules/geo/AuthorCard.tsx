import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：作者卡片（author 关系 → 回退 authorName/authorBio 扁平字段）。
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
        {author?.position && <div className="geo-author-position">{author.position}</div>}
        {author?.experienceYears ? <div className="geo-author-exp">从业 {author.experienceYears} 年</div> : null}
        {bio && <p className="geo-author-bio">{bio}</p>}
      </div>
    </section>
  );
}
