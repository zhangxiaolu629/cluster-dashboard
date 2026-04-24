"use client";

import { Table, Card, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import dayjs from "dayjs";

type Event = {
  key: string;
  type: string;
  message: string;
  creationTimestamp: string;
};

const mockEvents: Event[] = Array.from({ length: 45 }, (_, i) => ({
  key: `event-${i}`,
  type: i % 3 === 0 ? "Normal" : i % 3 === 1 ? "Warning" : "Error",
  message: `Event message ${i}: ${["Pod scheduled", "Container started", "Health check failed", "Node not ready", "Image pulled"][i % 5]}`,
  creationTimestamp: dayjs()
    .subtract(i, "hour")
    .subtract(i * 5, "minute")
    .toISOString(),
}));

const typeColors: Record<string, string> = {
  Normal: "green",
  Warning: "orange",
  Error: "red",
};

const columns: ColumnsType<Event> = [
  {
    title: "事件类型",
    dataIndex: "type",
    key: "type",
    width: 120,
    render: (value: string) => (
      <Tag color={typeColors[value] || "default"}>{value}</Tag>
    ),
  },
  {
    title: "事件内容",
    dataIndex: "message",
    key: "message",
  },
  {
    title: "创建时间",
    dataIndex: "creationTimestamp",
    key: "creationTimestamp",
    width: 200,
    sorter: (a, b) =>
      new Date(a.creationTimestamp).getTime() -
      new Date(b.creationTimestamp).getTime(),
    defaultSortOrder: "descend",
    render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm:ss"),
  },
];

export default function EventList() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  return (
    <Card size="small" variant="borderless">
      <Table
        columns={columns}
        dataSource={mockEvents}
        pagination={{
          current: currentPage,
          pageSize,
          total: mockEvents.length,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page) => setCurrentPage(page),
        }}
        rowKey="key"
      />
    </Card>
  );
}
