# 2026-05-16 11:20 (UTC) critical-page-auth

## 会话摘要

- 任务：检查近期提交中是否存在高严重正确性问题，并在高置信时做最小修复。
- 发现：受保护的服务端页面只依赖 middleware 中 `getSessionCookie()` 的 Cookie 存在性检查；攻击者可伪造会话形态 Cookie 绕过 middleware，触发首页、集群详情及资源列表页面使用服务端 Volcengine/K8s 凭据读取敏感数据，并随初始页面数据返回。
- 修复：
  - 新增 `src/lib/require-page-session.ts`，在页面渲染前通过 Better Auth `auth.api.getSession()` 做真实会话校验。
  - 在首页、集群详情、资源列表、创建页和 AI 页面调用页面级校验，并设置 `dynamic = "force-dynamic"`。
  - 新增 `tests/app/page-auth.test.ts`，验证会话校验失败时不会调用 Volcengine/K8s 后端读取。
- 验证：
  - `npm exec vitest run tests/app/page-auth.test.ts` 通过。
  - `npm run lint` 通过，仅保留既有 `FloatingInfoDot.tsx` 未使用导入 warning。
  - `npm exec tsc -- --noEmit` 通过。
  - `npm test` 中 unit 阶段通过；e2e webServer 因当前环境缺少 Postgres 认证库配置未启动。
- 结果：已提交并推送分支 `cursor/critical-correctness-bugs-3a38`，并创建 PR #6。
