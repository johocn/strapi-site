import type { NextConfig } from "next";

/**
 * 静态导出配置：输出到 out/，部署到 openresty 静态站点（www.joho.cn）。
 * 原 /api、/sitemap.xml、/robots.txt、/llms.txt 代理改由 openresty 反向代理承担
 * （next.config rewrites 在 output: export 下不支持）。
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;
