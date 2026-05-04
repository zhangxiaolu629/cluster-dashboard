import { Spin } from "antd";

export default function RootLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spin size="large" description="页面加载中..." />
    </div>
  );
}
