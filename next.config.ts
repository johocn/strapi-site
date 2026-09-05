import type { NextConfig } from "next";

const API_UPSTREAM = "http://localhost:1337/api";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_UPSTREAM}/:path*` },
      { source: "/sitemap.xml", destination: `${API_UPSTREAM}/zhao-website/v1/sitemap.xml` },
      { source: "/robots.txt", destination: `${API_UPSTREAM}/zhao-website/v1/robots.txt` },
      { source: "/llms.txt", destination: `${API_UPSTREAM}/zhao-website/v1/llms.txt` },
    ];
  },
};

export default nextConfig;
