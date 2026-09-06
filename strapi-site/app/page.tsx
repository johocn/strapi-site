import Link from "next/link";

export const dynamic = "force-dynamic";

type SiteInfo = {
  siteName: string;
  siteDescription: string;
  domain: string;
};

type Article = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/zhao-website/v1";
// 服务端组件 fetch 必须用绝对 URL（相对路径由代理在 :3000 层解析）
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const API_ROOT = `${SITE_URL}${API_BASE}`;

async function getSiteInfo(): Promise<SiteInfo | null> {
  try {
    const res = await fetch(`${API_ROOT}/site-info`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getFeaturedArticles(): Promise<Article[]> {
  try {
    const res = await fetch(`${API_ROOT}/articles/featured`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.results ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [site, articles] = await Promise.all([
    getSiteInfo(),
    getFeaturedArticles(),
  ]);

  return (
    <main className="home">
      <header className="hero">
        <h1>{site?.siteName ?? "strapi-site"}</h1>
        <p>{site?.siteDescription ?? "环境验证页：未获取到站点配置"}</p>
      </header>
      <section className="articles">
        <h2>精选资讯</h2>
        {articles.length === 0 ? (
          <p>暂无精选文章（或本地库未录入内容）</p>
        ) : (
          <ul>
            {articles.map((a) => (
              <li key={a.id ?? a.documentId}>
                <Link href={`/articles/${a.slug}`}>{a.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
