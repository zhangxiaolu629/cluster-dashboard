# 代码审查评论示例

以下示例遵循 `README.md` 中的输出格式，可直接用于 PR 评论。

## 示例 1：发现安全与逻辑问题

**严重问题** 🔴

- 在 `src/app/api/kubernetes/create/route.ts` 中，接口接收请求后直接使用 `request.json()` 的内容构造下游请求，缺少对 `ClusterId` 的格式和必填校验。建议在服务端增加 schema 校验（如 `zod`），并在校验失败时返回 `400`，避免异常输入进入外部 API。
- 在 `src/lib/k8s.ts` 中，`console.log('url', url)` 可能在日志中暴露内部地址信息。建议仅在开发环境打印，或移除该日志。

**建议改进** 🟡

- `src/components/YamlCreate.tsx` 已做前端 YAML 校验，但建议在服务端补充同等级别字段约束（例如 `apiVersion/kind/metadata.name` 必填），避免“前端绕过”导致的脏请求。

**正面反馈** 🟢

- `src/app/api/*/route.ts` 大多采用 `try/catch + NextResponse.json` 的统一错误返回方式，接口风格一致，便于前端处理。

## 示例 2：发现性能与可维护性问题

**严重问题** 🔴

- 在 `src/components/PageLayout.tsx` 中，菜单切换和内容渲染集中在一个较大的客户端组件内，所有子视图逻辑都在同一层分支判断。随着模块增加，可能导致不必要的重渲染与维护成本上升。建议将页面内容渲染拆分为独立路由页面或懒加载子组件。

**建议改进** 🟡

- `src/components/NamespaceList.tsx`、`DeploymentList.tsx` 等列表组件都在各自组件中重复实现加载、错误处理、数据映射逻辑。可考虑抽取通用数据请求 hook（如 `useK8sList`）降低重复代码。
- 对于体积较大的创建流程组件（`CreateDeploymentForm.tsx`），可将部分步骤组件按需加载，减少首屏 JS 体积。

**正面反馈** 🟢

- 创建流程使用 `react-hook-form + zod`，并且支持草稿自动保存，用户体验和表单可靠性设计较好。

## 使用建议

- 审查时优先按 `安全性 > 业务逻辑 > 性能 > 可维护性 > 代码风格` 输出。
- 若未发现严重问题，也建议保留“建议改进”和“正面反馈”两段，提升评论可读性与可执行性。
