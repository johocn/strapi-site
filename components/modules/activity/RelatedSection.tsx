import type { ActivityCard, ActivityOverrideItem, RelatedGroup } from "@/lib/activity";

/** 类型展示顺序 */
const TYPE_ORDER = [
  "activity",
  "article",
  "case",
  "product",
  "faq",
  "course",
  "lesson",
  "tutorial",
  "geoArticle",
];

const TYPE_LABELS: Record<string, string> = {
  activity: "相关活动",
  article: "相关文章",
  case: "相关案例",
  product: "相关产品",
  faq: "相关FAQ",
  course: "相关课程",
  lesson: "相关课时",
  tutorial: "相关教程",
  geoArticle: "相关文章",
};

/** relatedOverride 键名 → 展示类型键名（管理端"文章"数据源为 GEO 文章，映射到 geoArticle 类型） */
const OVERRIDE_KEYS: Record<string, string> = {
  activities: "activity",
  articles: "geoArticle",
  cases: "case",
  products: "product",
  faqs: "faq",
  courses: "course",
  lessons: "lesson",
  tutorials: "tutorial",
};

/** GEO 文章类型 → 落地页路由前缀（与 geo-article 数据层 resolveGeoRoutePrefix 一致） */
function geoArticlePrefix(type?: string): string {
  return type === "geo-faq" ? "/geo-faq" :
    type === "local-report" ? "/local-report" :
    type === "local-comparison" ? "/local-comparison" :
    type === "local-list" ? "/local-list" : "/geo-article";
}

/** override 项 → 卡片项：GEO 文章（有 slug）构建落地页 URL，其余按已存 url */
function overrideToCard(item: ActivityOverrideItem): CardItem {
  const hasGeoUrl = item.slug && !item.url;
  const url = item.url
    || (hasGeoUrl ? `https://www.joho.cn${geoArticlePrefix(item.type)}/${encodeURIComponent(item.slug!)}` : "")
    || "";
  return { title: item.title, summary: item.summary, url };
}

type CardItem = { title?: string; summary?: string; url?: string };

function RelatedCard({ item }: { item: CardItem }) {
  const title = item.title || "未命名";
  if (item.url) {
    return (
      <a className="related-card" href={item.url} target="_blank" rel="noopener noreferrer">
        <h3 className="related-card-title">{title}</h3>
        {item.summary && <p className="related-card-summary">{item.summary}</p>}
        <span className="related-card-action">查看详情</span>
      </a>
    );
  }
  return (
    <div className="related-card">
      <h3 className="related-card-title">{title}</h3>
      {item.summary && <p className="related-card-summary">{item.summary}</p>}
      <span className="related-card-action is-placeholder">即将上线</span>
    </div>
  );
}

/** 标签联动相关区块（Server Component）：类型分组卡片；relatedOverride 优先于标签聚合 */
export default function RelatedSection({
  activity,
  related,
}: {
  activity: ActivityCard;
  related: RelatedGroup;
}) {
  // 活动级开关：showRelatedSection === false 时整体不渲染
  if (activity.showRelatedSection === false) return null;

  const override = activity.relatedOverride ?? {};
  const hasOverride = Object.values(override).some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );

  const groups: { type: string; items: CardItem[] }[] = [];
  if (hasOverride) {
    for (const key of TYPE_ORDER) {
      const overrideKey = Object.keys(OVERRIDE_KEYS).find((k) => OVERRIDE_KEYS[k] === key);
      const items = overrideKey ? (override as Record<string, unknown>)[overrideKey] : [];
      if (Array.isArray(items) && items.length > 0) {
        groups.push({ type: key, items: (items as ActivityOverrideItem[]).map(overrideToCard) });
      }
    }
  } else {
    for (const key of TYPE_ORDER) {
      const items = related[key];
      if (Array.isArray(items) && items.length > 0) {
        groups.push({
          type: key,
          items: items.map((it) => ({
            title: it?.title,
            summary: it?.summary,
            url: it?.url,
          })),
        });
      }
    }
  }

  // 全部类型为空：渲染占位
  if (groups.length === 0) {
    return (
      <section className="activity-related">
        <p className="activity-related-empty">暂无相关内容</p>
      </section>
    );
  }

  return (
    <section className="activity-related">
      {groups.map((g) => (
        <div key={g.type} className="activity-related-group">
          <h2 className="activity-related-title">{TYPE_LABELS[g.type] ?? "相关"}</h2>
          <div className="card-grid">
            {g.items.map((it, i) => (
              <RelatedCard key={i} item={it} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
