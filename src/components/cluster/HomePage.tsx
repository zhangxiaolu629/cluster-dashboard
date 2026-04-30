"use client";

import { Card, Row, Col, Tag, Button, message, Statistic, Skeleton, Typography } from "antd";
import {
  CloudOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PlusOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useCallback } from "react";
import ClusterCard from "./ClusterCard";

const { Title, Text } = Typography;

const STATUS_CONFIG = {
  Running: { color: "#52c41a", icon: <CheckCircleOutlined />, bg: "#f6ffed", border: "#b7eb8f" },
  Creating: { color: "#1677ff", icon: <LoadingOutlined />, bg: "#e6f4ff", border: "#91caff" },
  Failed: { color: "#ff4d4f", icon: <CloseCircleOutlined />, bg: "#fff2f0", border: "#ffccc7" },
  default: { color: "#8c8c8c", icon: <CloudOutlined />, bg: "#f5f5f5", border: "#d9d9d9" },
} as const;

interface Cluster {
  Id: string;
  Name: string;
  Status: {
    Phase: string;
  };
}

interface ClusterStats {
  total: number;
  running: number;
  failed: number;
  creating: number;
}

interface HomePageProps {
  initialClusters?: any[];
  initialLoaded?: boolean;
}

export default function HomePage({ initialClusters = [], initialLoaded = false }: HomePageProps) {
  const [clusters, setClusters] = useState<Cluster[]>(initialClusters);
  const [loading, setLoading] = useState(!initialLoaded);
  const [stats, setStats] = useState<ClusterStats>({
    total: 0,
    running: 0,
    failed: 0,
    creating: 0,
  });
  useEffect(() => {
    if (!initialLoaded) {
      const fetchClusters = async () => {
        try {
          setLoading(true);
          const response = await fetch("/api/volcengine", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          });
          const data = await response.json();

          if (data?.Result?.Items) {
            setClusters(data.Result.Items);
            calculateStats(data.Result.Items);
          }
        } catch (error) {
          console.error("获取集群列表失败:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchClusters();
    } else if (initialClusters.length > 0) {
      calculateStats(initialClusters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoaded]);

  const calculateStats = (items: Cluster[]) => {
    const stats: ClusterStats = {
      total: items.length,
      running: items.filter((c) => c.Status.Phase === "Running").length,
      failed: items.filter((c) => c.Status.Phase === "Failed").length,
      creating: items.filter((c) => c.Status.Phase === "Creating").length,
    };
    setStats(stats);
  };

  const handleCopyId = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      message.success("集群ID已复制到剪贴板");
    } catch (error) {
      message.error("复制失败，请手动复制");
    }
  }, []);

  const getStatusConfig = (phase: string) => {
    return STATUS_CONFIG[phase as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.default;
  };

  const runningClusters = clusters.filter((c) => c.Status.Phase === "Running");
  const otherClusters = clusters.filter((c) => c.Status.Phase !== "Running");

  return (
    <div
      style={{
        padding: 0,
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div style={{ padding: "48px 24px 24px" }}>
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: 24,
            padding: 48,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Row gutter={[24, 32]} align="middle">
            <Col xs={24}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                  }}
                >
                  <CloudOutlined style={{ fontSize: 32, color: "#fff" }} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, color: "#1a1a2e" }}>
                    欢迎使用 K8s 集群管理平台
                  </Title>
                  <Text type="secondary" style={{ fontSize: 16 }}>
                    轻松管理您的 Kubernetes 集群资源
                  </Text>
                </div>
              </div>
            </Col>
          </Row>

          {loading ? (
            <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
              {[1, 2, 3, 4].map((i) => (
                <Col xs={12} sm={6} key={i}>
                  <Skeleton active paragraph={{ rows: 1 }} />
                </Col>
              ))}
            </Row>
          ) : (
            stats.total > 0 && (
              <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 16, textAlign: "center" }}>
                    <Statistic
                      title={<Text type="secondary">集群总数</Text>}
                      value={stats.total}
                      styles={{ content: { color: "#667eea", fontWeight: 600 } }}
                      prefix={<CloudOutlined style={{ marginRight: 8 }} />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 16, textAlign: "center" }}>
                    <Statistic
                      title={<Text type="secondary">运行中</Text>}
                      value={stats.running}
                      styles={{ content: { color: "#52c41a", fontWeight: 600 } }}
                      prefix={<CheckCircleOutlined style={{ marginRight: 8 }} />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 16, textAlign: "center" }}>
                    <Statistic
                      title={<Text type="secondary">创建中</Text>}
                      value={stats.creating}
                      styles={{ content: { color: "#1677ff", fontWeight: 600 } }}
                      prefix={<LoadingOutlined style={{ marginRight: 8 }} />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 16, textAlign: "center" }}>
                    <Statistic
                      title={<Text type="secondary">异常</Text>}
                      value={stats.failed}
                      styles={{ content: { color: "#ff4d4f", fontWeight: 600 } }}
                      prefix={<CloseCircleOutlined style={{ marginRight: 8 }} />}
                    />
                  </Card>
                </Col>
              </Row>
            )
          )}
        </div>

        {stats.total > 0 && (
          <>
            {runningClusters.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 4,
                      height: 24,
                      background: "linear-gradient(180deg, #52c41a 0%, #73d13d 100%)",
                      borderRadius: 2,
                    }}
                  />
                  <Title level={4} style={{ margin: 0, color: "#fff" }}>
                    运行中的集群 ({runningClusters.length})
                  </Title>
                </div>
                <Row gutter={[16, 16]}>
                  {runningClusters.map((cluster) => (
                    <Col xs={24} sm={12} md={8} key={cluster.Id}>
                      <ClusterCard
                        id={cluster.Id}
                        name={cluster.Name}
                        phase={cluster.Status.Phase}
                        statusConfig={getStatusConfig(cluster.Status.Phase)}
                        onCopyId={handleCopyId}
                      />
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {otherClusters.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 4,
                      height: 24,
                      background: "linear-gradient(180deg, #8c8c8c 0%, #bfbfbf 100%)",
                      borderRadius: 2,
                    }}
                  />
                  <Title level={4} style={{ margin: 0, color: "#fff" }}>
                    其他状态 ({otherClusters.length})
                  </Title>
                </div>
                <Row gutter={[16, 16]}>
                  {otherClusters.map((cluster) => (
                    <Col xs={24} sm={12} md={8} key={cluster.Id}>
                      <ClusterCard
                        id={cluster.Id}
                        name={cluster.Name}
                        phase={cluster.Status.Phase}
                        statusConfig={getStatusConfig(cluster.Status.Phase)}
                        onCopyId={handleCopyId}
                      />
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </>
        )}

        {!loading && clusters.length === 0 && (
          <Card
            style={{
              textAlign: "center",
              marginTop: 48,
              borderRadius: 24,
              padding: "48px 24px",
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                boxShadow: "0 12px 40px rgba(102, 126, 234, 0.3)",
              }}
            >
              <CloudOutlined style={{ fontSize: 56, color: "#fff" }} />
            </div>
            <Title level={3} style={{ marginBottom: 8 }}>
              暂无可管理的集群
            </Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
              点击下方按钮创建您的第一个 Kubernetes 集群
            </Text>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: 12,
                height: 48,
                paddingInline: 32,
                fontWeight: 500,
              }}
            >
              创建集群
            </Button>
            <div style={{ marginTop: 24 }}>
              <Button type="link" icon={<FileTextOutlined />}>
                查看文档
              </Button>
            </div>
          </Card>
        )}

        <div style={{ textAlign: "center", marginTop: 48, paddingBottom: 24 }}>
          <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13 }}>
            K8s 集群管理平台 © 2026 · 提供稳定、可靠的集群管理服务
          </Text>
        </div>
      </div>
    </div>
  );
}
