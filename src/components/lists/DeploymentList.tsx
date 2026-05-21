"use client";

import { Table, Card, Tag, Select, Space, Button, Modal, Input, message } from "antd";
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

type NamespaceResponse = {
  items?: Array<{
    metadata?: {
      name?: string;
    };
  }>;
};

type DeploymentResponse = {
  items?: Array<{
    metadata?: {
      uid?: string;
      name?: string;
      namespace?: string;
      creationTimestamp?: string;
    };
    spec?: {
      replicas?: number;
    };
    status?: {
      readyReplicas?: number;
    };
  }>;
};

type ResourceYamlResponse = {
  yaml?: string;
};

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
  const [yamlModalOpen, setYamlModalOpen] = useState(false);
  const [yamlModalLoading, setYamlModalLoading] = useState(false);
  const [yamlUpdating, setYamlUpdating] = useState(false);
  const [editingYaml, setEditingYaml] = useState("");
  const [editingResource, setEditingResource] = useState<{
    name: string;
    namespace: string;
  } | null>(null);
  const params = useParams();
  const clusterId = params.id as string;

  const fetchDeployments = async (namespace?: string | null) => {
    try {
      setLoading(true);
      const url = namespace ? `/api/deployments?namespace=${namespace}` : "/api/deployments";
      const response = await fetch(url);
      const result = (await response.json()) as DeploymentResponse;

      if (result.items) {
        const mappedData: DeploymentItem[] = result.items.map((item, index) => ({
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
      message.error("刷新 Deployment 列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialLoaded && initialNamespaces.length > 0) {
      return;
    }
    const fetchNamespaces = async () => {
      try {
        const response = await fetch("/api/namespaces");
        const result = (await response.json()) as NamespaceResponse;
        if (result.items) {
          const names = result.items
            .map((item) => item.metadata?.name)
            .filter((name): name is string => Boolean(name));
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
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDeployments(selectedNamespace);
  }, [initialLoaded, selectedNamespace]);

  const handleRefresh = () => {
    fetchDeployments(selectedNamespace);
  };

  const handleDelete = (record: DeploymentItem) => {
    Modal.confirm({
      title: "确认删除",
      content: `确认删除 Deployment ${record.name} 吗？`,
      okText: "确认删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        const query = new URLSearchParams({
          kind: "Deployment",
          name: record.name,
          namespace: record.namespace,
        });
        const res = await fetch(`/api/kubernetes/resource?${query.toString()}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          message.error("删除失败");
          return;
        }
        message.success("删除成功");
        fetchDeployments(selectedNamespace);
      },
    });
  };

  const openYamlModal = async (record: DeploymentItem) => {
    setYamlModalOpen(true);
    setYamlModalLoading(true);
    setEditingYaml("");
    setEditingResource({ name: record.name, namespace: record.namespace });
    try {
      const query = new URLSearchParams({
        kind: "Deployment",
        name: record.name,
        namespace: record.namespace,
      });
      const res = await fetch(`/api/kubernetes/resource?${query.toString()}`);
      const result = (await res.json()) as ResourceYamlResponse;
      setEditingYaml(result.yaml || "");
    } catch (error) {
      console.error("Failed to fetch deployment yaml:", error);
      message.error("获取 YAML 失败");
      setYamlModalOpen(false);
    } finally {
      setYamlModalLoading(false);
    }
  };

  const handleYamlUpdate = async () => {
    if (!editingResource) return;
    setYamlUpdating(true);
    try {
      const res = await fetch("/api/kubernetes/resource", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "Deployment",
          name: editingResource.name,
          namespace: editingResource.namespace,
          yaml: editingYaml,
        }),
      });
      if (!res.ok) {
        message.error("YAML 更新失败");
        return;
      }
      message.success("YAML 更新成功");
      setYamlModalOpen(false);
      fetchDeployments(selectedNamespace);
    } catch (error) {
      console.error("Failed to update deployment yaml:", error);
      message.error("YAML 更新失败");
    } finally {
      setYamlUpdating(false);
    }
  };

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
  const actionColumn: ColumnsType<DeploymentItem>[number] = {
    title: "操作",
    key: "actions",
    width: 220,
    render: (_: unknown, record: DeploymentItem) => (
      <Space size="small">
        <Button size="small" danger onClick={() => handleDelete(record)}>
          删除
        </Button>
        <Button size="small" onClick={() => openYamlModal(record)}>
          YAML更新
        </Button>
      </Space>
    ),
  };
  const tableColumns = [...columnsWithFilters, actionColumn];

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
        <Space>
          <Button onClick={handleRefresh}>刷新</Button>
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
          <Table columns={tableColumns} dataSource={data} pagination={false} rowKey="key" />
        )}
      </Card>
      <Modal
        title={
          editingResource
            ? `YAML更新 - ${editingResource.namespace}/${editingResource.name}`
            : "YAML更新"
        }
        open={yamlModalOpen}
        onCancel={() => setYamlModalOpen(false)}
        onOk={handleYamlUpdate}
        confirmLoading={yamlUpdating}
        okButtonProps={{ disabled: yamlModalLoading || !editingYaml.trim() }}
        width={760}
      >
        <Input.TextArea
          value={editingYaml}
          onChange={(e) => setEditingYaml(e.target.value)}
          autoSize={{ minRows: 16, maxRows: 24 }}
          disabled={yamlModalLoading}
        />
      </Modal>
    </div>
  );
}
