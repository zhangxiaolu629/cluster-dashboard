"use client";

import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Card, ConfigProvider, Layout, Menu, Select, theme } from "antd";
import { useState } from "react";
import ClusterSummary from "@/components/ClusterSummary";
import ClusterTabs from "@/components/ClusterTabs";
import NamespaceList from "@/components/NamespaceList";
import EventList from "@/components/EventList";

const { Header, Sider, Content } = Layout;

type PageKey = "cluster" | "namespace" | "event";

export default function PageLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState<PageKey>("cluster");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const isDark = themeMode === "dark";

  const renderContent = () => {
    if (selectedKey === "namespace") {
      return <NamespaceList />;
    }
    if (selectedKey === "event") {
      return <EventList />;
    }
    return (
      <Layout style={{ background: "transparent" }}>
        <ClusterSummary />
        <Card size="small" title="资源列表">
          <ClusterTabs />
        </Card>
      </Layout>
    );
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Layout
        style={{
          minHeight: "100vh",
          background: isDark ? "#141414" : "#f5f5f5",
        }}
      >
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
            ]}
            onClick={(item) => setSelectedKey(item.key as PageKey)}
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
            <Select
              value={themeMode}
              style={{ width: 120 }}
              options={[
                { value: "light", label: "light" },
                { value: "dark", label: "dark" },
              ]}
              onChange={(value: "light" | "dark") => setThemeMode(value)}
            />
          </Header>
          <Content style={{ padding: 16 }}>{renderContent()}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
