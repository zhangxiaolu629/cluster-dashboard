import type { Metadata } from "next";
import "antd/dist/reset.css";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import FloatingInfoDot from "@/components/common/FloatingInfoDot";

export const metadata: Metadata = {
  title: "K8s集群管理平台",
  description: "Kubernetes Cluster Dashboard",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <ThemeProvider>
          {children}
          <FloatingInfoDot />
        </ThemeProvider>
      </body>
    </html>
  );
}
