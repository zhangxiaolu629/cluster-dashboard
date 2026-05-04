"use client";

import { Button, Card, Form, Input, Typography, App } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

const { Title, Text } = Typography;

export default function LoginForm() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (session?.user) {
      router.replace(callbackUrl);
    }
  }, [session, router, callbackUrl]);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const { error } = await authClient.signIn.username({
        username: values.username.trim().toLowerCase(),
        password: values.password,
        callbackURL: callbackUrl,
      });
      if (error) {
        message.error("用户名或密码错误");
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      message.error("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  if (session?.user) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <Text type="secondary">加载中…</Text>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        padding: 24,
        background: "linear-gradient(160deg, #f0f5ff 0%, #fafafa 45%, #ffffff 100%)",
      }}
    >
      <Card style={{ width: "100%", maxWidth: 400 }} variant="borderless">
        <Title level={3} style={{ marginTop: 0 }}>
          登录
        </Title>
        <Text type="secondary">使用管理员分配的账号登录控制台</Text>
        <Form layout="vertical" style={{ marginTop: 24 }} onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
