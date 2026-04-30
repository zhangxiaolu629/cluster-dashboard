"use client";

import { Skeleton, Table } from "antd";
import type { ColumnsType } from "antd/es/table";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export default function TableSkeleton({ columns = 5, rows = 5 }: TableSkeletonProps) {
  const skeletonColumns: ColumnsType<Record<string, string>> = Array.from({ length: columns }).map(
    (_, i) => ({
      title: <Skeleton.Input style={{ width: 80 }} active />,
      dataIndex: `col-${i}`,
      key: `col-${i}`,
      render: () => <Skeleton.Input style={{ width: 120 }} active />,
    })
  );

  const skeletonData: Record<string, string>[] = Array.from({ length: rows }).map((_, i) => ({
    key: `row-${i}`,
  }));

  return (
    <Table
      columns={skeletonColumns}
      dataSource={skeletonData}
      pagination={false}
      showHeader={false}
    />
  );
}
