"use client";

import { Card, Descriptions, Tag, Spin } from "antd";
import { useState, useEffect } from "react";
import dayjs from "dayjs";

interface ClusterInfo {
  Id?: string;
  metadata: {
    name: string;
    creationTimestamp: string;
  };
  Status: {
    Phase: string;
  };
}

interface ClusterSummaryProps {
  clusterId?: string;
  initialClusterInfo?: ClusterInfo | null;
  initialLoaded?: boolean;
}

type VolcClusterItem = {
  Id?: string;
  Name?: string;
  CreateTime?: string;
  Status?: {
    Phase?: string;
  };
};

type VolcClusterResponse = {
  Result?: {
    Items?: VolcClusterItem[];
  };
};

export default function ClusterSummary({
  clusterId,
  initialClusterInfo = null,
  initialLoaded = false,
}: ClusterSummaryProps) {
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(initialClusterInfo);
  const [loading, setLoading] = useState(!initialLoaded);

  useEffect(() => {
    if (initialLoaded) {
      return;
    }
    const fetchVolcengineClusters = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/volcengine", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        const data = (await response.json()) as VolcClusterResponse;

        if (data?.Result?.Items && data.Result.Items.length > 0) {
          const matchedCluster = clusterId
            ? data.Result.Items.find((item) => item?.Id === clusterId) || data.Result.Items[0]
            : data.Result.Items[0];
          setClusterInfo({
            Id: matchedCluster.Id,
            metadata: {
              name: matchedCluster.Name ?? "",
              creationTimestamp: matchedCluster.CreateTime ?? "",
            },
            Status: {
              Phase: matchedCluster.Status?.Phase ?? "Unknown",
            },
          });
        }
      } catch (error) {
        console.error("Failed to fetch volcengine clusters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVolcengineClusters();
  }, [clusterId, initialLoaded]);

  return (
    <Card title="集群信息" size="small" style={{ marginBottom: 16 }}>
      <Spin spinning={loading}>
        <Descriptions column={1} size="small" colon>
          <Descriptions.Item label="集群名称">
            {clusterInfo?.metadata?.name || "demo-cluster"}
          </Descriptions.Item>
          <Descriptions.Item label="集群状态">
            <Tag
              color={
                clusterInfo?.Status?.Phase === "Running"
                  ? "success"
                  : clusterInfo?.Status?.Phase === "Creating"
                    ? "processing"
                    : "error"
              }
            >
              {clusterInfo?.Status?.Phase || "未知"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {clusterInfo?.metadata?.creationTimestamp
              ? dayjs(clusterInfo.metadata.creationTimestamp).format("YYYY-MM-DD HH:mm:ss")
              : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Spin>
    </Card>
  );
}
