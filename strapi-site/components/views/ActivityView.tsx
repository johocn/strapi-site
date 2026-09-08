import type { ActivityCard, RelatedGroup } from "@/lib/activity";
import ActivityHero from "@/components/modules/activity/ActivityHero";
import ActivityContent from "@/components/modules/activity/ActivityContent";
import RelatedSection from "@/components/modules/activity/RelatedSection";
import ActivityCta from "@/components/modules/activity/ActivityCta";

/** 活动详情页视图（Server Component）：Hero + 内容 + 标签联动相关 + CTA + Event JSON-LD */
export default function ActivityView({
  activity,
  related,
}: {
  activity: ActivityCard;
  related: RelatedGroup;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: activity.title,
    startDate: activity.startTime,
    endDate: activity.endTime,
    location: {
      "@type": "Place",
      name: activity.venueName || "待定",
    },
  };
  return (
    <main className="activity-page">
      <ActivityHero activity={activity} />
      <ActivityContent activity={activity} />
      <RelatedSection activity={activity} related={related} />
      <ActivityCta activity={activity} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
