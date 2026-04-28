"use client";

export default function ResponsiveContainer({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 1600, margin: "0 auto", width: "100%" }}>{children}</div>;
}
