import type { ActivityCard } from "@/lib/activity";
import { formatActivityTime } from "@/lib/activity";

/** 状态徽章映射：文案 + 样式修饰 */
const STATUS_BADGE: Record<string, { text: string; cls: string }> = {
  signup_open: { text: "报名中", cls: "ok" },
  ongoing: { text: "进行中", cls: "warn" },
  ended: { text: "已结束", cls: "muted" },
};

/** 活动头部（Server Component）：封面 + 状态徽章 + 标题 + meta */
export default function ActivityHero({ activity }: { activity: ActivityCard }) {
  const coverUrl = activity.promoAssets?.cover?.url || null;
  const badge = activity.status ? STATUS_BADGE[activity.status] : null;
  const timeLine =
    activity.startTime || activity.endTime
      ? `${formatActivityTime(activity.startTime)} ~ ${formatActivityTime(activity.endTime)}`
      : null;

  return (
    <header className="activity-hero">
      <div className="activity-hero-cover">
        {coverUrl ? (
          <img className="activity-hero-img" src={coverUrl} alt={activity.title ?? "活动"} />
        ) : (
          <div className="activity-cover-fallback">活动海报</div>
        )}
      </div>
      <div className="activity-hero-info">
        {badge && (
          <div className="activity-badges">
            <span className={`activity-status ${badge.cls}`}>{badge.text}</span>
          </div>
        )}
        <h1 className="activity-hero-title">{activity.title}</h1>
        <ul className="activity-meta">
          {timeLine && <li>🕒 {timeLine}</li>}
          {activity.venueName && <li>📍 {activity.venueName}</li>}
          {typeof activity.capacity === "number" && activity.capacity > 0 && (
            <li>🎟 名额 {activity.capacity}</li>
          )}
        </ul>
      </div>
    </header>
  );
}
