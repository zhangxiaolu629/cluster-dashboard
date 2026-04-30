"use client";

import { Card, Button, message, Space, Alert } from "antd";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { oneDark } from "@codemirror/theme-one-dark";
import yaml_lib from "js-yaml";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function getResourceListPath(kind: string | undefined, clusterId?: string): string | null {
  if (!clusterId || !kind) return null;
  const map: Record<string, string> = {
    Namespace: "namespace",
    Service: "service",
    Deployment: "deployment",
    StatefulSet: "statefulset",
  };
  const listSegment = map[kind];
  if (!listSegment) return null;
  return `/cluster/${clusterId}/${listSegment}`;
}

interface YamlCreateProps {
  clusterId?: string;
  /** 由服务端按 URL `?kind=` 生成，与客户端 `kind` 查询保持同步时用于首屏无闪烁 */
  initialYaml?: string;
}

export default function YamlCreate({ clusterId, initialYaml = "" }: YamlCreateProps) {
  const router = useRouter();
  const [yamlContent, setYamlContent] = useState(initialYaml);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successDescription, setSuccessDescription] =
    useState("资源已成功创建，正在跳转到对应列表页");
  const [validationError, setValidationError] = useState<ValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleYamlChange = (value: string) => {
    setYamlContent(value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setYamlContent(content);
        message.success(`${file.name} 上传成功`);
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const parseYamlError = (errorMessage: string): { line?: number; friendlyMessage: string } => {
    const lineMatch = errorMessage.match(/line (\d+)/i) || errorMessage.match(/第(\d+)行/i);
    const line = lineMatch ? parseInt(lineMatch[1]) : undefined;

    let friendlyMessage = errorMessage;

    if (errorMessage.includes("unexpected token") || errorMessage.includes("unexpected end")) {
      if (line) {
        friendlyMessage = `第 ${line} 行存在语法错误，请检查缩进或特殊字符`;
      } else {
        friendlyMessage = "YAML 语法错误，请检查缩进是否正确";
      }
    } else if (errorMessage.includes("duplicate key")) {
      friendlyMessage = "发现重复的键，请确保每个键唯一";
    } else if (errorMessage.includes("bad indentation")) {
      friendlyMessage = "缩进不正确，YAML 要求使用一致的缩进（通常为 2 个空格）";
    } else if (errorMessage.includes("missing")) {
      friendlyMessage = `格式不完整，缺少必要的值${line ? `（第 ${line} 行）` : ""}`;
    } else if (errorMessage.includes("expected")) {
      friendlyMessage = `格式错误${line ? `（第 ${line} 行）` : ""}，请检查冒号后是否有正确的值`;
    }

    return { line, friendlyMessage };
  };

  const validateYamlFormat = (yamlStr: string): ValidationResult => {
    if (!yamlStr.trim()) {
      return { valid: false, error: "YAML 内容不能为空" };
    }

    try {
      yaml_lib.load(yamlStr);
      return { valid: true };
    } catch (error: unknown) {
      const messageText = error instanceof Error ? error.message : "YAML 格式不正确";
      const { friendlyMessage } = parseYamlError(messageText);
      return { valid: false, error: friendlyMessage };
    }
  };

  const handleCreate = async () => {
    if (!yamlContent.trim()) {
      setValidationError({ valid: false, error: "YAML 内容不能为空" });
      return;
    }

    const validation = validateYamlFormat(yamlContent);
    if (!validation.valid) {
      setValidationError(validation);
      return;
    }
    const parsedYaml = yaml_lib.load(yamlContent) as { kind?: string } | undefined;

    setValidationError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/kubernetes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ yaml: yamlContent, ClusterId: clusterId }),
      });

      const data = await response.json();
      if (response.ok && !data.error) {
        console.log("创建成功:", data);
        setSuccess(true);
        const targetPath = getResourceListPath(parsedYaml?.kind, clusterId);
        if (targetPath) {
          setSuccessDescription("资源已成功创建，正在跳转到对应列表页");
          setTimeout(() => {
            router.push(targetPath);
          }, 1200);
        } else {
          setSuccessDescription("资源已成功创建，当前资源类型暂无对应列表页，已保留在当前页面");
        }
      } else {
        const err = data.error;
        if (err && typeof err === "object") {
          const code = err.Code || err.Code === 0 ? `(${err.Code})` : "";
          const errMsg = err.Message || "创建失败";
          setValidationError({ valid: false, error: `${code} ${errMsg}`.trim() });
        } else {
          setValidationError({ valid: false, error: err || "创建失败" });
        }
      }
    } catch (error) {
      console.error("API调用失败:", error);
      setValidationError({ valid: false, error: `创建失败: ${error?.toString() || "网络错误"}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="yaml-create-root" data-e2e-yaml-len={yamlContent.length}>
      <Card title="YAML新建" size="small">
        {success ? (
          <Alert
            title="创建成功"
            description={successDescription}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : (
          <>
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p>需要创建资源请填入对应的YAML（可选择YAML文件上传）</p>
              <Button type="default" onClick={handleFileUploadClick}>
                上传YAML文件
              </Button>
              <input
                ref={fileInputRef}
                data-testid="yaml-file-input"
                type="file"
                accept=".yaml,.yml"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>

            <CodeMirror
              value={yamlContent}
              height="400px"
              extensions={[yaml()]}
              theme={oneDark}
              onChange={(value) => handleYamlChange(value)}
              style={{ marginBottom: validationError ? 8 : 16 }}
            />

            {validationError && (
              <Alert
                title="错误"
                description={validationError.error}
                type="error"
                showIcon
                closable
                onClose={() => setValidationError(null)}
                style={{ marginBottom: 16 }}
              />
            )}

            <Space style={{ float: "right", marginTop: "30px" }}>
              <Button
                onClick={() => {
                  setYamlContent("");
                  setValidationError(null);
                }}
              >
                清空
              </Button>
              <Button type="primary" loading={loading} onClick={handleCreate}>
                创建
              </Button>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
}
