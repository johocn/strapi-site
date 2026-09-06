"use client";
import { useEffect, useRef } from "react";
import type { GeoArticle } from "@/lib/geo-article";

/**
 * GEO 模块：正文（客户端增强）。
 * 图片懒加载：服务端输出 data-src，客户端补 src。
 * 大表格分页：超过 10 行加 geo-table-paged 类，由客户端增强处理分页。
 */
export default function GeoBody({ article }: { article: GeoArticle }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    // 图片懒加载
    root.querySelectorAll("img[data-src]").forEach((img) => {
      const el = img as HTMLImageElement;
      if (el.dataset.src) el.src = el.dataset.src;
    });
    // 大表格分页：超过 10 行拆页
    root.querySelectorAll("table").forEach((table) => {
      if (table.querySelectorAll("tr").length > 10) {
        table.classList.add("geo-table-paged");
      }
    });
  }, [article]);
  return (
    <section
      ref={ref}
      className="geo-body"
      dangerouslySetInnerHTML={{ __html: article.content || "" }}
    />
  );
}
