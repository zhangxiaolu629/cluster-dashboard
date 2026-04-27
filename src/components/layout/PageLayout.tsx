"use client";

import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Layout, Menu } from "antd";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ResponsiveContainer from "./ResponsiveContainer";
import ThemeSwitcher from "./ThemeSwitcher";
import { useTheme } from "@/contexts/ThemeContext";

const { Header, Sider, Content } = Layout;

type PageKey = "cluster" | "namespace" | "event" | "service" | "deployment" | "statefulset" | "yaml-create";

interface PageLayoutProps {
  selectedKey: PageKey;
  clusterId?: string;
  children: React.ReactNode;
}

export default function PageLayout({ selectedKey, clusterId, children }: PageLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getMenuPath = (key: PageKey): string => {
    if (!clusterId) {
      return "/";
    }
    if (key === "cluster") {
      return `/cluster/${clusterId}`;
    }
    return `/cluster/${clusterId}/${key}`;
  };

  const handleMenuClick = (info: { key: string }) => {
    const key = info.key;
    if (key === 'workload') return;

    const pageKey = key as PageKey;
    const targetPath = getMenuPath(pageKey);
    router.push(targetPath);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={220}
          theme={isDark ? "dark" : "light"}
        >
          <div style={{ height: 56, padding: "16px", fontWeight: 600 }}>导航</div>
          <Menu
            mode="inline"
            theme={isDark ? "dark" : "light"}
            selectedKeys={[selectedKey]}
            items={[
              { key: "cluster", label: "集群" },
              { key: "namespace", label: "命名空间" },
              { key: "event", label: "事件" },
              { key: "service", label: "Service" },
              {
                key: "workload",
                label: "工作负载",
                children: [
                  { key: "deployment", label: "Deployment" },
                  { key: "statefulset", label: "StatefulSet" },
                ],
              },
              { key: "yaml-create", label: "YAML新建" },
            ]}
            onClick={handleMenuClick}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: isDark ? "#1f1f1f" : "#fff",
              paddingInline: 16,
              borderBottom: `1px solid ${isDark ? "#303030" : "#f0f0f0"}`,
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((prev) => !prev)}
            />
            <ThemeSwitcher />
          </Header>
          <Content style={{ padding: "16px" }}>
            <ResponsiveContainer>
              {children}
            </ResponsiveContainer>
          </Content>
        </Layout>
      </Layout>
  );
}