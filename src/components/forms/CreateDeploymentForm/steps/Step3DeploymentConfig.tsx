"use client";

import { Form, Input, InputNumber, Select, Row, Col, Card, Switch } from "antd";
import { useFormContext, Controller } from "react-hook-form";

export default function Step3DeploymentConfig() {
  const { control, watch, setValue } = useFormContext();
  const strategyType = watch("strategyType");

  return (
    <div>
      <Card title="3.1 基础配置" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="replicas"
              control={control}
              render={({ field }) => (
                <Form.Item label="副本数" labelCol={{ style: { width: 120, textAlign: "right" } }}>
                  <InputNumber {...field} min={0} style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="minReadySeconds"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="最小就绪秒数"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <InputNumber {...field} min={0} style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="revisionHistoryLimit"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="历史版本保留数"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <InputNumber {...field} min={0} style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="progressDeadlineSeconds"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="进度截止秒数"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <InputNumber {...field} min={0} style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="暂停部署" labelCol={{ style: { width: 120, textAlign: "right" } }}>
              <Switch
                checked={watch("paused")}
                onChange={(checked) => setValue("paused", checked)}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="3.2 标签选择器" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="matchLabels"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="matchLabels"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Input
                    {...field}
                    placeholder="如 app=nginx"
                    style={{ width: 400 }}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        const labels: Record<string, string> = {};
                        value.split(",").forEach((pair) => {
                          const [k, v] = pair.split("=").map((s) => s.trim());
                          if (k && v) labels[k] = v;
                        });
                        field.onChange(labels);
                      } else {
                        field.onChange(undefined);
                      }
                    }}
                    value={
                      field.value
                        ? Object.entries(field.value)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(",")
                        : ""
                    }
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
      </Card>

      <Card title="3.3 更新策略" size="small">
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="strategyType"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="策略类型"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Select
                    {...field}
                    options={[
                      { value: "RollingUpdate", label: "RollingUpdate - 滚动更新" },
                      { value: "Recreate", label: "Recreate - 重建" },
                    ]}
                    style={{ width: 400 }}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        {strategyType === "RollingUpdate" && (
          <>
            <Row gutter={16}>
              <Col span={24}>
                <Controller
                  name="maxSurge"
                  control={control}
                  render={({ field }) => (
                    <Form.Item
                      label="最大超出数量"
                      labelCol={{ style: { width: 120, textAlign: "right" } }}
                    >
                      <Input {...field} placeholder="如 25% 或 1" style={{ width: 400 }} />
                    </Form.Item>
                  )}
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <Controller
                  name="maxUnavailable"
                  control={control}
                  render={({ field }) => (
                    <Form.Item
                      label="最大不可用"
                      labelCol={{ style: { width: 120, textAlign: "right" } }}
                    >
                      <Input {...field} placeholder="如 25% 或 1" style={{ width: 400 }} />
                    </Form.Item>
                  )}
                />
              </Col>
            </Row>
          </>
        )}
      </Card>
    </div>
  );
}
