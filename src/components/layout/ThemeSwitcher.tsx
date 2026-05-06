"use client";

import { Button, Dropdown, Tooltip } from "antd";
import { BgColorsOutlined, DownOutlined } from "@ant-design/icons";
import { useTheme } from "@/contexts/ThemeContext";
import type { ThemeType } from "@/lib/theme";
import { THEME_LABELS } from "@/lib/theme";

const MENU_ITEMS = (Object.keys(THEME_LABELS) as ThemeType[]).map((key) => ({
  key,
  label: THEME_LABELS[key],
}));

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <Dropdown
      menu={{
        selectable: true,
        selectedKeys: [theme],
        items: MENU_ITEMS,
        onClick: ({ key }) => setTheme(key as ThemeType),
      }}
      trigger={["click"]}
    >
      <Tooltip title="选择界面风格">
        <Button
          type="text"
          icon={<BgColorsOutlined />}
          aria-haspopup="menu"
          aria-label="切换界面风格"
        >
          风格 · {THEME_LABELS[theme]}
          <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
        </Button>
      </Tooltip>
    </Dropdown>
  );
}
