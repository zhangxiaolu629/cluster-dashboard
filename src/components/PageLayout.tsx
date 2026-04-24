"use client";

import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, ConfigProvider, Layout, Menu, Select, theme } from "antd";
import { useState } from "react";

const { Header, Sider, Content } = Layout;

type PageLayoutProps = {
  children: React.ReactNode;
};

export default function PageLayout({ children }: PageLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("cluster");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const isDark = themeMode === "dark";

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
            items={[{ key: "cluster", label: "集群" }]}
            onClick={(item) => setSelectedKey(item.key)}
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
          <Content style={{ padding: 16 }}>{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
