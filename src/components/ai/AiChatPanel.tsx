"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Input, Space, Typography, message } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const { Paragraph, Text } = Typography;
const DRAFT_STORAGE_KEY = "ai-chat-draft";
const EMPTY_ANSWER = "还没有回答，输入问题后点击发送。";

export default function AiChatPanel() {
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
    const message = input.trim();
    if (!message || isStreaming) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStatusText("streaming");
    setErrorText("");
    setAnswerText("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
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
    <Card size="small" title="AI 对话（MVP）">
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
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
          <div style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answerText}</ReactMarkdown>
          </div>
        </Card>
      </Space>
    </Card>
  );
}
