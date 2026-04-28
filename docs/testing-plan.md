# 自动化测试方案

## 1. 目标

- 保障主要业务流程可用（页面可访问、数据可展示、关键操作可执行）。
- 防止重构回归（重点覆盖 SSR 首屏取数 + 客户端交互续取模式）。
- 稳定接口行为（参数、错误处理、返回结构一致性）。

## 2. 测试分层

### 2.1 E2E 测试（Playwright）

用于端到端验证核心用户路径，优先覆盖以下流程：

1. 首页集群列表加载
   - 访问 `/`
   - 展示集群卡片或空状态
   - 点击集群进入 `/cluster/[id]`
2. 集群详情导航
   - 依次进入 `namespace/event/service/deployment/statefulset/yaml-create`
   - 断言 URL 切换正确
   - 断言页面存在表格/列表/空状态，不出现白屏
3. Deployment 列表筛选
   - 进入 deployment 页
   - 选择命名空间筛选
   - 断言列表内容或状态发生变化
4. YAML 新建流程
   - 输入非法 YAML，断言出现校验错误
   - 输入合法 YAML（mock 成功），断言成功提示
5. Deployment 新建流程
   - 进入 `/cluster/[id]/deployment/create`
   - 填写必填项并提交
   - 断言请求体关键字段与成功提示

### 2.2 API 集成测试（Vitest）

重点验证 `src/app/api/*/route.ts`：

- `/api/kubernetes/create`
  - 合法 YAML 时，`Path` 与 `Body` 构造正确
  - 非法 YAML 返回 400
  - namespaced 与 cluster-scoped 资源路径正确
- `/api/deployments`、`/api/events`、`/api/services`、`/api/statefulsets`、`/api/namespaces`
  - namespace 参数有无时路径正确
  - 下游错误返回统一错误结构
- `/api/volcengine`
  - 正常返回 `Result.Items`
  - 异常返回 500 与可识别错误信息

### 2.3 组件测试（Testing Library）

优先覆盖高价值组件：

- `PageLayout`：菜单点击路由跳转
- `NamespaceList`、`DeploymentList`：`initialData` 渲染与筛选交互
- `CreateDeploymentForm`：分步校验、提交流程、草稿行为
- `ThemeContext`：Provider 包裹与 fallback 行为

## 3. 测试环境与数据策略

- 使用 `.env.test`，避免依赖真实生产环境配置。
- 外部服务（K8s、Volcengine）统一 mock，不直接访问线上集群。
- 固定测试数据，降低 flaky 风险。

### Mock 策略

- E2E：Playwright 拦截 `/api/*` 并返回固定响应。
- API/组件测试：MSW 或 fetch mock。

## 4. CI 执行策略

### PR 必跑（快速）

- `lint`
- `typecheck`
- API 集成测试
- E2E smoke（2-3 条）

### 主分支/定时任务（完整）

- 全量 E2E
- 覆盖率统计与趋势跟踪

## 5. 初始落地计划（1-2 天）

1. 初始化测试工具链
   - `playwright`
   - `vitest`
   - `@testing-library/react`
   - `msw`
2. 建立目录
   - `tests/e2e/`
   - `tests/api/`
   - `tests/components/`
3. 首批用例
   - 首页 -> 集群详情导航
   - deployment 筛选
   - yaml-create 校验 + 提交
4. 接入 CI
   - 新增测试 job
   - 将 smoke 测试设为 PR 必跑

## 6. 验收标准

- PR 阶段可在合理时间内完成 smoke 验证。
- 核心路由与关键提交流程至少有 1 条自动化用例覆盖。
- API 错误处理和关键参数构造拥有回归保护。
