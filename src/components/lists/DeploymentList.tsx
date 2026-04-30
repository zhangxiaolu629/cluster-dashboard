"use client";

import { Table, Card, Tag, Select, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import AppLinkButton from "@/components/common/AppLinkButton";
import TableSkeleton from "@/components/common/TableSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { formatTime, getStatusTag } from "@/lib/utils";

export type DeploymentItem = {
  key: string;
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  creationTimestamp: string;
};

interface DeploymentListProps {
  initialData?: DeploymentItem[];
  initialNamespaces?: string[];
  initialLoaded?: boolean;
}

const getStatusIcon = (ready: number, total: number) => {
  if (total === 0) {
    return <ClockCircleOutlined />;
  }
  if (ready === total) {
    return <CheckCircleOutlined />;
  }
  if (ready > 0) {
    return <ExclamationCircleOutlined />;
  }
  return <CloseCircleOutlined />;
};

const columns: ColumnsType<DeploymentItem> = [
  {
    title: "名称",
    dataIndex: "name",
    key: "name",
    width: 200,
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: "命名空间",
    dataIndex: "namespace",
    key: "namespace",
    width: 150,
    filters: [],
    onFilter: (value, record) => record.namespace === value,
  },
  {
    title: "副本数",
    dataIndex: "replicas",
    key: "replicas",
    width: 120,
    render: (_: number, record: DeploymentItem) => (
      <span>
        <strong style={{ color: record.readyReplicas === record.replicas ? "#52c41a" : "#faad14" }}>
          {record.readyReplicas}
        </strong>
        /{record.replicas}
      </span>
    ),
  },
  {
    title: "状态",
    dataIndex: "replicas",
    key: "status",
    width: 120,
    render: (_: number, record: DeploymentItem) => {
      const status = getStatusTag(record.readyReplicas, record.replicas);
      return (
        <Tag color={status.color} icon={getStatusIcon(record.readyReplicas, record.replicas)}>
          {status.text}
        </Tag>
      );
    },
  },
  {
    title: "创建时间",
    dataIndex: "creationTimestamp",
    key: "creationTimestamp",
    width: 200,
    sorter: (a, b) =>
      new Date(a.creationTimestamp).getTime() - new Date(b.creationTimestamp).getTime(),
    defaultSortOrder: "descend",
    render: (value: string) => (
      <span title={formatTime(value, "absolute")}>{formatTime(value, "relative")}</span>
    ),
  },
];

export default function DeploymentList({
  initialData = [],
  initialNamespaces = [],
  initialLoaded = false,
}: DeploymentListProps) {
  const [data, setData] = useState<DeploymentItem[]>(initialData);
  const [loading, setLoading] = useState(!initialLoaded);
  const [namespaces, setNamespaces] = useState<string[]>(initialNamespaces);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const params = useParams();
  const clusterId = params.id as string;

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
    const fetchDeployments = async () => {
      try {
        setLoading(true);
        const url = selectedNamespace
          ? `/api/deployments?namespace=${selectedNamespace}`
          : "/api/deployments";
        const response = await fetch(url);
        const result = await response.json();

        if (result.items) {
          const mappedData: DeploymentItem[] = result.items.map((item: any, index: number) => ({
            key: item.metadata?.uid || `deploy-${index}`,
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
        console.error("Failed to fetch deployments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, [initialLoaded, selectedNamespace]);

  // 提取所有唯一的命名空间用于筛选
  const namespaceFilters = [...new Set(data.map((d) => d.namespace))].map((ns) => ({
    text: ns,
    value: ns,
  }));

  // 更新列的筛选器
  const columnsWithFilters = columns.map((col) => {
    if (col.key === "namespace") {
      return { ...col, filters: namespaceFilters };
    }
    return col;
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Space wrap>
          <AppLinkButton variant="primary" href={`/cluster/${clusterId}/deployment/create`}>
            新建
          </AppLinkButton>
          <AppLinkButton href={`/cluster/${clusterId}/yaml-create?kind=Deployment`}>
            YAML新建
          </AppLinkButton>
        </Space>
        <Select
          placeholder="选择命名空间"
          allowClear
          style={{ width: 180 }}
          value={selectedNamespace}
          onChange={(value) => setSelectedNamespace(value)}
          options={namespaces.map((ns) => ({ value: ns, label: ns }))}
        />
      </div>
      <Card size="small">
        {loading ? (
          <TableSkeleton />
        ) : data.length === 0 ? (
          <EmptyState
            title="暂无 Deployment"
            description="还没有任何 Deployment，点击下方按钮创建第一个"
            action={
              <AppLinkButton variant="primary" href={`/cluster/${clusterId}/deployment/create`}>
                创建 Deployment
              </AppLinkButton>
            }
          />
        ) : (
          <Table columns={columnsWithFilters} dataSource={data} pagination={false} rowKey="key" />
        )}
      </Card>
    </div>
  );
}
