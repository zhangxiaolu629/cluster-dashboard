import PageLayout from "@/components/layout/PageLayout";
import StatefulSetList, { StatefulSetItem } from "@/components/lists/StatefulSetList";
import { k8sFetch } from "@/lib/k8s";
import { requireAuthenticatedPage } from "@/lib/require-session";

type NamespaceResponse = {
  items?: Array<{
    metadata?: {
      name?: string;
    };
  }>;
};

type StatefulSetResponse = {
  items?: Array<{
    metadata?: {
      uid?: string;
      name?: string;
      namespace?: string;
      creationTimestamp?: string;
    };
    spec?: {
      replicas?: number;
    };
    status?: {
      readyReplicas?: number;
    };
  }>;
};

export default async function StatefulSetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAuthenticatedPage();

  let initialData: StatefulSetItem[] = [];
  let initialNamespaces: string[] = [];

  try {
    const [statefulSetResult, namespaceResult] = (await Promise.all([
      k8sFetch("/apis/apps/v1/statefulsets"),
      k8sFetch("/api/v1/namespaces"),
    ])) as [StatefulSetResponse, NamespaceResponse];

    if (Array.isArray(statefulSetResult.items)) {
      initialData = statefulSetResult.items.map((item, index) => ({
        key: item.metadata?.uid || `sts-${index}`,
        name: item.metadata?.name || "",
        namespace: item.metadata?.namespace || "",
        replicas: item.spec?.replicas || 0,
        readyReplicas: item.status?.readyReplicas || 0,
        creationTimestamp: item.metadata?.creationTimestamp || new Date().toISOString(),
      }));
    }

    if (Array.isArray(namespaceResult.items)) {
      initialNamespaces = namespaceResult.items
        .map((item) => item.metadata?.name)
        .filter((name): name is string => Boolean(name));
    }
  } catch (error) {
    console.error("Failed to fetch initial statefulset page data:", error);
  }

  return (
    <PageLayout selectedKey="statefulset" clusterId={id}>
      <StatefulSetList
        initialData={initialData}
        initialNamespaces={initialNamespaces}
        initialLoaded
      />
    </PageLayout>
  );
}
