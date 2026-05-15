# 2026-05-15 19:11 (UTC+8)

## 会话主题

高危正确性缺陷自动筛查：检查近期提交中可能导致数据泄露、崩溃、数据丢失或重大用户可见故障的问题。

## 发现的问题

- 近期登录能力引入后，`src/middleware.ts` 只使用 Better Auth 的 `getSessionCookie` 检查会话 cookie 是否存在。
- `getSessionCookie` 只能作为乐观的 cookie 存在性判断，不能证明会话有效。
- 首页和多个集群资源 Server Component 在渲染时会直接调用 Volcengine 或 Kubernetes API 读取敏感初始数据。
- 攻击者可构造一个形似会话的 cookie 绕过 middleware，让服务端页面在未认证的请求中拉取并渲染云厂商/K8s 数据。

## 修复摘要

- 新增 `src/lib/require-page-session.ts`，在 Server Component 边界调用 Better Auth `auth.api.getSession()` 做真实会话校验。
- 为首页、集群详情、资源列表、创建、YAML 创建和 AI 对话页面添加页面级会话校验。
- 对受保护页面增加 `export const dynamic = "force-dynamic"`，避免 Next 构建期预渲染触发认证数据库初始化。
- 新增 `tests/app/home-page-auth.test.ts`，验证会话校验失败时不会构造 Volcengine 客户端或调用云 API。

## 验证

- `npm run test:unit -- tests/app/home-page-auth.test.ts`
- `npm run lint`
- `npm run test:unit`
- `npx tsc --noEmit`

## 产出

- 提交：`605869a fix: enforce page session checks`
- PR：`https://github.com/zhangxiaolu629/cluster-dashboard/pull/5`
