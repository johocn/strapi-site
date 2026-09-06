/**
 * 构建期环境变量统一入口。
 *
 * 静态导出（output: export）模式下关键区分：
 * - SITE_URL（公开 URL）：写入 HTML 的 canonical/hreflang 等 SEO 输出，必须为线上域名（如 https://www.joho.cn）
 * - API_ORIGIN（构建/运行时数据源）：服务端 fetch 的绝对基址；构建时指向构建机可达的 Strapi（本地 :1337 或 SSH 隧道），
 *   运行时客户端请求走同源相对路径 /api/*（由 openresty 反代），不经过此变量。
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || SITE_URL;
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/zhao-website/v1";
export const API_ROOT = `${API_ORIGIN}${API_BASE}`;

/** 是否微信 WebView（公众号/小程序 H5）环境 */
export function isWechatWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("micromessenger")) return true;
  if (ua.includes("wechatdevtools") || ua.includes("miniprogram")) return true;
  if (typeof window !== "undefined") {
    if ((window as any).__wxConfig || (window as any).__wxInfo) return true;
    if (window.location.href.includes("servicewechat.com")) return true;
  }
  return false;
}

/** WebView 场景跳转小程序原生页面（公众号内嵌页 CTA 使用） */
export function jumpMiniProgram(path: string): boolean {
  if (typeof window === "undefined") return false;
  const wx = (window as any).wx;
  if (isWechatWebView() && wx?.miniProgram?.navigateTo) {
    wx.miniProgram.navigateTo({ url: path });
    return true;
  }
  return false;
}
