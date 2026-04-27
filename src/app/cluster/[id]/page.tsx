import { Card, Layout } from "antd";
import PageLayout from "@/components/layout/PageLayout";
import ClusterSummary from "@/components/cluster/ClusterSummary";
import ClusterTabs from "@/components/cluster/ClusterTabs";
import { Service } from "@volcengine/openapi";

type VolcCluster = {
  Id: string;
  Name: string;
  CreateTime: string;
  Status: {
    Phase: string;
  };
};

type ClusterInfo = {
  Id?: string;
  metadata: {
    name: string;
    creationTimestamp: string;
  };
  Status: {
    Phase: string;
  };
};

type ListClustersResponse = {
  Result?: {
    Items?: VolcCluster[];
  };
};

export default async function ClusterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let initialClusterInfo: ClusterInfo | null = null;

  try {
    const service = new Service({
      accessKeyId: process.env.VOLC_ACCESS_KEY_ID!,
      secretKey: process.env.VOLC_SECRET_ACCESS_KEY!,
      region: process.env.REGION,
      serviceName: "vke",
    });

    const listClustersApi = service.createJSONAPI("ListClusters", {
      Version: "2022-05-12",
      method: "POST",
    });

    const response = (await listClustersApi({})) as ListClustersResponse;
    const matched = response?.Result?.Items?.find((item) => item.Id === id);
    if (matched) {
      initialClusterInfo = {
        Id: matched.Id,
        metadata: {
          name: matched.Name,
          creationTimestamp: matched.CreateTime,
        },
        Status: matched.Status,
      };
    }
  } catch (error) {
    console.error("Failed to fetch initial cluster summary:", error);
  }

  return (
    <PageLayout selectedKey="cluster" clusterId={id}>
      <Layout style={{ background: "transparent" }}>
        <ClusterSummary
          clusterId={id}
          initialClusterInfo={initialClusterInfo}
          initialLoaded={Boolean(initialClusterInfo)}
        />
        <Card size="small" title="资源列表">
          <ClusterTabs />
        </Card>
      </Layout>
    </PageLayout>
  );
}