import PageLayout from "@/components/layout/PageLayout";
import NamespaceList, { NamespaceItem } from "@/components/lists/NamespaceList";
import { k8sFetch } from "@/lib/k8s";
import { requirePageSession } from "@/lib/require-page-session";

export const dynamic = "force-dynamic";

type NamespaceResponse = {
  items?: Array<{
    metadata?: {
      uid?: string;
      name?: string;
      creationTimestamp?: string;
    };
    status?: {
      phase?: string;
    };
  }>;
};

export default async function NamespacePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageSession();

  const { id } = await params;
  let initialData: NamespaceItem[] = [];

  try {
    const result = (await k8sFetch("/api/v1/namespaces")) as NamespaceResponse;
    if (Array.isArray(result.items)) {
      initialData = result.items.map((item, index) => ({
        key: item.metadata?.uid || `ns-${index}`,
        name: item.metadata?.name || "",
        status: item.status?.phase || "Unknown",
        creationTimestamp: item.metadata?.creationTimestamp || new Date().toISOString(),
      }));
    }
  } catch (error) {
    console.error("Failed to fetch namespaces for namespace page:", error);
  }

  return (
    <PageLayout selectedKey="namespace" clusterId={id}>
      <NamespaceList clusterId={id} initialData={initialData} initialLoaded />
    </PageLayout>
  );
}
