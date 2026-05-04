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
    /** 为 false 时由 Playwright 注入 BETTER_AUTH_* / AUTH_USERS_JSON；为 true 时需本机 dev 已配置相同登录环境变量 */
    reuseExistingServer: process.env.PW_REUSE_DEV_SERVER === "1",
    /** 部分机器 .next 在机械盘/网络盘上时，Next dev 冷启动会超过 120s */
    timeout: 240_000,
    env: {
      ...process.env,
      BETTER_AUTH_URL: "http://127.0.0.1:3001",
      BETTER_AUTH_SECRET: "playwright-e2e-nextauth-secret-32chars",
      AUTH_USERS_JSON:
        '[{"username":"e2e","passwordHash":"$2b$10$YO6kX3x08iJZQ33sq8DPJ.wPF3v6rqBmTm9ktSrif6O1RXvw27v5y"}]',
    },
  },
});
