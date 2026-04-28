"use client";

import { Button, Tooltip } from "antd";
import { BgColorsOutlined } from "@ant-design/icons";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Tooltip title={`当前主题：${theme}，点击切换`}>
      <Button type="text" icon={<BgColorsOutlined />} onClick={toggleTheme} aria-label="切换主题" />
    </Tooltip>
  );
}
