import { Card, Empty } from "antd";

export default function PodListPanel() {
  return (
    <Card size="small" variant="borderless">
      <Empty description="Pod 列表为空" />
    </Card>
  );
}
