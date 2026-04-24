"use client";

import { Input, Table, Card } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useState, useMemo } from "react";
import dayjs from "dayjs";

type Namespace = {
  key: string;
  name: string;
  creationTimestamp: string;
};

const mockNamespaces: Namespace[] = Array.from({ length: 55 }, (_, i) => ({
  key: `ns-${i}`,
  name: i === 0 ? "kube-system" : i === 1 ? "default" : i === 2 ? "kube-public" : `namespace-${i}`,
  creationTimestamp: dayjs()
    .subtract(i, "day")
    .subtract(i * 30, "minute")
    .toISOString(),
}));

const columns = [
  {
    title: "名称",
    dataIndex: "name",
    key: "name",
    width: 300,
  },
  {
    title: "创建时间",
    dataIndex: "creationTimestamp",
    key: "creationTimestamp",
    sorter: (a: Namespace, b: Namespace) =>
      new Date(a.creationTimestamp).getTime() -
      new Date(b.creationTimestamp).getTime(),
    defaultSortOrder: "descend" as const,
    render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm:ss"),
  },
];

export default function NamespaceList() {
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const filteredData = useMemo(() => {
    if (!searchText) return mockNamespaces;
    const lower = searchText.toLowerCase();
    return mockNamespaces.filter((ns) =>
      ns.name.toLowerCase().includes(lower)
    );
  }, [searchText]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <Input.Search
          placeholder="搜索命名空间..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 300 }}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>
      <Card size="small" variant="borderless">
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
      </Card>
    </div>
  );
}
