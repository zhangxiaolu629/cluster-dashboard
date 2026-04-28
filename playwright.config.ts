import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  /** Next dev 首访路由编译、慢盘环境可能超过 30s */
  timeout: 90_000,
  retries: 1,
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
    channel: "msedge",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: true,
    /** 部分机器 .next 在机械盘/网络盘上时，Next dev 冷启动会超过 120s */
    timeout: 240_000,
  },
});
