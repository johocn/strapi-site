import Link from "next/link";
import {
  SECTION_KINDS,
  SECTION_KIND_META,
  sectionCount,
  sectionItemPath,
  sectionKindLabel,
  type Section,
  type SectionItem,
  type SectionKind,
} from "@/lib/section";
import { sectionPath } from "@/lib/section-route";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function ItemList({ items, pathOf }: { items: SectionItem[]; pathOf: (slug: string) => string | null }) {
  if (items.length === 0) return <p>暂无内容</p>;
  return (
    <ul className="article-grid">
      {items.map((item) => {
        const href = pathOf(item.slug);
        return (
          <li key={item.id || item.slug} className="article-grid-item">
            {href ? <Link href={href}>{item.title}</Link> : <span>{item.title}</span>}
          </li>
        );
      })}
    </ul>
  );
}

type SectionCommonProps = {
  section: Section;
  locale: string;
};

/** 板块首页：名称/简介 + 四类入口（含计数）+ 各类内容摘要 + ItemList 结构化数据 */
export function SectionHomeView({
  section,
  locale,
  highlights,
}: SectionCommonProps & {
  highlights: { kind: SectionKind; items: SectionItem[] }[];
}) {
  const canonical = `${SITE_URL}${locale === "en" ? `/en/${section.slug}` : `/${section.slug}`}`;
  const listEntries = highlights.flatMap(({ kind, items }) =>
    items
      .map((item) => ({ name: item.title, path: sectionItemPath(locale, item.slug, kind) }))
      .filter((entry): entry is { name: string; path: string } => !!entry.path)
  );
  const listItems = listEntries.map((entry, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: entry.name,
    url: `${SITE_URL}${entry.path}`,
  }));

  return (
    <main className="section-page">
      <section className="module-article-grid">
        <h2>{section.name}</h2>
        {section.description ? <p>{section.description}</p> : null}
        <ul className="article-grid">
          {SECTION_KINDS.map((kind) => (
            <li key={kind} className="article-grid-item">
              <Link href={sectionPath(locale, section.slug, kind)}>
                {sectionKindLabel(kind, locale)}（{sectionCount(section, kind)}）
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {highlights.map(({ kind, items }) =>
        items.length > 0 ? (
          <section key={kind} className="module-article-grid">
            <h2>{sectionKindLabel(kind, locale)}</h2>
            <ItemList items={items} pathOf={(slug) => sectionItemPath(locale, slug, kind)} />
          </section>
        ) : null
      )}

      {listItems.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: section.name,
              url: canonical,
              numberOfItems: listItems.length,
              itemListElement: listItems,
            }),
          }}
        />
      ) : null}
    </main>
  );
}

/** 板块内列表页：标题 + 内容网格（详情沿用现有扁平路由） */
export function SectionListView({
  section,
  locale,
  kind,
  items,
}: SectionCommonProps & { kind: SectionKind; items: SectionItem[] }) {
  return (
    <main className="section-page">
      <section className="module-article-grid">
        <h2>
          {section.name} · {SECTION_KIND_META[kind][locale === "en" ? "en" : "zh"]}
        </h2>
        <ItemList items={items} pathOf={(slug) => sectionItemPath(locale, slug, kind)} />
      </section>
    </main>
  );
}
