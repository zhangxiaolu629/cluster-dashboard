"use client";

import { Form, Input, Select, InputNumber, Row, Col, Card, Button } from "antd";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";

export default function Step2Container() {
  const { control, setValue } = useFormContext();
  const {
    fields: envFields,
    append: appendEnv,
    remove: removeEnv,
  } = useFieldArray({ control, name: "env" });

  const imagePullPolicyOptions = [
    { value: "Always", label: "Always - 总是拉取" },
    { value: "IfNotPresent", label: "IfNotPresent - 本地有则用" },
    { value: "Never", label: "Never - 仅用本地" },
  ];

  const protocolOptions = [
    { value: "TCP", label: "TCP" },
    { value: "UDP", label: "UDP" },
  ];

  return (
    <div>
      <Card title="2.1 基础配置" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="containerName"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="容器名称"
                  required
                  help={fieldState.error?.message}
                  validateStatus={fieldState.error ? "error" : undefined}
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Input {...field} placeholder="容器名称，在 Pod 内唯一" style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="image"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="镜像地址"
                  required
                  help={fieldState.error?.message}
                  validateStatus={fieldState.error ? "error" : undefined}
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Input
                    {...field}
                    placeholder="如 nginx:1.25 或 registry.example.com/app:v1"
                    style={{ width: 400 }}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="imagePullPolicy"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="镜像拉取策略"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Select {...field} options={imagePullPolicyOptions} style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="workingDir"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="工作目录"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Input {...field} placeholder="容器内的当前工作目录" style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="command"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="启动命令"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Input
                    placeholder="用逗号分隔，如: /bin/sh,-c"
                    style={{ width: 400 }}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        field.onChange(
                          value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        );
                      } else {
                        field.onChange(undefined);
                      }
                    }}
                    value={field.value?.join(",") || ""}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="args"
              control={control}
              render={({ field }) => (
                <Form.Item label="参数" labelCol={{ style: { width: 120, textAlign: "right" } }}>
                  <Input
                    placeholder="用逗号分隔，如: arg1,arg2,arg3"
                    style={{ width: 400 }}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        field.onChange(
                          value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        );
                      } else {
                        field.onChange(undefined);
                      }
                    }}
                    value={field.value?.join(",") || ""}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
      </Card>

      <Card title="2.2 端口配置" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="portName"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="端口名称"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Input {...field} placeholder="用于 Service 引用" style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="containerPort"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="容器端口"
                  required
                  help={fieldState.error?.message}
                  validateStatus={fieldState.error ? "error" : undefined}
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <InputNumber
                    {...field}
                    placeholder="如 80"
                    style={{ width: 400 }}
                    min={1}
                    max={65535}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="protocol"
              control={control}
              render={({ field }) => (
                <Form.Item label="协议" labelCol={{ style: { width: 120, textAlign: "right" } }}>
                  <Select {...field} options={protocolOptions} style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
      </Card>

      <Card title="2.3 资源配置" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="cpuRequests"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="CPU 请求"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Input {...field} placeholder="如 100m" style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="memoryRequests"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="内存请求"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Input {...field} placeholder="如 128Mi" style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="cpuLimits"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="CPU 限制"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Input {...field} placeholder="如 200m" style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="memoryLimits"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="内存限制"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Input {...field} placeholder="如 256Mi" style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
      </Card>

      <Card title="2.4 环境变量" size="small" style={{ marginBottom: 16 }}>
        <Form.Item label="环境变量" labelCol={{ style: { width: 120, textAlign: "right" } }}>
          {envFields.map((field, index) => (
            <Row gutter={8} key={field.id} style={{ marginBottom: 8 }}>
              <Col span={24}>
                <Controller
                  name={`env.${index}.name`}
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="变量名" style={{ width: 180, marginRight: 8 }} />
                  )}
                />
                <Controller
                  name={`env.${index}.value`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="变量值（静态）"
                      style={{ width: 180, marginRight: 8 }}
                    />
                  )}
                />
                <Controller
                  name={`env.${index}.valueFromSecret.name`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Secret 名称"
                      style={{ width: 180, marginRight: 8 }}
                    />
                  )}
                />
                <Controller
                  name={`env.${index}.valueFromSecret.key`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Secret Key"
                      style={{ width: 180, marginRight: 8 }}
                    />
                  )}
                />
                <Button type="link" danger onClick={() => removeEnv(index)}>
                  删除
                </Button>
              </Col>
            </Row>
          ))}
          <Button
            type="dashed"
            onClick={() => appendEnv({ name: "", value: "" })}
            style={{ width: 200 }}
          >
            + 添加环境变量
          </Button>
        </Form.Item>
      </Card>
    </div>
  );
}
