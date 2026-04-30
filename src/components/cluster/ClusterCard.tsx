"use client";

import { Card, Tag, Button, Typography } from "antd";
import { CopyOutlined, RightOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useState } from "react";

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
  onCopyId: (id: string, e: React.MouseEvent) => void;
}

export default function ClusterCard({ id, name, phase, statusConfig, onCopyId }: ClusterCardProps) {
  const isRunning = phase === "Running";
  const [hovered, setHovered] = useState(false);

  const handleCopyClick = (e: React.MouseEvent) => {
    onCopyId(id, e);
  };

  const clusterHref = `/cluster/${id}`;

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={clusterHref}
        prefetch
        aria-label={isRunning ? `进入集群 ${name}` : `查看集群 ${name}`}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          borderRadius: 16,
        }}
      />
      <Card
        hoverable={false}
        style={{
          position: "relative",
          zIndex: 2,
          pointerEvents: "none",
          borderRadius: 16,
          cursor: "pointer",
          transition: "all 0.3s ease",
          border: "1px solid #e8e8e8",
          opacity: isRunning ? 1 : hovered ? 1 : 0.85,
          boxShadow: hovered
            ? isRunning
              ? "0 12px 40px rgba(82, 196, 26, 0.2)"
              : "0 12px 40px rgba(0, 0, 0, 0.15)"
            : "none",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
        }}
        styles={{
          body: { padding: 20 },
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
                style={{ color: "#8c8c8c", pointerEvents: "auto" }}
              />
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: 0,
                color: "#667eea",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              <RightOutlined />
              {isRunning ? "进入管理" : "查看详情"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
