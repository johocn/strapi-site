import type { Metadata } from "next";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { getSiteConfig } from "@/lib/site-config";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "joho.cn",
    template: "%s",
  },
  description: "zhao-site C 端官网（Next.js）",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // 静态导出：无 middleware/x-locale header，html lang 取默认语言
  // 构建期拉取站点配置，渲染全局站点级结构化数据（fetch 走 Next 默认缓存，构建时执行一次）
  const bundle = await getSiteConfig(SITE_URL);
  const siteName = bundle?.site?.siteName || "joho.cn";

  const siteJsonLd = [
    { "@context": "https://schema.org", "@type": "Organization", name: siteName, url: SITE_URL },
    { "@context": "https://schema.org", "@type": "WebSite", name: siteName, url: SITE_URL },
  ];

  return (
    <html lang={DEFAULT_LOCALE}>
      <body>
        {/* 站点级结构化数据：Organization + WebSite（全站通用，避免各页面重复渲染） */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // 防 </script> 闭合注入：先转义 < 再注入，不影响 JSON 合法性
            __html: JSON.stringify(siteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
