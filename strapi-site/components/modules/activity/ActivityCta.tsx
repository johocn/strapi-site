"use client";
import { useEffect, useState } from "react";
import type { ActivityCard } from "@/lib/activity";

/**
 * 活动报名 CTA（Client Component）：
 * 以活动快照渲染，30s 轮询 + visibilitychange 刷新实时名额；失败 setError(true) 保留快照不阻断。
 */
export default function ActivityCta({ activity }: { activity: ActivityCard }) {
  const [snapshot, setSnapshot] = useState<ActivityCard>(activity);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/zhao-point/v1/activities/${activity.documentId}`);
        if (!res.ok) throw new Error("fetch failed");
        const body = await res.json();
        if (body?.data && !cancelled) setSnapshot(body.data);
      } catch {
        if (!cancelled) setError(true);
      }
    };
    load();
    const timer = setInterval(load, 30000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [activity.documentId]);

  const cap =
    typeof snapshot.capacity === "number" && snapshot.capacity > 0 ? snapshot.capacity : 0;
  const used =
    typeof snapshot.usedCapacity === "number" && snapshot.usedCapacity > 0
      ? snapshot.usedCapacity
      : 0;
  // left 为 undefined 表示名额未知（未配置 capacity），不按售罄处理
  const left = cap > 0 ? Math.max(cap - used, 0) : undefined;
  const soldOut = typeof left === "number" && left <= 0;
  const detailHref = `https://v.joho.cn/pages/activity/detail?id=${activity.documentId}`;

  return (
    <section className="activity-cta">
      {cap > 0 && (
        <p className="activity-cta-seats">{left! > 0 ? `剩余名额 ${left}` : "已报满"}</p>
      )}
      <div className="activity-cta-buttons">
        {soldOut ? (
          <a
            className="geo-cta disabled"
            href="#"
            aria-disabled="true"
            onClick={(e) => e.preventDefault()}
          >
            已报满
          </a>
        ) : (
          <a className="geo-cta" href={detailHref} target="_blank" rel="noopener noreferrer">
            去报名
          </a>
        )}
        <a
          className="geo-cta geo-cta-ghost"
          href={detailHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          活动详情与咨询
        </a>
      </div>
      {error && <p className="activity-cta-error">名额信息获取失败，请以页面展示为准</p>}
    </section>
  );
}
