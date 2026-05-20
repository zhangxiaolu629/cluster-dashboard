import PageLayout from "@/components/layout/PageLayout";
import DeploymentList, { DeploymentItem } from "@/components/lists/DeploymentList";
import { k8sFetch } from "@/lib/k8s";
import { requirePageSession } from "@/lib/require-page-session";

type NamespaceResponse = {
  items?: Array<{
    metadata?: {
      name?: string;
    };
  }>;
};

type DeploymentResponse = {
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

export default async function DeploymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePageSession(`/cluster/${id}/deployment`);

  let initialData: DeploymentItem[] = [];
  let initialNamespaces: string[] = [];

  try {
    const [deploymentResult, namespaceResult] = (await Promise.all([
      k8sFetch("/apis/apps/v1/deployments"),
      k8sFetch("/api/v1/namespaces"),
    ])) as [DeploymentResponse, NamespaceResponse];

    if (Array.isArray(deploymentResult.items)) {
      initialData = deploymentResult.items.map((item, index) => ({
        key: item.metadata?.uid || `deploy-${index}`,
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
    console.error("Failed to fetch initial deployment page data:", error);
  }

  return (
    <PageLayout selectedKey="deployment" clusterId={id}>
      <DeploymentList
        initialData={initialData}
        initialNamespaces={initialNamespaces}
        initialLoaded
      />
    </PageLayout>
  );
}
