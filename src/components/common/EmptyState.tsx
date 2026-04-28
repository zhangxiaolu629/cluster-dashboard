"use client";

import { Empty, Button, Typography, Space } from "antd";
import { FileTextOutlined, PlusOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = "暂无数据",
  description = "还没有任何数据",
  action,
}: EmptyStateProps) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Space orientation="vertical" size="small" style={{ textAlign: "center" }}>
          <Text strong style={{ fontSize: 16 }}>
            {title}
          </Text>
          <Paragraph style={{ marginBottom: 0, color: "#999" }}>{description}</Paragraph>
        </Space>
      }
    >
      {action}
    </Empty>
  );
}
