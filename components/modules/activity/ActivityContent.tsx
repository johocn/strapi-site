import type { ActivityCard } from "@/lib/activity";

/** 活动正文（Server Component）：描述按段落分割 + 讲师卡片；两者皆空时返回 null */
export default function ActivityContent({ activity }: { activity: ActivityCard }) {
  const paragraphs = (activity.description ?? "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lecturer = Array.isArray(activity.lecturer)
    ? activity.lecturer[0]
    : activity.lecturer;
  const hasLecturer = !!lecturer?.name;
  if (paragraphs.length === 0 && !hasLecturer) return null;

  return (
    <section className="activity-content">
      {paragraphs.length > 0 && (
        <div className="activity-desc">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {hasLecturer && (
        <div className="activity-lecturer">
          <span className="activity-lecturer-label">讲师</span>
          <span className="activity-lecturer-name">{lecturer.name}</span>
          {lecturer.position && (
            <span className="activity-lecturer-position">{lecturer.position}</span>
          )}
        </div>
      )}
    </section>
  );
}
