import { Card, Skeleton, Space } from "antd";

export default function ClusterLoading() {
  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card size="small" title="集群信息">
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
        <Card size="small" title="资源列表">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Space>
    </div>
  );
}
