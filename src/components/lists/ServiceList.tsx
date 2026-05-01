"use client";

import { Table, Card, Tag, Spin, Input, Button, Modal, Space, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState, useEffect, useMemo } from "react";
import AppLinkButton from "@/components/common/AppLinkButton";
import dayjs from "dayjs";

export type ServiceItem = {
  key: string;
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  creationTimestamp: string;
};

interface ServiceListProps {
  clusterId: string;
  initialData?: ServiceItem[];
  initialLoaded?: boolean;
}

type ServiceResponse = {
  items?: Array<{
    metadata?: {
      uid?: string;
      name?: string;
      namespace?: string;
      creationTimestamp?: string;
    };
    spec?: {
      type?: string;
      clusterIP?: string;
    };
  }>;
};

type ResourceYamlResponse = {
  yaml?: string;
};

const typeColors: Record<string, string> = {
  ClusterIP: "blue",
  NodePort: "orange",
  LoadBalancer: "green",
  ExternalName: "purple",
};

const columns: ColumnsType<ServiceItem> = [
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
    title: "类型",
    dataIndex: "type",
    key: "type",
    width: 120,
    render: (value: string) => <Tag color={typeColors[value] || "default"}>{value}</Tag>,
  },
  {
    title: "ClusterIP",
    dataIndex: "clusterIP",
    key: "clusterIP",
    width: 150,
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

export default function ServiceList({
  clusterId,
  initialData = [],
  initialLoaded = false,
}: ServiceListProps) {
  const [data, setData] = useState<ServiceItem[]>(initialData);
  const [loading, setLoading] = useState(!initialLoaded);
  const [searchText, setSearchText] = useState("");
  const [yamlModalOpen, setYamlModalOpen] = useState(false);
  const [yamlModalLoading, setYamlModalLoading] = useState(false);
  const [yamlUpdating, setYamlUpdating] = useState(false);
  const [editingYaml, setEditingYaml] = useState("");
  const [editingResource, setEditingResource] = useState<{
    name: string;
    namespace: string;
  } | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/services");
      const result = (await response.json()) as ServiceResponse;

      if (result.items) {
        const mappedData: ServiceItem[] = result.items.map((item, index: number) => ({
          key: item.metadata?.uid || `svc-${index}`,
          name: item.metadata?.name || "",
          namespace: item.metadata?.namespace || "",
          type: item.spec?.type || "ClusterIP",
          clusterIP: item.spec?.clusterIP || "",
          creationTimestamp: item.metadata?.creationTimestamp || new Date().toISOString(),
        }));
        setData(mappedData);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
      message.error("刷新 Service 列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialLoaded) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchServices();
  }, [initialLoaded]);

  const handleDelete = (record: ServiceItem) => {
    Modal.confirm({
      title: "确认删除",
      content: `确认删除 Service ${record.name} 吗？`,
      okText: "确认删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        const query = new URLSearchParams({
          kind: "Service",
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
        fetchServices();
      },
    });
  };

  const openYamlModal = async (record: ServiceItem) => {
    setYamlModalOpen(true);
    setYamlModalLoading(true);
    setEditingResource({ name: record.name, namespace: record.namespace });
    try {
      const query = new URLSearchParams({
        kind: "Service",
        name: record.name,
        namespace: record.namespace,
      });
      const res = await fetch(`/api/kubernetes/resource?${query.toString()}`);
      const result = (await res.json()) as ResourceYamlResponse;
      setEditingYaml(result.yaml || "");
    } catch (error) {
      console.error("Failed to fetch service yaml:", error);
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
          kind: "Service",
          yaml: editingYaml,
        }),
      });
      if (!res.ok) {
        message.error("YAML 更新失败");
        return;
      }
      message.success("YAML 更新成功");
      setYamlModalOpen(false);
      fetchServices();
    } catch (error) {
      console.error("Failed to update service yaml:", error);
      message.error("YAML 更新失败");
    } finally {
      setYamlUpdating(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchText) return data;
    const lower = searchText.toLowerCase();
    return data.filter((svc) => svc.name.toLowerCase().includes(lower));
  }, [searchText, data]);

  const tableColumns: ColumnsType<ServiceItem> = [
    ...columns,
    {
      title: "操作",
      key: "actions",
      width: 220,
      render: (_: unknown, record: ServiceItem) => (
        <Space size="small">
          <Button size="small" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
          <Button size="small" onClick={() => openYamlModal(record)}>
            YAML更新
          </Button>
        </Space>
      ),
    },
  ];

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
        <Space>
          <AppLinkButton variant="primary" href={`/cluster/${clusterId}/yaml-create?kind=Service`}>
            YAML新建
          </AppLinkButton>
          <Button onClick={fetchServices}>刷新</Button>
        </Space>
        <Input.Search
          placeholder="搜索Service名称..."
          allowClear
          style={{ width: 250 }}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <Card size="small">
        <Spin spinning={loading}>
          <Table columns={tableColumns} dataSource={filteredData} pagination={false} rowKey="key" />
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
