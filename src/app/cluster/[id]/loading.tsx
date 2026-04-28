"use client";

import { Card, Skeleton } from "antd";
import { useParams, usePathname } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";

type PageKey =
  | "cluster"
  | "namespace"
  | "event"
  | "service"
  | "deployment"
  | "statefulset"
  | "yaml-create";

function getSelectedKey(pathname: string): PageKey {
  if (pathname.includes("/namespace")) return "namespace";
  if (pathname.includes("/service")) return "service";
  if (pathname.includes("/event")) return "event";
  if (pathname.includes("/deployment")) return "deployment";
  if (pathname.includes("/statefulset")) return "statefulset";
  if (pathname.includes("/yaml-create")) return "yaml-create";
  return "cluster";
}

export default function ClusterLoading() {
  const params = useParams();
  const pathname = usePathname();
  const clusterId = String(params.id ?? "");
  const selectedKey = getSelectedKey(pathname);

  return (
    <PageLayout selectedKey={selectedKey} clusterId={clusterId}>
      <Card size="small">
        <Skeleton active paragraph={{ rows: 12 }} />
      </Card>
    </PageLayout>
  );
}
