import { Card, Empty } from "antd";

export default function NodeListPanel() {
  return (
    <Card size="small" variant="borderless">
      <Empty description="节点列表为空" />
    </Card>
  );
}
