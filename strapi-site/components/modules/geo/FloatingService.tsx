"use client";
import { trackGeoEvent } from "@/lib/track";
import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：悬浮客服入口（customerServiceUrl 由视图层从 bundle 配置传入）。
 */
export default function FloatingService({
  customerServiceUrl,
  article,
}: {
  customerServiceUrl?: string;
  article?: GeoArticle;
}) {
  if (!customerServiceUrl) return null;
  const click = async () => {
    await trackGeoEvent({ type: "customer_service_click", targetId: article?.articleNo || article?.documentId });
    window.open(customerServiceUrl, "_blank");
  };
  return (
    <button className="geo-floating-service" onClick={click} aria-label="在线咨询">
      咨询
    </button>
  );
}
