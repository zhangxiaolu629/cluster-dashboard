"use client";

import { Table, Card, Tag, Spin, Input } from "antd";
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

  useEffect(() => {
    if (initialLoaded) {
      return;
    }
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/services");
        const result = await response.json();

        if (result.items) {
          const mappedData: ServiceItem[] = result.items.map((item: any, index: number) => ({
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
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [initialLoaded]);

  const filteredData = useMemo(() => {
    if (!searchText) return data;
    const lower = searchText.toLowerCase();
    return data.filter((svc) => svc.name.toLowerCase().includes(lower));
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
        <AppLinkButton variant="primary" href={`/cluster/${clusterId}/yaml-create?kind=Service`}>
          YAML新建
        </AppLinkButton>
        <Input.Search
          placeholder="搜索Service名称..."
          allowClear
          style={{ width: 250 }}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <Card size="small">
        <Spin spinning={loading}>
          <Table columns={columns} dataSource={filteredData} pagination={false} rowKey="key" />
        </Spin>
      </Card>
    </div>
  );
}
