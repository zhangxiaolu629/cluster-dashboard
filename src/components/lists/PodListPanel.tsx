"use client";

import { Table, Card, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState, useEffect } from "react";
import dayjs from "dayjs";

type Pod = {
  key: string;
  name: string;
  creationTimestamp: string;
};

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
  const [data, setData] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPods = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/pods");
        const result = await response.json();

        if (result.items) {
          const mappedData: Pod[] = result.items.map((item: any, index: number) => ({
            key: item.metadata?.uid || `pod-${index}`,
            name: item.metadata?.name || "",
            creationTimestamp: item.metadata?.creationTimestamp || new Date().toISOString(),
          }));
          setData(mappedData);
        }
      } catch (error) {
        console.error("Failed to fetch pods:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPods();
  }, []);

  return (
    <Card size="small">
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          rowKey="key"
        />
      </Spin>
    </Card>
  );
}
