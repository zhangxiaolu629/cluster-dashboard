import PageLayout from "@/components/layout/PageLayout";
import ServiceList, { ServiceItem } from "@/components/lists/ServiceList";
import { k8sFetch } from "@/lib/k8s";

type ServiceResponse = {
  items?: Array<{
    metadata?: {
      uid?: string;
      name?: string;
      namespace?: string;
      creationTimestamp?: string;
    };
    spec?: {
      type?: string;
      clusterIP?: string;
    };
  }>;
};

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let initialData: ServiceItem[] = [];

  try {
    const result = (await k8sFetch("/api/v1/services")) as ServiceResponse;
    if (Array.isArray(result.items)) {
      initialData = result.items.map((item, index) => ({
        key: item.metadata?.uid || `svc-${index}`,
        name: item.metadata?.name || "",
        namespace: item.metadata?.namespace || "",
        type: item.spec?.type || "ClusterIP",
        clusterIP: item.spec?.clusterIP || "",
        creationTimestamp: item.metadata?.creationTimestamp || new Date().toISOString(),
      }));
    }
  } catch (error) {
    console.error("Failed to fetch initial service page data:", error);
  }

  return (
    <PageLayout selectedKey="service" clusterId={id}>
      <ServiceList clusterId={id} initialData={initialData} initialLoaded />
    </PageLayout>
  );
}
