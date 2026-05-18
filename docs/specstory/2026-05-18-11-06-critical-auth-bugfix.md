# 2026-05-18 11:06 (UTC) critical auth bugfix

## 背景

自动化任务要求检查近期提交中是否存在高严重度正确性缺陷，仅在能构造具体触发场景且修复高置信时打开 PR。

## 发现

- 近期登录能力和首页登出相关变更后，受保护 Server Page 只依赖 `src/middleware.ts` 中 Better Auth `getSessionCookie` 的乐观 Cookie 存在性检查。
- 首页、集群详情页和多个 K8s 资源页会在页面渲染阶段直接调用 Volcengine/K8s 后端读取私有集群数据。
- 攻击者或未登录用户只要伪造会话 Cookie 名称即可绕过中间件重定向，触发服务端页面读取云厂商或 Kubernetes 数据。

## 修复

- 新增 `src/lib/require-page-session.ts`，在 Server Page 中通过 `auth.api.getSession()` 做真实会话校验，未登录时重定向到 `/login`。
- 在首页、集群详情/资源页、创建页、YAML 创建页、AI Chat 页入口调用页面级会话校验。
- 为这些受保护页面标记 `export const dynamic = "force-dynamic"`，避免构建期预渲染触发认证/数据库初始化。
- 新增 `tests/app/page-auth.test.ts`，验证认证校验拒绝时不会调用 Volcengine 或 K8s 读取。

## 验证

- `npm run test:unit -- tests/app/page-auth.test.ts`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run test:unit`

## 结果

- 提交：`31a233d fix: enforce auth on protected server pages`
- PR：`https://github.com/zhangxiaolu629/cluster-dashboard/pull/8`
