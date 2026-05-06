"use client";

import { CopyOutlined } from "@ant-design/icons";
import {
  useEffect,
  useRef,
  useState,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { App, Button, Card, Input, Space, Typography } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import styles from "./AiChatPanel.module.css";

const { Paragraph, Text } = Typography;
const DRAFT_STORAGE_KEY = "ai-chat-draft";
const EMPTY_ANSWER = "还没有回答，输入问题后点击发送。";

function extractFenceLanguage(children: ReactNode): string {
  if (!isValidElement(children)) {
    return "";
  }
  const cls = (children.props as { className?: string }).className;
  if (typeof cls === "string") {
    const m = cls.match(/language-([\w-]+)/);
    if (m) {
      return m[1];
    }
  }
  return "";
}

function MarkdownFencePre({ children, ...rest }: ComponentPropsWithoutRef<"pre">) {
  const { message } = App.useApp();
  const preRef = useRef<HTMLPreElement>(null);
  const lang = extractFenceLanguage(children);

  const handleCopyBlock = async () => {
    const text = preRef.current?.textContent ?? "";
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      message.success("代码已复制");
    } catch (error) {
      console.error("复制代码失败:", error);
      message.error("复制失败，请手动选择复制");
    }
  };

  return (
    <div className={styles.codeBlockWrap}>
      <div className={styles.codeBlockHeader}>
        {lang ? <span className={styles.codeBlockLang}>{lang}</span> : <span aria-hidden />}
        <Button
          type="text"
          size="small"
          className={styles.codeBlockCopyBtn}
          icon={<CopyOutlined />}
          onClick={() => void handleCopyBlock()}
        >
          复制
        </Button>
      </div>
      <pre ref={preRef} className={styles.codeBlockPre} {...rest}>
        {children}
      </pre>
    </div>
  );
}

export default function AiChatPanel() {
  const { message } = App.useApp();
  const [input, setInput] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    try {
      return localStorage.getItem(DRAFT_STORAGE_KEY) || "";
    } catch (error) {
      console.error("读取 AI 对话草稿失败:", error);
      return "";
    }
  });
  const [answerText, setAnswerText] = useState(EMPTY_ANSWER);
  const [statusText, setStatusText] = useState<"ready" | "streaming" | "error">("ready");
  const [errorText, setErrorText] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const isStreaming = statusText === "streaming";

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, input);
    } catch (error) {
      console.error("保存 AI 对话草稿失败:", error);
    }
  }, [input]);

  const stop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStatusText("ready");
  };

  const handleSubmit = async () => {
    const userMessage = input.trim();
    if (!userMessage || isStreaming) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStatusText("streaming");
    setErrorText("");
    setAnswerText("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`请求失败（${response.status}）`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setAnswerText(fullText);
      }
      setStatusText("ready");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatusText("ready");
        return;
      }
      setStatusText("error");
      setErrorText(error instanceof Error ? error.message : "未知错误");
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCopyAnswer = async () => {
    if (!answerText || answerText === EMPTY_ANSWER) return;
    try {
      await navigator.clipboard.writeText(answerText);
      message.success("回答已复制");
    } catch (error) {
      console.error("复制回答失败:", error);
      message.error("复制失败，请手动复制");
    }
  };

  const handleClearSession = () => {
    stop();
    setInput("");
    setAnswerText(EMPTY_ANSWER);
    setErrorText("");
    setStatusText("ready");
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
      console.error("清空 AI 对话草稿失败:", error);
    }
  };

  return (
    <Card
      size="small"
      title={
        <span style={{ display: "inline-flex", flexWrap: "wrap", alignItems: "baseline", gap: 8 }}>
          <span>AI 对话（MVP）</span>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
            调用智普AI大模型服务，目前使用版本是glm-4.5-flash
          </Text>
        </span>
      }
    >
      <Space orientation="vertical" size={12} style={{ width: "100%" }}>
        <Input.TextArea
          placeholder="请输入你的问题，例如：如何排查 Deployment 无法就绪？"
          autoSize={{ minRows: 4, maxRows: 8 }}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={2000}
          disabled={isStreaming}
          onPressEnter={(event) => {
            if (event.shiftKey) return;
            event.preventDefault();
            void handleSubmit();
          }}
        />
        <Space>
          <Button type="primary" onClick={() => handleSubmit()} loading={isStreaming}>
            发送
          </Button>
          <Button onClick={stop} disabled={!isStreaming}>
            停止生成
          </Button>
          <Button onClick={handleCopyAnswer} disabled={!answerText || answerText === EMPTY_ANSWER}>
            复制回答
          </Button>
          <Button onClick={handleClearSession}>清空会话</Button>
          <Text type="secondary">状态：{statusText}</Text>
        </Space>
        {errorText ? <Paragraph type="danger">请求失败：{errorText}</Paragraph> : null}
        <Card size="small" title="回答">
          {answerText === EMPTY_ANSWER ? (
            <p className={styles.aiMarkdownPlaceholder}>{EMPTY_ANSWER}</p>
          ) : (
            <div className={styles.aiMarkdown}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: MarkdownFencePre }}>
                {answerText}
              </ReactMarkdown>
            </div>
          )}
        </Card>
      </Space>
    </Card>
  );
}
