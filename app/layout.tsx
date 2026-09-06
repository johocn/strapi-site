import type { Metadata } from "next";
import { headers } from "next/headers";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "strapi-site",
    template: "%s | strapi-site",
  },
  description: "zhao-site C 端官网（Next.js）",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // middleware 已设置 x-locale（无前缀请求经 rewrite 也带该 header）
  const headersList = await headers();
  const locale = headersList.get("x-locale") ?? DEFAULT_LOCALE;
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
