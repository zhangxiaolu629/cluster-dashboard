import { theme } from "antd";
import type { ThemeConfig } from "antd";

export type ThemeType = "light" | "dark" | "compact" | "cartoon" | "illustration";

export const themes: Record<ThemeType, ThemeConfig> = {
  light: {
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: "#1677ff",
    },
  },
  dark: {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: "#1677ff",
    },
  },
  compact: {
    algorithm: theme.compactAlgorithm,
    token: {
      colorPrimary: "#1677ff",
    },
  },
  cartoon: {
    algorithm: theme.defaultAlgorithm,
    token: {
      borderRadius: 12,
      borderRadiusLG: 16,
      borderRadiusSM: 8,
      borderRadiusXS: 4,
      colorPrimary: "#ff6b6b",
      colorSuccess: "#51cf66",
      colorWarning: "#ffd43b",
      colorError: "#ff6b6b",
      colorInfo: "#339af0",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      boxShadowSecondary: "0 8px 24px rgba(0, 0, 0, 0.12)",
      fontFamily: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    components: {
      Button: {
        borderRadius: 20,
        borderRadiusLG: 24,
        borderRadiusSM: 16,
      },
      Card: {
        borderRadius: 16,
      },
      Tag: {
        borderRadius: 12,
      },
      Input: {
        borderRadius: 12,
      },
      Select: {
        borderRadius: 12,
      },
    },
  },
  illustration: {
    algorithm: theme.defaultAlgorithm,
    token: {
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,
      colorPrimary: "#7c9885",
      colorSuccess: "#8fb9a8",
      colorWarning: "#f2d096",
      colorError: "#e2979c",
      colorInfo: "#8fb9a8",
      colorBgContainer: "#faf9f6",
      colorBgLayout: "#f5f3f0",
      colorText: "#4a4a4a",
      colorTextSecondary: "#7a7a7a",
      colorBorder: "#e8e6e3",
      fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    components: {
      Card: {
        colorBgContainer: "#ffffff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      },
      Button: {
        colorPrimaryBg: "#7c9885",
        borderRadius: 6,
      },
    },
  },
};
