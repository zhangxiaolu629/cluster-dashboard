# 2026-05-21 11:15 UTC - Critical bug-finding automation

## 背景

本次自动化任务审查近期提交中的高严重正确性问题，重点关注数据泄露、误删误改、崩溃和显著用户可见故障。

## 发现的问题

1. 受保护 SSR 页面只依赖 middleware 的 Better Auth Cookie 存在性检查。攻击者携带任意非空会话 Cookie 即可让 middleware 放行，页面服务端渲染阶段会继续读取 Volcengine/Kubernetes 数据，造成集群信息泄露。
2. Kubernetes 资源 YAML 更新接口只按 YAML 内的 `metadata.name` / `metadata.namespace` 定位资源，且 namespaced 资源缺少 namespace 时会静默回退到 `default`，可能导致误改或误删其他命名空间资源。
3. YAML 更新弹窗在加载新资源 YAML 时保留上一份内容，慢网络下用户可提交旧 YAML，造成误改错误资源。

## 修复

- 新增 `requireAuthenticatedPage`，受保护页面在 SSR 数据读取前执行真实服务端会话校验。
- 受保护页面标记为 `force-dynamic`，避免构建期预渲染触发会话/数据库访问。
- 资源 API 强制校验 namespaced 资源必须提供 namespace，并将 PUT 请求绑定到调用方传入的 name/namespace，拒绝 YAML metadata 漂移。
- YAML 弹窗打开时清空旧内容，加载期间禁用确认按钮。
- `k8sFetch` 支持空响应体，避免 DELETE 等空响应导致 JSON 解析异常。
- 新增资源 API 回归测试覆盖缺失 namespace、删除路径、YAML namespace 漂移和正常更新路径。

## 验证

- `npm run test:unit`
- `npm run lint`
- `K8S_API_SERVER=https://example.invalid K8S_TOKEN=dummy AUTH_DATABASE_URL=postgres://user:pass@127.0.0.1:5432/db BETTER_AUTH_SECRET=vitest-placeholder-better-auth-secret-32chars npm run build`

## 剩余说明

- 完整 `npm run test:e2e` 在当前环境中因缺少可用认证 Postgres 服务而无法启动 Playwright dev server。
