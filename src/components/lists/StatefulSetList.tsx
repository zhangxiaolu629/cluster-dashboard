"use client";

import { Table, Card, Tag, Spin, Select, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import AppLinkButton from "@/components/common/AppLinkButton";
import dayjs from "dayjs";

export type StatefulSetItem = {
  key: string;
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  creationTimestamp: string;
};

interface StatefulSetListProps {
  initialData?: StatefulSetItem[];
  initialNamespaces?: string[];
  initialLoaded?: boolean;
}

const columns: ColumnsType<StatefulSetItem> = [
  {
    title: "名称",
    dataIndex: "name",
    key: "name",
    width: 200,
  },
  {
    title: "命名空间",
    dataIndex: "namespace",
    key: "namespace",
    width: 150,
  },
  {
    title: "副本数",
    dataIndex: "replicas",
    key: "replicas",
    width: 100,
    render: (_: number, record: StatefulSetItem) => (
      <span>
        {record.readyReplicas}/{record.replicas}
      </span>
    ),
  },
  {
    title: "状态",
    dataIndex: "replicas",
    key: "status",
    width: 100,
    render: (_: number, record: StatefulSetItem) => (
      <Tag color={record.readyReplicas === record.replicas ? "green" : "orange"}>
        {record.readyReplicas === record.replicas ? "就绪" : "部分就绪"}
      </Tag>
    ),
  },
  {
    title: "创建时间",
    dataIndex: "creationTimestamp",
    key: "creationTimestamp",
    width: 200,
    sorter: (a, b) =>
      new Date(a.creationTimestamp).getTime() - new Date(b.creationTimestamp).getTime(),
    defaultSortOrder: "descend",
    render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm:ss"),
  },
];

export default function StatefulSetList({
  initialData = [],
  initialNamespaces = [],
  initialLoaded = false,
}: StatefulSetListProps) {
  const params = useParams();
  const clusterId = String(params.id ?? "");
  const [data, setData] = useState<StatefulSetItem[]>(initialData);
  const [loading, setLoading] = useState(!initialLoaded);
  const [namespaces, setNamespaces] = useState<string[]>(initialNamespaces);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);

  useEffect(() => {
    if (initialLoaded && initialNamespaces.length > 0) {
      return;
    }
    const fetchNamespaces = async () => {
      try {
        const response = await fetch("/api/namespaces");
        const result = await response.json();
        if (result.items) {
          const names = result.items.map((item: any) => item.metadata?.name).filter(Boolean);
          setNamespaces(names);
        } else {
          setNamespaces([]);
        }
      } catch (error) {
        console.error("Failed to fetch namespaces:", error);
      }
    };
    fetchNamespaces();
  }, [initialLoaded, initialNamespaces.length]);

  useEffect(() => {
    if (initialLoaded && !selectedNamespace) {
      setLoading(false);
      return;
    }
    const fetchStatefulSets = async () => {
      try {
        setLoading(true);
        const url = selectedNamespace
          ? `/api/statefulsets?namespace=${selectedNamespace}`
          : "/api/statefulsets";
        const response = await fetch(url);
        const result = await response.json();

        if (result.items) {
          const mappedData: StatefulSetItem[] = result.items.map((item: any, index: number) => ({
            key: item.metadata?.uid || `sts-${index}`,
            name: item.metadata?.name || "",
            namespace: item.metadata?.namespace || "",
            replicas: item.spec?.replicas || 0,
            readyReplicas: item.status?.readyReplicas || 0,
            creationTimestamp: item.metadata?.creationTimestamp || new Date().toISOString(),
          }));
          setData(mappedData);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Failed to fetch statefulsets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatefulSets();
  }, [initialLoaded, selectedNamespace]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <AppLinkButton variant="primary" href={`/cluster/${clusterId}/yaml-create?kind=StatefulSet`}>
          YAML新建
        </AppLinkButton>
        <Space>
          <Select
            placeholder="选择命名空间"
            allowClear
            style={{ width: 180 }}
            value={selectedNamespace}
            onChange={(value) => setSelectedNamespace(value)}
            options={namespaces.map((ns) => ({ value: ns, label: ns }))}
          />
        </Space>
      </div>
      <Card size="small">
        <Spin spinning={loading}>
          <Table columns={columns} dataSource={data} pagination={false} rowKey="key" />
        </Spin>
      </Card>
    </div>
  );
}
