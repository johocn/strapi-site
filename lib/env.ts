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

export function jumpMiniProgram(path: string): boolean {
  if (typeof window === "undefined") return false;
  const wx = (window as any).wx;
  if (isWechatWebView() && wx?.miniProgram?.navigateTo) {
    wx.miniProgram.navigateTo({ url: path });
    return true;
  }
  return false;
}
