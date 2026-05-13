# 2026-05-13 11:12 (UTC) Critical Auth Bugfix

## 会话摘要

- 任务：巡检近期提交中的高严重正确性问题，并在确认可触发后最小修复。
- 发现：页面层 `middleware` 只检查 Better Auth 会话 Cookie 是否存在，不能证明会话有效；多个 Server Component 页面会在服务端直接读取 Volcengine/K8s 数据。
- 影响：攻击者可伪造同名会话 Cookie 访问受保护页面，使服务端首屏渲染返回集群、工作负载、命名空间、事件等敏感数据。
- 修复：
  - 新增 `requirePageSession()`，在 Server Component 入口通过 `auth.api.getSession()` 做真实会话校验。
  - 首页、集群详情、资源列表、YAML/Deployment 创建页和 AI 对话页在渲染前调用真实会话校验。
  - 为这些鉴权页面声明 `dynamic = "force-dynamic"`，避免构建期预渲染触发认证库连接。
  - 新增单测覆盖无有效会话跳转登录、有有效会话放行。
- 验证：
  - `npm run test:unit -- --run tests/lib/require-page-session.test.ts`
  - `npm run lint`
  - `BETTER_AUTH_SECRET=... AUTH_DATABASE_URL=... K8S_API_SERVER=... K8S_TOKEN=... npm run build`
  - 预提交钩子中的全量单测通过；E2E 因当前环境缺少真实 Postgres 认证库连接串无法启动，符合仓库既有测试环境约束。
