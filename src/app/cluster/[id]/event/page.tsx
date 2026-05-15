import PageLayout from "@/components/layout/PageLayout";
import EventList, { EventItem } from "@/components/lists/EventList";
import { k8sFetch } from "@/lib/k8s";
import type { K8sEvent } from "@/types/k8s";
import { requirePageSession } from "@/lib/require-page-session";

export const dynamic = "force-dynamic";

type EventResponse = {
  items?: K8sEvent[];
};

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePageSession(`/cluster/${id}/event`);

  let initialData: EventItem[] = [];

  try {
    const result = (await k8sFetch("/api/v1/events")) as EventResponse;
    if (Array.isArray(result.items)) {
      initialData = result.items.map((item, index) => ({
        key: item.metadata?.uid || `event-${index}`,
        type: item.type || item.reason || "Normal",
        resourceType: item.involvedObject?.kind || "",
        resourceName: item.involvedObject?.name || "",
        message: item.message || "",
        creationTimestamp: item.metadata?.creationTimestamp || new Date().toISOString(),
      }));
    }
  } catch (error) {
    console.error("Failed to fetch initial event page data:", error);
  }

  return (
    <PageLayout selectedKey="event" clusterId={id}>
      <EventList initialData={initialData} initialLoaded />
    </PageLayout>
  );
}
