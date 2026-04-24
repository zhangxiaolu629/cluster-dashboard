"use client";

import { Table, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

type Pod = {
  key: string;
  name: string;
  creationTimestamp: string;
};

const mockPods: Pod[] = Array.from({ length: 15 }, (_, i) => ({
  key: `pod-${i}`,
  name: i === 0 ? "coredns-abc123" : i === 1 ? "kube-proxy-xyz" : `pod-${i}`,
  creationTimestamp: dayjs()
    .subtract(i, "day")
    .subtract(i * 15, "minute")
    .toISOString(),
}));

const columns: ColumnsType<Pod> = [
  {
    title: "Pod 名称",
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

export default function PodListPanel() {
  return (
    <Card size="small" variant="borderless">
      <Table
        columns={columns}
        dataSource={mockPods}
        pagination={false}
        rowKey="key"
      />
    </Card>
  );
}
