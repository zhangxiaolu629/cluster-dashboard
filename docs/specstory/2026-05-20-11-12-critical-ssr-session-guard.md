# 2026-05-20 11:12 (UTC) critical SSR session guard

## 背景

定时自动化任务要求检查近期提交中是否存在高严重性正确性问题，仅在能够构造明确触发场景且修复高置信时提交 PR。

## 发现的问题

近期登录能力变更后，`middleware` 只通过 `better-auth` 的 `getSessionCookie` 判断会话 Cookie 是否存在。该判断不会校验 Cookie 是否对应真实会话。

与此同时，首页和多个集群资源页面会在 Server Component 渲染期间直接调用火山 SDK 或 `k8sFetch` 拉取敏感数据。因此攻击者只要携带任意伪造的 `better-auth.session_token` Cookie，即可绕过 middleware，并在 SSR HTML/RSC payload 中获取集群列表、Deployment、Namespace、Service、StatefulSet、Event 等数据。

## 修复

- 新增 `src/lib/require-page-session.ts`，在 Server Component 中通过 `auth.api.getSession` 校验真实会话。
- 在首页和所有会 SSR 拉取火山/K8s 数据的集群资源页面调用 `requirePageSession`。
- 调整 helper 顺序，先读取 `headers()` 使 Next.js 将页面识别为动态渲染，再进行认证库 bootstrap，避免构建期连接数据库。
- 新增 `tests/lib/require-page-session.test.ts` 覆盖有效会话放行和无效会话重定向。

## 验证

- `npm run test:unit -- tests/lib/require-page-session.test.ts`：通过。
- `npm run test:unit`：通过。
- `npm run lint`：通过，保留仓库既有 `FloatingInfoDot.tsx` 未使用 import 警告。
- 带占位必需环境变量执行 `npm run build`：通过，受保护页面均为动态渲染。
- `npm test` / Playwright E2E：被既有配置阻塞，webServer 未注入 `AUTH_DATABASE_URL`，认证 Postgres bootstrap 在启动阶段失败。

## 产出

- PR：https://github.com/zhangxiaolu629/cluster-dashboard/pull/10
