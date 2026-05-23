# 2026-05-23 11:05 (UTC) Critical page auth bugfix

## 背景

自动化任务要求检查近期提交中可能造成数据泄露、崩溃、数据丢失或重大用户可见故障的高危正确性问题。

## 发现的问题

受保护页面只依赖 `src/middleware.ts` 中 `getSessionCookie()` 的 Cookie 存在性检查。首页和集群详情/资源页会在 Server Page 渲染阶段直接调用 Volcengine 或 Kubernetes API 预取数据，因此过期会话或伪造 session cookie 可以绕过中间件，并在真实会话未验证前触发敏感集群数据读取。

## 修复

- 新增 `src/lib/require-page-session.ts`，在 Server Page 中通过 Better Auth `auth.api.getSession()` 校验真实用户会话。
- 在首页、集群详情页、命名空间、服务、事件、Deployment、StatefulSet、YAML 创建、Deployment 创建和 AI 对话页面入口调用页面级会话校验。
- 将受保护页面标记为 `dynamic = "force-dynamic"`，避免受会话约束的页面被静态预渲染。
- 新增单测覆盖未认证时不会调用 Volcengine/Kubernetes 预取路径，以及 helper 的重定向行为。

## 验证

- `npm run test:unit -- tests/app/protected-pages-auth.test.ts tests/lib/require-page-session.test.ts`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run test:unit`
- 带占位环境变量执行 `npm run build`
