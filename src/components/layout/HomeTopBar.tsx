"use client";

import { Button, Space, Typography } from "antd";
import { CloudOutlined, LogoutOutlined, MessageOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import ThemeSwitcher from "@/components/layout/ThemeSwitcher";
import { useTheme } from "@/contexts/ThemeContext";

export default function HomeTopBar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        minHeight: 56,
        padding: "10px 24px",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
        background: isDark ? "rgba(15, 15, 22, 0.82)" : "rgba(255, 255, 255, 0.22)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Link
        href="/"
        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
      >
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(102, 126, 234, 0.35)",
          }}
        >
          <CloudOutlined style={{ fontSize: 20, color: "#fff" }} />
        </span>
        <Typography.Text
          strong
          style={{
            fontSize: 16,
            color: isDark ? "rgba(255,255,255,0.95)" : "#1a1a2e",
            whiteSpace: "nowrap",
          }}
        >
          K8s 集群管理平台
        </Typography.Text>
      </Link>

      <Space size="middle" wrap style={{ justifyContent: "flex-end" }}>
        <Link href="/ai-chat" prefetch={false}>
          <Button
            type="text"
            icon={<MessageOutlined />}
            style={{ color: isDark ? "rgba(255,255,255,0.85)" : undefined }}
          >
            AI 对话
          </Button>
        </Link>
        <ThemeSwitcher />

        {session?.user?.name ? (
          <Typography.Text
            type="secondary"
            style={{ maxWidth: 160, color: isDark ? "rgba(255,255,255,0.65)" : undefined }}
            ellipsis
          >
            {session.user.name}
          </Typography.Text>
        ) : null}

        <Button
          type="text"
          danger={!isDark}
          icon={<LogoutOutlined />}
          style={isDark ? { color: "rgba(255, 180, 180, 0.95)" } : undefined}
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/login");
                  router.refresh();
                },
              },
            })
          }
        >
          登出
        </Button>
      </Space>
    </header>
  );
}
