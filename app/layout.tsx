import type { Metadata } from "next";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "joho.cn",
    template: "%s",
  },
  description: "zhao-site C 端官网（Next.js）",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // 静态导出：无 middleware/x-locale header，html lang 取默认语言
  return (
    <html lang={DEFAULT_LOCALE}>
      <body>{children}</body>
    </html>
  );
}
