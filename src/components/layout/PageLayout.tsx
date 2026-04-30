"use client";

import {
  AppstoreOutlined,
  ClusterOutlined,
  CodeOutlined,
  DeploymentUnitOutlined,
  FileAddOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NodeIndexOutlined,
  NotificationOutlined,
  PartitionOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu } from "antd";
import { useState } from "react";
import Link from "next/link";
import AppLinkButton from "@/components/common/AppLinkButton";
import ResponsiveContainer from "./ResponsiveContainer";
import ThemeSwitcher from "./ThemeSwitcher";
import { useTheme } from "@/contexts/ThemeContext";

const { Header, Sider, Content } = Layout;

type PageKey =
  | "cluster"
  | "namespace"
  | "event"
  | "service"
  | "deployment"
  | "statefulset"
  | "yaml-create";

interface PageLayoutProps {
  selectedKey: PageKey;
  clusterId?: string;
  children: React.ReactNode;
}

export default function PageLayout({ selectedKey, clusterId, children }: PageLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        theme={isDark ? "dark" : "light"}
      >
        <div style={{ padding: "12px 12px 8px" }}>
          <AppLinkButton href="/" block icon={<HomeOutlined />}>
            返回首页
          </AppLinkButton>
        </div>
        <div style={{ height: 56, padding: "16px", fontWeight: 600 }}>导航</div>
        <Menu
          mode="inline"
          theme={isDark ? "dark" : "light"}
          selectedKeys={[selectedKey]}
          items={[
            {
              key: "cluster",
              label: (
                <Link href={getMenuPath("cluster")} prefetch>
                  集群
                </Link>
              ),
              icon: <ClusterOutlined />,
            },
            {
              key: "workload",
              label: "工作负载",
              icon: <AppstoreOutlined />,
              children: [
                {
                  key: "deployment",
                  label: (
                    <Link href={getMenuPath("deployment")} prefetch>
                      Deployment
                    </Link>
                  ),
                  icon: <DeploymentUnitOutlined />,
                },
                {
                  key: "statefulset",
                  label: (
                    <Link href={getMenuPath("statefulset")} prefetch>
                      StatefulSet
                    </Link>
                  ),
                  icon: <PartitionOutlined />,
                },
              ],
            },
            {
              key: "yaml-create",
              label: (
                <Link href={getMenuPath("yaml-create")} prefetch>
                  YAML新建
                </Link>
              ),
              icon: <FileAddOutlined />,
            },
            {
              key: "namespace",
              label: (
                <Link href={getMenuPath("namespace")} prefetch>
                  命名空间
                </Link>
              ),
              icon: <NodeIndexOutlined />,
            },
            {
              key: "service",
              label: (
                <Link href={getMenuPath("service")} prefetch>
                  Service
                </Link>
              ),
              icon: <CodeOutlined />,
            },
            {
              key: "event",
              label: (
                <Link href={getMenuPath("event")} prefetch>
                  事件
                </Link>
              ),
              icon: <NotificationOutlined />,
            },
          ]}
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
          <ResponsiveContainer>{children}</ResponsiveContainer>
        </Content>
      </Layout>
    </Layout>
  );
}
