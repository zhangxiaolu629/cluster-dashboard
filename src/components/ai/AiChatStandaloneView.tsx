"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import AiChatPanel from "./AiChatPanel";

export default function AiChatStandaloneView() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        background: isDark ? "#141414" : "#f5f5f5",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          返回
        </Button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <AiChatPanel />
      </div>
    </div>
  );
}
