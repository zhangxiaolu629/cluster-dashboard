# 2026-05-22 11:18 (UTC) critical page auth

## 会话背景

- 自动化任务：检查近期提交中是否存在高严重级别正确性问题。
- 重点范围：认证、页面服务端预取、Volcengine/Kubernetes 数据路径。

## 发现的问题

- `src/middleware.ts` 仅使用 Better Auth 的 `getSessionCookie()` 判断 Cookie 是否存在。
- 多个受保护 Server Component 页面在执行真实会话校验前直接预取 Volcengine 或 Kubernetes 数据。
- 具体触发：未登录请求伪造 `better-auth.session_token` Cookie 后访问 `/` 或 `/cluster/*` 页面，middleware 会放行，页面服务端渲染阶段会读取并返回敏感集群/资源数据。

## 修复内容

- 新增 `src/lib/require-page-session.ts`，通过 `auth.api.getSession()` 做真实页面会话校验，无有效用户时 `redirect("/login")`。
- 在首页、集群详情、资源页、创建页、YAML 创建页和 AI 页面入口调用 `requirePageSession()`。
- 为这些受保护页面显式设置 `export const dynamic = "force-dynamic"`，避免构建期预渲染触发认证/数据库初始化。
- 新增单元测试覆盖：
  - 页面 session helper 在无效会话时重定向。
  - 页面鉴权失败时不会调用 Volcengine SDK 或 `k8sFetch`。
  - 受保护页面保持接入页面级 session guard。

## 验证

- `npm run test:unit`：通过。
- `npm run lint`：通过，保留既有 `FloatingInfoDot.tsx` 未使用导入 warning。
- `npx tsc --noEmit`：通过。
- `npm run test:e2e`：当前环境缺少 `AUTH_DATABASE_URL` / `POSTGRES_URL` / `DATABASE_URL`，Playwright webServer 无法启动，未完成。
