"use client";

import Link, { type LinkProps } from "next/link";
import { theme } from "antd";
import { useState } from "react";

export type AppLinkButtonProps = Omit<LinkProps, "children"> & {
  variant?: "primary" | "default";
  icon?: React.ReactNode;
  block?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

/** next/link 的可访问导航按钮样式，替代 Link legacyBehavior + antd Button（避免无效 DOM 与弃用 API）。 */
export default function AppLinkButton({
  href,
  variant = "default",
  icon,
  block,
  children,
  style,
  prefetch = true,
  ...linkProps
}: AppLinkButtonProps) {
  const { token } = theme.useToken();
  const [hovered, setHovered] = useState(false);

  const isPrimary = variant === "primary";

  const bg = isPrimary
    ? hovered
      ? token.colorPrimaryHover
      : token.colorPrimary
    : hovered
      ? token.colorFillSecondary
      : token.colorBgContainer;

  const borderColor = isPrimary
    ? hovered
      ? token.colorPrimaryHover
      : token.colorPrimary
    : hovered
      ? token.colorPrimaryHover
      : token.colorBorder;

  const color = isPrimary ? token.colorTextLightSolid : token.colorText;

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: block ? "flex" : "inline-flex",
        width: block ? "100%" : undefined,
        alignItems: "center",
        justifyContent: block ? "flex-start" : "center",
        gap: token.marginXS,
        boxSizing: "border-box",
        minHeight: token.controlHeight,
        paddingBlock: token.paddingXXS,
        paddingInline: token.paddingContentHorizontal,
        borderRadius: token.borderRadius,
        border: `${token.lineWidth}px solid ${borderColor}`,
        background: bg,
        color,
        fontSize: token.fontSize,
        fontFamily: token.fontFamily,
        lineHeight: token.lineHeight,
        cursor: "pointer",
        textDecoration: "none",
        transition: `all ${token.motionDurationMid}`,
        ...style,
      }}
      {...linkProps}
    >
      {icon}
      {children}
    </Link>
  );
}
