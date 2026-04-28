"use client";

import { Card, Alert, Spin, Button, Space, Select } from "antd";
import { DownloadOutlined, CopyOutlined } from "@ant-design/icons";
import { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { oneDark } from "@codemirror/theme-one-dark";
import yaml_lib from "js-yaml";
import { message } from "antd";

interface DeploymentPreviewProps {
  yaml: string;
}

export default function DeploymentPreview({ yaml: yamlText }: DeploymentPreviewProps) {
  const [formattedYaml, setFormattedYaml] = useState("");
  const [format, setFormat] = useState<"standard" | "compact">("standard");
  const codeRef = useRef<any>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(yamlText);
      const formatted = yaml_lib.dump(parsed, {
        indent: 2,
        lineWidth: format === "compact" ? 60 : -1,
        noRefs: true,
      });
      setFormattedYaml(formatted);
    } catch {
      setFormattedYaml(yamlText);
    }
  }, [yamlText, format]);

  const handleDownload = () => {
    const blob = new Blob([formattedYaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deployment.yaml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success("YAML 已下载");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedYaml);
      message.success("已复制到剪贴板");
    } catch {
      message.error("复制失败");
    }
  };

  return (
    <div>
      <Alert
        title="YAML 预览"
        description="请确认以下 YAML 配置是否正确，确认无误后点击「创建」按钮提交。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Card>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space>
            <span>格式化：</span>
            <Select
              value={format}
              onChange={setFormat}
              options={[
                { value: "standard", label: "标准格式" },
                { value: "compact", label: "紧凑格式" },
              ]}
              style={{ width: 120 }}
            />
          </Space>
          <Space>
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
              下载 YAML
            </Button>
          </Space>
        </div>
        <CodeMirror
          value={formattedYaml || ""}
          height="400px"
          extensions={[yaml()]}
          theme={oneDark}
          readOnly
          style={{ fontSize: 13, borderRadius: 6 }}
        />
        {!formattedYaml && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin size="large" />
          </div>
        )}
      </Card>
    </div>
  );
}
