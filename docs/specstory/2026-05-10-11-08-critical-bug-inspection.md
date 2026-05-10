# 2026-05-10 11:08 (UTC) critical bug inspection

## 背景

定时自动化任务要求检查近期提交中的高危正确性问题，重点关注数据泄露、崩溃、数据丢失和显著用户影响；只有在能够构造明确触发场景且修复高可信时才创建 PR。

## 发现

- 最近提交引入登录能力后，`src/middleware.ts` 仅通过 `getSessionCookie(request)` 判断会话 Cookie 是否存在。
- 多个服务端页面会在渲染前直接调用 Volcengine 或 Kubernetes API 预取敏感数据，例如首页集群列表和集群资源列表。
- 攻击者可在未登录情况下伪造一个名称正确的会话 Cookie，使 middleware 放行页面请求；随后服务端组件在未做真实数据库会话校验的情况下读取并渲染敏感集群数据。

## 修复

- 在 `src/lib/require-session.ts` 新增 `requireAuthenticatedPage()`，通过 Better Auth 的 `auth.api.getSession()` 做真实会话校验，失败时重定向到 `/login`。
- 在所有服务端预取敏感数据的页面调用该校验后再访问 Volcengine/Kubernetes：
  - `src/app/page.tsx`
  - `src/app/cluster/[id]/page.tsx`
  - `src/app/cluster/[id]/deployment/page.tsx`
  - `src/app/cluster/[id]/namespace/page.tsx`
  - `src/app/cluster/[id]/service/page.tsx`
  - `src/app/cluster/[id]/event/page.tsx`
  - `src/app/cluster/[id]/statefulset/page.tsx`
- 新增 `tests/app/protected-server-pages.test.tsx`，覆盖会话校验失败时不会继续调用 `k8sFetch` 的回归场景。

## 验证

- `npm run test:unit -- --run tests/app/protected-server-pages.test.tsx`
- `npm run lint`
- `npm run test:unit`

## 提交与 PR

- 修复提交：`c8a1a89 fix: validate sessions before server data prefetch`
- PR：https://github.com/zhangxiaolu629/cluster-dashboard/pull/2
