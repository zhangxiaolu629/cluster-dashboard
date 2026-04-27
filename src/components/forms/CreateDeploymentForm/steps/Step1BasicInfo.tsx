"use client";

import { Form, Input, Row, Col, Button, Select } from "antd";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { useState, useEffect } from "react";

export default function Step1BasicInfo() {
  const { control, register, setValue } = useFormContext();
  const { fields: labelFields, append: appendLabel, remove: removeLabel } = useFieldArray({ control, name: "labels" });
  const { fields: annotationFields, append: appendAnnotation, remove: removeAnnotation } = useFieldArray({ control, name: "annotations" });
  const [namespaces, setNamespaces] = useState<string[]>([]);

  useEffect(() => {
    const fetchNamespaces = async () => {
      try {
        const response = await fetch("/api/namespaces");
        const result = await response.json();
        if (result?.items && Array.isArray(result.items)) {
          const names = result.items
            .map((item: any) => item?.metadata?.name)
            .filter((name: unknown): name is string => Boolean(name));
          setNamespaces(names);
        }
      } catch (error) {
        console.error("Failed to fetch namespaces:", error);
      }
    };
    fetchNamespaces();
  }, []);

  return (
    <div>
      <Row gutter={16}>
        <Col span={24}>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item
                label="名称"
                required
                help={fieldState.error?.message}
                validateStatus={fieldState.error ? "error" : undefined}
                labelCol={{ style: { width: 120, textAlign: "right" } }}
              >
                <Input {...field} placeholder="请输入 Deployment 名称" autoComplete="off" style={{ width: 300 }} />
              </Form.Item>
            )}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Controller
            name="namespace"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item
                label="命名空间"
                required
                help={fieldState.error?.message}
                validateStatus={fieldState.error ? "error" : undefined}
                labelCol={{ style: { width: 120, textAlign: "right" } }}
              >
                <Select
                  {...field}
                  placeholder="请选择命名空间"
                  style={{ width: 300 }}
                  onChange={(value) => field.onChange(value)}
                  options={namespaces.map((ns) => ({ value: ns, label: ns }))}
                />
              </Form.Item>
            )}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="标签" labelCol={{ style: { width: 120, textAlign: "right" } }}>
            {labelFields.map((field, index) => (
              <Row gutter={8} key={field.id} style={{ marginBottom: 8 }}>
                <Col span={10}>
                  <Input {...register(`labels.${index}.key`)} placeholder="标签 Key" style={{ width: 300 }} />
                </Col>
                <Col span={10}>
                  <Input {...register(`labels.${index}.value`)} placeholder="标签 Value" style={{ width: 300 }} />
                </Col>
                <Col span={4}>
                  <Button type="link" danger onClick={() => removeLabel(index)}>删除</Button>
                </Col>
              </Row>
            ))}
            <Button type="dashed" onClick={() => appendLabel({ key: "", value: "" })} style={{ width: 200 }}>
              + 添加标签
            </Button>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="注解" labelCol={{ style: { width: 120, textAlign: "right" } }}>
            {annotationFields.map((field, index) => (
              <Row gutter={8} key={field.id} style={{ marginBottom: 8 }}>
                <Col span={10}>
                  <Input {...register(`annotations.${index}.key`)} placeholder="注解 Key" style={{ width: 300 }} />
                </Col>
                <Col span={10}>
                  <Input {...register(`annotations.${index}.value`)} placeholder="注解 Value" style={{ width: 300 }} />
                </Col>
                <Col span={4}>
                  <Button type="link" danger onClick={() => removeAnnotation(index)}>删除</Button>
                </Col>
              </Row>
            ))}
            <Button type="dashed" onClick={() => appendAnnotation({ key: "", value: "" })} style={{ width: 200 }}>
              + 添加注解
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}