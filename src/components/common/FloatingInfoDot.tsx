"use client";

import { useState } from "react";
import { Card, Divider, List, Typography } from "antd";

const VOLCENGINE_LOGIN_URL = "https://console.volcengine.com/auth/login/user/2000010275";

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
            本项目依赖的 k8s 集群部署在火山引擎上面
            {/* ，可以登录火山引擎控制台查看。 */}
          </Typography.Paragraph>
          {/* <div
            style={{
              border: "1px solid var(--ant-color-border-secondary, #f0f0f0)",
              borderRadius: 8,
              padding: 12,
              background: "var(--ant-color-fill-quaternary, rgba(0,0,0,0.02))",
            }}
          >
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              进入
              <a
                href={VOLCENGINE_LOGIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginInline: 4 }}
              >
                登录页面
              </a>
              ，然后输入：
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 4 }}>
              用户名：<Typography.Text code>visit_zxl</Typography.Text>
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              密码：<Typography.Text code>1234_qweR</Typography.Text>
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              登录后点击容器服务即可查看。
            </Typography.Paragraph>
          </div> */}

          <Divider style={{ margin: "16px 0" }} />

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
          />
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
