"use client";

import { Card, Tag, Button, Typography } from "antd";
import { CopyOutlined, RightOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Text } = Typography;

interface ClusterCardProps {
  id: string;
  name: string;
  phase: string;
  statusConfig: {
    color: string;
    icon: React.ReactNode;
    bg: string;
    border: string;
  };
  index: number;
  onCopyId: (id: string, e: React.MouseEvent) => void;
}

export default function ClusterCard({
  id,
  name,
  phase,
  statusConfig,
  index,
  onCopyId,
}: ClusterCardProps) {
  const isRunning = phase === "Running";
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/cluster/${id}`);
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    onCopyId(id, e);
  };

  const handleEnterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/cluster/${id}`);
  };

  return (
    <Card
      hoverable
      onClick={handleCardClick}
      style={{
        borderRadius: 16,
        cursor: "pointer",
        transition: "all 0.3s ease",
        border: "1px solid #e8e8e8",
        opacity: isRunning ? 1 : 0.85,
      }}
      styles={{
        body: { padding: 20 },
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isRunning
          ? "0 12px 40px rgba(82, 196, 26, 0.2)"
          : "0 12px 40px rgba(0, 0, 0, 0.15)";
        e.currentTarget.style.transform = "translateY(-4px)";
        if (!isRunning) {
          e.currentTarget.style.opacity = "1";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
        if (!isRunning) {
          e.currentTarget.style.opacity = "0.85";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: statusConfig.bg,
            border: `2px solid ${statusConfig.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            color: statusConfig.color,
            flexShrink: 0,
          }}
        >
          {statusConfig.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text strong style={{ fontSize: 16, color: "#1a1a2e" }} ellipsis>
              {name}
            </Text>
            <Tag
              color={statusConfig.bg}
              style={{
                color: statusConfig.color,
                border: `1px solid ${statusConfig.border}`,
                borderRadius: 8,
              }}
            >
              {phase}
            </Tag>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 13 }} ellipsis>
              ID: {id}
            </Text>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopyClick}
              style={{ color: "#8c8c8c" }}
            />
          </div>
          <Button
            type="link"
            icon={<RightOutlined />}
            onClick={handleEnterClick}
            style={{
              padding: 0,
              color: "#667eea",
              fontWeight: 500,
            }}
          >
            {isRunning ? "进入管理" : "查看详情"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
