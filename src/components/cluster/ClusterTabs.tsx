"use client";

import { Tabs } from "antd";
import { useState } from "react";
import NodeListPanel from "@/components/lists/NodeListPanel";
import PodListPanel from "@/components/lists/PodListPanel";

export default function ClusterTabs() {
  const [activeKey, setActiveKey] = useState("nodes");

  return (
    <Tabs
      activeKey={activeKey}
      onChange={setActiveKey}
      items={[
        { key: "nodes", label: "节点列表", children: <NodeListPanel /> },
        { key: "pods", label: "Pod 列表", children: <PodListPanel /> },
      ]}
    />
  );
}
