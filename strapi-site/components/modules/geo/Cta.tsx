"use client";
import { trackGeoEvent } from "@/lib/track";
import { jumpMiniProgram } from "@/lib/env";
import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：文末转化（二选一）——download-list 下载选购清单 / consult-appointment 咨询预约。
 * 点击埋点 → 小程序跳转 → H5 fallback。
 */
export default function Cta({ article }: { article: GeoArticle }) {
  if (!article.ctaType || article.ctaType === "none") return null;
  const handle = async () => {
    await trackGeoEvent({ type: "cta_click", targetId: article.articleNo || article.documentId });
    if (article.miniProgramPath && jumpMiniProgram(article.miniProgramPath)) return;
    // H5 fallback
    if (article.ctaType === "download-list") {
      // 完整 URL 规则未定：暂跳列表页；后续可用 vendureProductListId 拼接商品列表链接
      window.open("/geo-articles", "_blank");
    } else {
      document.getElementById("geo-lead-form")?.scrollIntoView({ behavior: "smooth" });
    }
  };
  const label = article.ctaType === "download-list" ? "本地选购清单下载" : "本地一对一咨询预约";
  return <button className="geo-cta" onClick={handle}>{label}</button>;
}
