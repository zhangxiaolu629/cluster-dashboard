"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ConfigProvider } from "antd";
import { themes, ThemeType } from "@/lib/theme";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

const fallbackThemeContext: ThemeContextType = {
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("antd-theme") as ThemeType;
      if (saved && themes[saved]) {
        setThemeState(saved);
      }
    } catch (error) {
      console.error("Error reading theme from localStorage:", error);
    }
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("antd-theme", newTheme);
    } catch (error) {
      console.error("Error saving theme to localStorage:", error);
    }
  };

  const toggleTheme = () => {
    const themeList: ThemeType[] = ["light", "dark", "compact", "cartoon", "illustration"];
    const currentIndex = themeList.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeList.length;
    setTheme(themeList[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <ConfigProvider theme={themes[theme]}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("useTheme used outside ThemeProvider, fallback to light theme");
    }
    return fallbackThemeContext;
  }
  return context;
}