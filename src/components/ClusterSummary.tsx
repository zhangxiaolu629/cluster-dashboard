import { Card, Descriptions, Tag } from "antd";

export default function ClusterSummary() {
  return (
    <Card title="集群信息" size="small" style={{ marginBottom: 16 }}>
      <Descriptions column={1} size="small" colon>
        <Descriptions.Item label="集群名称">demo-cluster</Descriptions.Item>
        <Descriptions.Item label="集群状态">
          <Tag color="green">运行中</Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
