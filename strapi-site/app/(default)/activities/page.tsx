import type { Metadata } from "next";
import { SITE_URL } from "@/lib/env";
import { formatActivityTime, listActivities } from "@/lib/activity";

/** 静态导出：禁止动态渲染 */
export const dynamic = "error";

export const metadata: Metadata = {
  title: "线下活动",
  alternates: { canonical: `${SITE_URL}/activities` },
};

export default async function ActivitiesPage() {
  const activities = await listActivities();
  if (activities.length === 0) return <p>暂无活动</p>;
  return (
    <main className="activity-page">
      <div className="activity-list">
        {activities.map((a) => (
          <a key={a.documentId} className="activity-card" href={`/activity/${a.documentId}`}>
            <h2 className="activity-card-title">{a.title}</h2>
            <p className="activity-card-meta">
              <span>📅 {formatActivityTime(a.startTime)}</span>
              <span>📍 {a.venueName || "待定场地"}</span>
            </p>
          </a>
        ))}
      </div>
    </main>
  );
}
