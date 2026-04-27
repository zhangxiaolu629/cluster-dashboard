"use client";

import { ReactNode } from "react";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export default function ResponsiveContainer({ children, className }: ResponsiveContainerProps) {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className || ""}`}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3, xl: 4 }, 
  gap = "gap-4" 
}: ResponsiveGridProps) {
  const gridClasses = `
    grid
    grid-cols-1
    ${cols.sm && cols.sm > 1 ? `sm:grid-cols-${cols.sm}` : ""}
    ${cols.md && cols.md > 1 ? `md:grid-cols-${cols.md}` : ""}
    ${cols.lg && cols.lg > 1 ? `lg:grid-cols-${cols.lg}` : ""}
    ${cols.xl && cols.xl > 1 ? `xl:grid-cols-${cols.xl}` : ""}
    ${gap}
  `.trim();

  return <div className={gridClasses}>{children}</div>;
}