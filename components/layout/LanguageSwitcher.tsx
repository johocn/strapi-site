"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DEFAULT_LOCALE,
  localizedPath,
  normalizeLocale,
  SUPPORTED_LOCALES,
  UI_STRINGS,
} from "@/lib/i18n";

type LanguageSwitcherProps = {
  locale: string;
};

/**
 * 语言切换器：生成同路径其他语言链接（纯 URL 导航，无 Cookie 记忆）。
 * 当前路径取自 usePathname()（默认语言经 middleware rewrite 后内部路径为 /zh-CN/...，
 * 去掉语言段即得业务路径，再经 localizedPath 生成目标语言 URL）。
 */
export default function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const base = "/" + segments.filter((s) => !normalizeLocale(s)).join("/");

  const alternatives = SUPPORTED_LOCALES.filter((l) => l !== locale);
  if (alternatives.length === 0) return null;

  return (
    <nav className="language-switcher" aria-label="Language">
      {alternatives.map((alt) => (
        <Link key={alt} href={localizedPath(alt, base)}>
          {UI_STRINGS[alt]?.langName ?? (alt === DEFAULT_LOCALE ? "中文" : alt)}
        </Link>
      ))}
    </nav>
  );
}
