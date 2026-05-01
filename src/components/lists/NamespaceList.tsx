"use client";

import { Input, Table, Card, Spin, Button, Modal, Space, message } from "antd";
import AppLinkButton from "@/components/common/AppLinkButton";
import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";

export type NamespaceItem = {
  key: string;
  name: string;
  status: string;
  creationTimestamp: string;
};

const columns = [
  {
    title: "名称",
    dataIndex: "name",
    key: "name",
    width: 300,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 120,
  },
  {
    title: "创建时间",
    dataIndex: "creationTimestamp",
    key: "creationTimestamp",
    sorter: (a: NamespaceItem, b: NamespaceItem) =>
      new Date(a.creationTimestamp).getTime() - new Date(b.creationTimestamp).getTime(),
    defaultSortOrder: "descend" as const,
    render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm:ss"),
  },
];

type ResourceYamlResponse = {
  yaml?: string;
};

interface NamespaceListProps {
  clusterId: string;
  initialData?: NamespaceItem[];
  initialLoaded?: boolean;
}

type NamespaceResponse = {
  items?: Array<{
    metadata?: {
      uid?: string;
      name?: string;
      creationTimestamp?: string;
    };
    status?: {
      phase?: string;
    };
  }>;
};

export default function NamespaceList({
  clusterId,
  initialData = [],
  initialLoaded = false,
}: NamespaceListProps) {
  const [data, setData] = useState<NamespaceItem[]>(initialData);
  const [loading, setLoading] = useState(!initialLoaded);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [yamlModalOpen, setYamlModalOpen] = useState(false);
  const [yamlModalLoading, setYamlModalLoading] = useState(false);
  const [yamlUpdating, setYamlUpdating] = useState(false);
  const [editingYaml, setEditingYaml] = useState("");
  const [editingName, setEditingName] = useState<string>("");
  const pageSize = 20;

  const fetchNamespaces = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/namespaces");
      const result = (await response.json()) as NamespaceResponse;

      if (result.items) {
        const mappedData: NamespaceItem[] = result.items.map((item, index: number) => ({
          key: item.metadata?.uid || `ns-${index}`,
          name: item.metadata?.name || "",
          status: item.status?.phase || "Unknown",
          creationTimestamp: item.metadata?.creationTimestamp || new Date().toISOString(),
        }));
        setData(mappedData);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch namespaces:", error);
      message.error("刷新命名空间列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialLoaded) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNamespaces();
  }, [initialLoaded]);

  const handleDelete = (record: NamespaceItem) => {
    Modal.confirm({
      title: "确认删除",
      content: `确认删除命名空间 ${record.name} 吗？`,
      okText: "确认删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        const query = new URLSearchParams({
          kind: "Namespace",
          name: record.name,
        });
        const res = await fetch(`/api/kubernetes/resource?${query.toString()}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          message.error("删除失败");
          return;
        }
        message.success("删除成功");
        fetchNamespaces();
      },
    });
  };

  const openYamlModal = async (record: NamespaceItem) => {
    setYamlModalOpen(true);
    setYamlModalLoading(true);
    setEditingName(record.name);
    try {
      const query = new URLSearchParams({
        kind: "Namespace",
        name: record.name,
      });
      const res = await fetch(`/api/kubernetes/resource?${query.toString()}`);
      const result = (await res.json()) as ResourceYamlResponse;
      setEditingYaml(result.yaml || "");
    } catch (error) {
      console.error("Failed to fetch namespace yaml:", error);
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
          kind: "Namespace",
          yaml: editingYaml,
        }),
      });
      if (!res.ok) {
        message.error("YAML 更新失败");
        return;
      }
      message.success("YAML 更新成功");
      setYamlModalOpen(false);
      fetchNamespaces();
    } catch (error) {
      console.error("Failed to update namespace yaml:", error);
      message.error("YAML 更新失败");
    } finally {
      setYamlUpdating(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchText) return data;
    const lower = searchText.toLowerCase();
    return data.filter((ns) => ns.name.toLowerCase().includes(lower));
  }, [searchText, data]);

  const tableColumns = [
    ...columns,
    {
      title: "操作",
      key: "actions",
      width: 220,
      render: (_: unknown, record: NamespaceItem) => (
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
          <AppLinkButton
            variant="primary"
            href={`/cluster/${clusterId}/yaml-create?kind=Namespace`}
          >
            YAML新建
          </AppLinkButton>
          <Button onClick={fetchNamespaces}>刷新</Button>
        </Space>
        <Input.Search
          placeholder="搜索命名空间..."
          allowClear
          style={{ width: 300 }}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>
      <Card size="small">
        <Spin spinning={loading}>
          <Table
            columns={tableColumns}
            dataSource={filteredData}
            pagination={{
              current: currentPage,
              pageSize,
              total: filteredData.length,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page) => setCurrentPage(page),
            }}
            rowKey="key"
          />
        </Spin>
      </Card>
      <Modal
        title={editingName ? `YAML更新 - ${editingName}` : "YAML更新"}
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
