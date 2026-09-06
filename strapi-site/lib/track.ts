const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/zhao-website/v1";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem("geo_visitor_id");
  if (!id) {
    id = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem("geo_visitor_id", id);
  }
  return id;
}

export async function trackGeoEvent(payload: {
  type: string;
  targetType?: string;
  targetId?: string;
  dwellTime?: number;
  extra?: Record<string, unknown>;
}): Promise<void> {
  try {
    const body = {
      type: payload.type,
      targetType: payload.targetType || "geo-article",
      targetId: payload.targetId || "",
      visitorId: getVisitorId(),
      dwellTime: payload.dwellTime,
      ...(payload.extra || {}),
    };
    await fetch(`${API_BASE}/interactions/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // 埋点失败静默
  }
}
