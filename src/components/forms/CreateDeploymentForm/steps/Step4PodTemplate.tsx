"use client";

import { Form, Input, Select, Row, Col, Card } from "antd";
import { useFormContext, Controller } from "react-hook-form";

export default function Step4PodTemplate() {
  const { control, setValue } = useFormContext();

  return (
    <div>
      <Card title="4.1 Pod 元数据" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="podLabels"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="Pod 标签"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Input
                    placeholder="如 app=nginx,env=production"
                    style={{ width: 400 }}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        const labels: Record<string, string> = {};
                        value.split(",").forEach(pair => {
                          const [k, v] = pair.split("=").map(s => s.trim());
                          if (k && v) labels[k] = v;
                        });
                        field.onChange(labels);
                      } else {
                        field.onChange({ app: "" });
                      }
                    }}
                    value={field.value ? Object.entries(field.value).map(([k, v]) => `${k}=${v}`).join(",") : ""}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
      </Card>

      <Card title="4.2 Pod 规格" size="small">
        <Row gutter={16}>
          <Col span={24}>
            <Controller
              name="restartPolicy"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="重启策略"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Select
                    {...field}
                    options={[
                      { value: "Always", label: "Always" },
                      { value: "IfNotPresent", label: "IfNotPresent" },
                      { value: "Never", label: "Never" },
                    ]}
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
              name="serviceAccountName"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="服务账号"
                  labelCol={{ style: { width: 120, textAlign: "right" } }}
                >
                  <Input {...field} placeholder="Pod 使用的服务账号" style={{ width: 400 }} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}