"use client";

import { Input, Table, Card, Spin } from "antd";
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

interface NamespaceListProps {
  clusterId: string;
  initialData?: NamespaceItem[];
  initialLoaded?: boolean;
}

export default function NamespaceList({
  clusterId,
  initialData = [],
  initialLoaded = false,
}: NamespaceListProps) {
  const [data, setData] = useState<NamespaceItem[]>(initialData);
  const [loading, setLoading] = useState(!initialLoaded);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (initialLoaded) {
      return;
    }
    const fetchNamespaces = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/namespaces");
        const result = await response.json();

        if (result.items) {
          const mappedData: NamespaceItem[] = result.items.map((item: any, index: number) => ({
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
      } finally {
        setLoading(false);
      }
    };

    fetchNamespaces();
  }, [initialLoaded]);

  const filteredData = useMemo(() => {
    if (!searchText) return data;
    const lower = searchText.toLowerCase();
    return data.filter((ns) => ns.name.toLowerCase().includes(lower));
  }, [searchText, data]);

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
        <AppLinkButton variant="primary" href={`/cluster/${clusterId}/yaml-create?kind=Namespace`}>
          YAML新建
        </AppLinkButton>
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
            columns={columns}
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
    </div>
  );
}
