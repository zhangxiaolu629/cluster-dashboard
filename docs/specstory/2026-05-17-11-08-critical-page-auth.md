# 2026-05-17 11:08 (UTC) critical-page-auth

## 背景

本次自动化任务要求检查近期提交中是否存在会造成数据泄露、崩溃、数据丢失或重大用户可见故障的高危正确性问题；仅在能构造明确触发场景且修复高置信时打开 PR。

## 排查结论

发现受保护 Server Component 页面缺少真实会话校验：

- `src/middleware.ts` 使用 Better Auth 的 `getSessionCookie()`，只能判断请求是否带有 session cookie。
- 首页、集群详情页、各资源列表页会在页面渲染期间直接读取 Volcengine/Kubernetes 初始数据。
- 攻击者携带伪造或过期 session cookie 时可通过 middleware 的乐观检查，进而触发服务端敏感数据读取并把结果渲染到页面初始 payload。

## 修复

- 新增 `src/lib/require-page-session.ts`，在 Server Component 页面入口调用 `auth.api.getSession()` 做真实会话校验，未登录时重定向到 `/login`。
- 将首页、AI 对话页、集群详情页、资源列表页、Deployment 创建页和 YAML 创建页接入页面级会话校验。
- 为这些页面显式设置 `export const dynamic = "force-dynamic"`，确保校验按请求执行。
- 新增 `tests/app/page-auth.test.ts`，覆盖页面都会调用 guard，以及认证失败时不会调用 Volcengine/Kubernetes 数据源。

## 验证

- `npm run test:unit -- tests/app/page-auth.test.ts`：通过。
- `npm run test:unit`：通过。
- `npm run lint`：通过，仅有既有 `FloatingInfoDot.tsx` 未用 import warning。
- `npx tsc --noEmit`：通过。

## 提交与 PR

- 提交：`ea7a242 fix: enforce auth on protected pages`
- PR：https://github.com/zhangxiaolu629/cluster-dashboard/pull/7
