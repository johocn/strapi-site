"use client";
import { useState, type FormEvent } from "react";
import { trackGeoEvent } from "@/lib/track";
import type { GeoArticle } from "@/lib/geo-article";

const POINT_API = "/api/zhao-point/v1/my/point/earn/action";
const LEAD_API = "/api/zhao-website/v1/leads/submit";

/**
 * GEO 模块：留资表单（honeypot website 字段留空）+ 提交后发放阅读积分（readPoints 覆盖，失败静默）。
 */
export default function LeadForm({ article }: { article: GeoArticle }) {
  const [phone, setPhone] = useState("");
  const [intent, setIntent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [points, setPoints] = useState<number | null>(null);

  if (!article.leadFormEnabled) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^1\d{10}$/.test(phone)) { setStatus("error"); return; }
    setStatus("loading");
    try {
      // honeypot 字段留空；type=geo_lead 关联文章 documentId
      await fetch(LEAD_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, intent, website: "", type: "geo_lead", targetId: article.documentId }),
      });
      await trackGeoEvent({ type: "lead_submit", targetId: article.articleNo || article.documentId });
      // 发放阅读积分（readPoints 覆盖），未登录或规则限制失败不阻塞
      try {
        const res = await fetch(POINT_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "geo_article_lead",
            source: "geo",
            points: article.readPoints || undefined,
            remark: `GEO 文章留资 ${article.title}`,
          }),
        });
        const json = await res.json();
        if (res.ok && json?.points) setPoints(json.points);
      } catch { /* 静默 */ }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="geo-lead-form" className="geo-lead-form">
      <h2>获取一对一咨询</h2>
      {status === "done" ? (
        <p className="geo-lead-done">提交成功{points ? `，已发放 ${points} 积分` : ""}</p>
      ) : (
        <form onSubmit={submit}>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="手机号" required />
          <select value={intent} onChange={(e) => setIntent(e.target.value)} required>
            <option value="">选择意向</option>
            <option value="purchase">本地选购</option>
            <option value="consult">一对一咨询</option>
            <option value="other">其他</option>
          </select>
          <button disabled={status === "loading"}>{status === "loading" ? "提交中…" : "提交"}</button>
          {status === "error" && <p className="geo-lead-error">提交失败，请检查手机号后重试</p>}
        </form>
      )}
    </section>
  );
}
