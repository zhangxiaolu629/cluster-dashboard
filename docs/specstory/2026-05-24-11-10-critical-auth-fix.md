# 2026-05-24 11:10 (UTC)

---

_**User**_

You are a deep bug-finding automation focused on high-severity issues. Inspect recent commits, identify critical correctness bugs that escaped review, fix only high-confidence critical issues, and include bug/impact, root cause, fix, and validation.

---

_**Agent**_

本次筛查近期认证相关提交后，发现受保护 Server Component 页面仅依赖 middleware 中 `getSessionCookie` 的 Cookie 存在性检查。由于该检查不验证会话有效性，伪造或过期的 session cookie 可绕过 middleware，并在 SSR 阶段触发 Volcengine/Kubernetes 读取，导致集群列表、命名空间、工作负载、Service 和 Event 等敏感数据被写入 HTML/RSC 响应。

修复内容：

- 新增 `src/lib/require-page-session.ts`，在页面入口通过 `auth.api.getSession()` 做真实服务端会话校验，无效会话直接 `redirect("/login")`。
- 在首页、集群详情页、Deployment/StatefulSet/Namespace/Service/Event 页面、YAML 创建页、Deployment 创建页和 AI Chat 页面进入渲染前调用该 helper。
- 为这些受保护页面声明 `dynamic = "force-dynamic"`，避免构建期预渲染触发认证/后端访问。
- 新增单测覆盖 helper 行为，以及会话校验失败时 SSR 页面不会调用 Volcengine 或 Kubernetes。

验证：

- `npm run test:unit -- tests/lib/require-page-session.test.ts tests/app/protected-pages-auth.test.ts`
- `npm run lint`（通过；仅保留既有 `FloatingInfoDot.tsx` 未使用变量 warning）
- `npx tsc --noEmit`
- 带占位环境变量执行 `npm run build`
- `npm run test:unit`

提交：

- `67bc02b fix: validate sessions before protected page SSR`
