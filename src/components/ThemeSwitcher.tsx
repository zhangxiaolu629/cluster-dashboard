"use client";

import { Select, Space, message } from "antd";
import { 
  BulbOutlined, 
  MoonOutlined, 
  CompressOutlined,
  SmileOutlined,
  PictureOutlined 
} from "@ant-design/icons";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeType } from "@/lib/theme";

const themeOptions = [
  { value: "light", label: "浅色", icon: <BulbOutlined /> },
  { value: "dark", label: "深色", icon: <MoonOutlined /> },
  { value: "compact", label: "紧凑", icon: <CompressOutlined /> },
  { value: "cartoon", label: "卡通", icon: <SmileOutlined /> },
  { value: "illustration", label: "插画", icon: <PictureOutlined /> },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (value: string) => {
    const newTheme = value as ThemeType;
    setTheme(newTheme);
    const themeLabel = themeOptions.find(t => t.value === newTheme)?.label;
    if (themeLabel) {
      message.success(`已切换到${themeLabel}主题`);
    }
  };

  return (
    <Select
      value={theme}
      onChange={handleThemeChange}
      style={{ width: 120 }}
      options={themeOptions.map((t) => ({
        value: t.value,
        label: (
          <Space>
            {t.icon}
            {t.label}
          </Space>
        ),
      }))}
    />
  );
}