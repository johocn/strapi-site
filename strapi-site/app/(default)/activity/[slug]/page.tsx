import type { Metadata } from "next";
import { SITE_URL } from "@/lib/env";
import { getActivity, getRelatedByTags, listActivityDocumentIds } from "@/lib/activity";
import ActivityView from "@/components/views/ActivityView";

/** 静态导出：禁止动态渲染 */
export const dynamic = "error";

/** 静态导出：slug 参数值 = documentId */
export async function generateStaticParams() {
  return (await listActivityDocumentIds()).map((d) => ({ slug: d }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { activity } = await getActivity(slug);
  if (!activity?.documentId) return { title: "活动不存在" };
  return {
    title: activity.title,
    description: activity.description?.slice(0, 150),
    alternates: { canonical: `${SITE_URL}/activity/${activity.documentId}` },
  };
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { activity } = await getActivity(slug);
  if (!activity) {
    return (
      <main className="geo-page">
        <p>活动不存在或已下线</p>
      </main>
    );
  }
  const tagIds = (activity.tags ?? [])
    .map((t) => t.documentId)
    .filter(Boolean) as string[];
  const related = await getRelatedByTags(tagIds);
  return <ActivityView activity={activity} related={related} />;
}
