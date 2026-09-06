"use client";
import { useEffect, useRef } from "react";
import { trackGeoEvent } from "@/lib/track";

export default function GeoAnalytics({ article }: { article: any }) {
  const startRef = useRef<number>(Date.now());
  const rewardedRef = useRef(false);

  useEffect(() => {
    trackGeoEvent({ type: "page_view", targetId: article.articleNo });
    const report = () => {
      const dwell = Math.round((Date.now() - startRef.current) / 1000);
      trackGeoEvent({ type: "dwell_time", targetId: article.articleNo, dwellTime: dwell });
    };
    // 阅读时长达标（30s）→ 发放阅读积分（仅一次）
    const timer = window.setTimeout(async () => {
      if (rewardedRef.current || !article.readPoints) return;
      rewardedRef.current = true;
      try {
        await fetch("/api/zhao-point/v1/my/point/earn/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "geo_article_read", source: "geo", points: article.readPoints, remark: `GEO 文章阅读 ${article.title}` }),
        });
      } catch { /* 未登录/规则限制静默 */ }
    }, 30_000);
    window.addEventListener("pagehide", report);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", report);
      report();
    };
  }, [article]);

  return null;
}
