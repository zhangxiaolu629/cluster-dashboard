# 测试说明

本仓库的自动化测试分三层：**单元/组件**（Vitest）、**API 集成**（Vitest + Node）、**E2E**（Playwright）。更完整的策略、用例范围与 CI 建议见同目录下的 [自动化测试方案（testing-plan.md）](./testing-plan.md)。

## 常用命令

| 命令                 | 说明                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| `npm run test`       | 先跑 `test:unit`，再跑 `test:e2e`（CI 全量时慎用时长）                                                |
| `npm run test:unit`  | Vitest 单元/组件/接口测试（含覆盖率，见 `package.json`）                                              |
| `npm run test:e2e`   | Playwright E2E（需本机能启动或已占用 `http://127.0.0.1:3001` 的 dev 服务，见 `playwright.config.ts`） |
| `npm run test:watch` | Vitest 监听模式，开发时调试用                                                                         |

## 目录与配置

- E2E 用例：`tests/e2e/`
- API/组件等单元测试：`tests/` 下 `api/`、`components/` 等
- Playwright 配置：项目根目录 `playwright.config.ts`（`baseURL`、Edge 渠道、`webServer` 等）
- Vitest：`vitest.config.ts` / `vitest.setup.ts`

## 环境与数据

- 优先使用项目约定的测试环境变量，避免 E2E/接口直连生产集群与线上密钥。
- **E2E / `npm run dev`**：登录依赖 Postgres，须在环境中配置 `AUTH_DATABASE_URL`（或 `DATABASE_URL` 等，见 `README.md`），与 Playwright `webServer` 注入的 `BETTER_AUTH_*` / `AUTH_USERS_JSON` 一并生效。
- **GitHub Actions**：`lint-dev.yml` 的 build 步骤从仓库 Secret `AUTH_DATABASE_URL` 读取连接串（与 Neon CI 分支等一致），未配置时构建会失败。
- 外部 K8s、Volcengine 在自动化中应以 mock、拦截或固定夹具（fixture）为主，降低偶发失败。

## 相关文档

- [自动化测试方案（详细）](./testing-plan.md)
- [代码审查规范中的测试相关条目](./code-review/README.md)（若 PR 对测试有要求，可配合阅读）
