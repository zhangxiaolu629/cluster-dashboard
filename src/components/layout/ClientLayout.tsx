"use client";

import { App } from "antd";
import { ReactNode } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <App>
      <ThemeProvider>{children}</ThemeProvider>
    </App>
  );
}
