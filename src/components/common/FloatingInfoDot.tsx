"use client";

import { useState } from "react";
import { Card, Divider, List, Typography } from "antd";

export default function FloatingInfoDot() {
  const [open, setOpen] = useState(false);

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{
        position: "fixed",
        left: 24,
        bottom: 24,
        zIndex: 1050,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      {open && (
        <Card
          id="floating-info-panel"
          size="small"
          role="region"
          aria-label="说明与待实现功能"
          style={{
            width: 320,
            maxWidth: "calc(100vw - 32px)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
          }}
        >
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            火山引擎-容器服务
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            本项目依赖的 k8s 集群部署在火山引擎-容器服务上面
          </Typography.Paragraph>

          {/* <Divider style={{ margin: "16px 0" }} />

          <Typography.Title level={5} style={{ marginTop: 0 }}>
            待实现功能
          </Typography.Title>
          <List
            size="small"
            dataSource={["资源的更新、删除功能", "auth功能", "AI对话功能"]}
            renderItem={(item, index) => (
              <List.Item style={{ paddingInline: 0 }}>
                {index + 1}）{item}
              </List.Item>
            )}
          /> */}
        </Card>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? "floating-info-panel" : undefined}
        aria-label="展开说明：火山引擎与待实现功能"
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: "none",
          padding: 0,
          cursor: "pointer",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          background: "var(--ant-color-primary, #1677ff)",
        }}
      />
    </div>
  );
}
