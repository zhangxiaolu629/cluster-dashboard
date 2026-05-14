# 2026-05-14 11:05 (UTC)

## 会话主题

高严重度缺陷自动排查：近期登录能力引入后，检查是否存在可触发的数据泄露、崩溃或重大用户影响。

## 关键发现

- 近期提交为 API Route 增加了 `assertAuthenticated()`，但多个 Server Component 页面仍只依赖 `middleware.ts` 中 Better Auth `getSessionCookie()` 的 cookie 存在性检查。
- `getSessionCookie()` 不能验证会话真实性。攻击者可构造会话 cookie 名称绕过页面 middleware，让首页与集群资源页在服务端继续用 Volcengine/Kubernetes 凭据读取数据。
- 受影响入口包括首页、集群概览、Deployment/StatefulSet/Namespace/Service/Event 页面，以及受保护功能页。

## 修复摘要

- 新增 `src/lib/require-page-session.ts`，在 Server Component 入口调用 `auth.api.getSession()` 做真实会话校验，未登录跳转 `/login`。
- 所有受保护页面入口改为先调用 `requirePageSession()`，并设置 `export const dynamic = "force-dynamic"`。
- 为 helper 添加单测，覆盖缺失/伪造会话跳转、真实会话放行，以及不回显不安全 callback path。
- 将 `auth` 改为函数内动态导入，避免页面模块分析阶段过早初始化认证数据库连接。

## 验证记录

- `npm run test:unit -- tests/lib/require-page-session.test.ts tests/api/deployments.route.test.ts`：通过。
- `npm run test:unit`：通过。
- `npm run lint`：通过，保留既有 `FloatingInfoDot.tsx` 未使用导入 warning。
- pre-commit 触发的完整 `npm run test` 中 e2e 未能启动，原因是当前环境未配置 Postgres 认证数据库 URL（`AUTH_DATABASE_URL` / `POSTGRES_URL` / `DATABASE_URL`），与既有仓库环境限制一致。

## 产出

- 分支：`cursor/critical-correctness-bugs-20b6`
- 提交：
  - `8e68932 fix: enforce authenticated server pages`
  - `b4f4c4e fix: defer page auth initialization`
- PR：https://github.com/zhangxiaolu629/cluster-dashboard/pull/4
