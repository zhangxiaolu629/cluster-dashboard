"use client";

import { Table, Card, Tag, Spin, Select, Space, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import type { K8sEvent } from "@/types/k8s";

export type EventItem = {
  key: string;
  type: string;
  resourceType: string;
  resourceName: string;
  message: string;
  creationTimestamp: string;
};

interface EventListProps {
  initialData?: EventItem[];
  initialLoaded?: boolean;
}

const typeColors: Record<string, string> = {
  Normal: "green",
  Warning: "orange",
  Error: "red",
};

const columns: ColumnsType<EventItem> = [
  {
    title: "发生时间",
    dataIndex: "creationTimestamp",
    key: "creationTimestamp",
    width: 200,
    sorter: (a, b) =>
      new Date(a.creationTimestamp).getTime() - new Date(b.creationTimestamp).getTime(),
    defaultSortOrder: "descend",
    render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm:ss"),
  },
  {
    title: "事件类型",
    dataIndex: "type",
    key: "type",
    width: 100,
    render: (value: string) => <Tag color={typeColors[value] || "default"}>{value}</Tag>,
  },
  {
    title: "资源类型",
    dataIndex: "resourceType",
    key: "resourceType",
    width: 120,
  },
  {
    title: "资源名称",
    dataIndex: "resourceName",
    key: "resourceName",
    width: 200,
  },
  {
    title: "事件内容",
    dataIndex: "message",
    key: "message",
  },
];

export default function EventList({ initialData = [], initialLoaded = false }: EventListProps) {
  const [data, setData] = useState<EventItem[]>(initialData);
  const [loading, setLoading] = useState(!initialLoaded);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string | null>(null);
  const pageSize = 20;

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events");
      const result = await response.json();

      if (result.items) {
        const mappedData: EventItem[] = result.items.map((item: K8sEvent, index: number) => ({
          key: item.metadata?.uid || `event-${index}`,
          type: item.type || item.reason || "Normal",
          resourceType: item.involvedObject?.kind || "",
          resourceName: item.involvedObject?.name || "",
          message: item.message || "",
          creationTimestamp: item.metadata?.creationTimestamp || new Date().toISOString(),
        }));
        setData(mappedData);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      message.error("刷新事件列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialLoaded) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
  }, [initialLoaded]);

  const uniqueResourceTypes = useMemo(() => {
    const types = new Set(data.map((item) => item.resourceType).filter(Boolean));
    return Array.from(types).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (typeFilter && item.type !== typeFilter) return false;
      if (resourceTypeFilter && item.resourceType !== resourceTypeFilter) return false;
      return true;
    });
  }, [data, typeFilter, resourceTypeFilter]);

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <Space>
          <Button onClick={fetchEvents}>刷新</Button>
          <span>筛选：</span>
          <Select
            placeholder="事件类型"
            allowClear
            style={{ width: 120 }}
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            }}
            options={[
              { value: "Normal", label: "Normal" },
              { value: "Warning", label: "Warning" },
              { value: "Error", label: "Error" },
            ]}
          />
          <Select
            placeholder="资源类型"
            allowClear
            style={{ width: 150 }}
            value={resourceTypeFilter}
            onChange={(value) => {
              setResourceTypeFilter(value);
              setCurrentPage(1);
            }}
            options={uniqueResourceTypes.map((type) => ({ value: type, label: type }))}
          />
        </Space>
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
