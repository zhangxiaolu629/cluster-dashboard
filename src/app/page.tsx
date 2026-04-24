import { Card, Layout } from "antd";
import ClusterSummary from "@/components/ClusterSummary";
import ClusterTabs from "@/components/ClusterTabs";
import PageLayout from "@/components/PageLayout";

export default function Home() {
  return (
    <PageLayout>
      <Layout style={{ background: "transparent" }}>
        <ClusterSummary />
        <Card size="small" title="资源列表">
          <ClusterTabs />
        </Card>
      </Layout>
    </PageLayout>
  );
}
