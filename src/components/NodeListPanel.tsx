"use client";

import { Table, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

type Node = {
  key: string;
  name: string;
  creationTimestamp: string;
};

const mockNodes: Node[] = Array.from({ length: 10 }, (_, i) => ({
  key: `node-${i}`,
  name: i === 0 ? "master-01" : i === 1 ? "worker-01" : i === 2 ? "worker-02" : `node-${i}`,
  creationTimestamp: dayjs()
    .subtract(i, "day")
    .subtract(i * 20, "minute")
    .toISOString(),
}));

const columns: ColumnsType<Node> = [
  {
    title: "节点名称",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "创建时间",
    dataIndex: "creationTimestamp",
    key: "creationTimestamp",
    sorter: (a, b) =>
      new Date(a.creationTimestamp).getTime() -
      new Date(b.creationTimestamp).getTime(),
    defaultSortOrder: "descend",
    render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm:ss"),
  },
];

export default function NodeListPanel() {
  return (
    <Card size="small" variant="borderless">
      <Table
        columns={columns}
        dataSource={mockNodes}
        pagination={false}
        rowKey="key"
      />
    </Card>
  );
}
