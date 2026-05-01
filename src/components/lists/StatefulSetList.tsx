"use client";

import { Table, Card, Tag, Spin, Select, Space, Button, Modal, Input, message } from "antd";
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

type NamespaceResponse = {
  items?: Array<{
    metadata?: {
      name?: string;
    };
  }>;
};

type StatefulSetResponse = {
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
  const [yamlModalOpen, setYamlModalOpen] = useState(false);
  const [yamlModalLoading, setYamlModalLoading] = useState(false);
  const [yamlUpdating, setYamlUpdating] = useState(false);
  const [editingYaml, setEditingYaml] = useState("");
  const [editingResource, setEditingResource] = useState<{
    name: string;
    namespace: string;
  } | null>(null);

  const fetchStatefulSets = async (namespace?: string | null) => {
    try {
      setLoading(true);
      const url = namespace ? `/api/statefulsets?namespace=${namespace}` : "/api/statefulsets";
      const response = await fetch(url);
      const result = (await response.json()) as StatefulSetResponse;

      if (result.items) {
        const mappedData: StatefulSetItem[] = result.items.map((item, index) => ({
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
      message.error("刷新 StatefulSet 列表失败");
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
    fetchStatefulSets(selectedNamespace);
  }, [initialLoaded, selectedNamespace]);

  const handleRefresh = () => fetchStatefulSets(selectedNamespace);

  const handleDelete = (record: StatefulSetItem) => {
    Modal.confirm({
      title: "确认删除",
      content: `确认删除 StatefulSet ${record.name} 吗？`,
      okText: "确认删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        const query = new URLSearchParams({
          kind: "StatefulSet",
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
        fetchStatefulSets(selectedNamespace);
      },
    });
  };

  const openYamlModal = async (record: StatefulSetItem) => {
    setYamlModalOpen(true);
    setYamlModalLoading(true);
    setEditingResource({ name: record.name, namespace: record.namespace });
    try {
      const query = new URLSearchParams({
        kind: "StatefulSet",
        name: record.name,
        namespace: record.namespace,
      });
      const res = await fetch(`/api/kubernetes/resource?${query.toString()}`);
      const result = (await res.json()) as ResourceYamlResponse;
      setEditingYaml(result.yaml || "");
    } catch (error) {
      console.error("Failed to fetch statefulset yaml:", error);
      message.error("获取 YAML 失败");
      setYamlModalOpen(false);
    } finally {
      setYamlModalLoading(false);
    }
  };

  const handleYamlUpdate = async () => {
    setYamlUpdating(true);
    try {
      const res = await fetch("/api/kubernetes/resource", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "StatefulSet",
          yaml: editingYaml,
        }),
      });
      if (!res.ok) {
        message.error("YAML 更新失败");
        return;
      }
      message.success("YAML 更新成功");
      setYamlModalOpen(false);
      fetchStatefulSets(selectedNamespace);
    } catch (error) {
      console.error("Failed to update statefulset yaml:", error);
      message.error("YAML 更新失败");
    } finally {
      setYamlUpdating(false);
    }
  };

  const actionColumn: ColumnsType<StatefulSetItem>[number] = {
    title: "操作",
    key: "actions",
    width: 220,
    render: (_: unknown, record: StatefulSetItem) => (
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
  const tableColumns = [...columns, actionColumn];

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
        <AppLinkButton
          variant="primary"
          href={`/cluster/${clusterId}/yaml-create?kind=StatefulSet`}
        >
          YAML新建
        </AppLinkButton>
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
        <Spin spinning={loading}>
          <Table columns={tableColumns} dataSource={data} pagination={false} rowKey="key" />
        </Spin>
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
