# 项目架构文档

## 1. 概述

- 项目名称：`cluster-dashboard`
- 技术栈：`Next.js 16 (App Router)`、`React 19`、`TypeScript`、`Ant Design`、`Zod`、`react-hook-form`、`js-yaml`、`dayjs`
- 构建工具：`Next.js + Turbopack`（`next.config.ts` 中启用并指定 root），包管理基于 `npm`（`package-lock.json`）
- 运行方式：`npm run dev / build / start / lint`

## 2. 目录结构

```text
cluster-dashboard/
├─ src/
│  ├─ app/                 # 页面路由与 API 路由（App Router）
│  ├─ components/          # 业务 UI 组件与页面组合组件
│  ├─ lib/                 # 基础工具与第三方 API 封装
│  └─ types/               # 类型定义（如 k8s 类型）
├─ public/                 # 静态资源
├─ scripts/                # 本地开发辅助脚本
├─ .cursor/skills/         # Cursor Skills（项目级技能）
├─ next.config.ts          # Next.js 配置（Turbopack root）
├─ tsconfig.json           # TypeScript 编译与路径别名配置
├─ postcss.config.mjs      # PostCSS/Tailwind v4 插件配置
├─ eslint.config.mjs       # ESLint（Next + TS）规则
├─ vercel.json             # Vercel 构建配置
└─ package.json            # 依赖、脚本、Node 版本约束
```

说明（核心配置文件）：

- `next.config.ts`：配置 Turbopack，显式设置项目根目录，影响构建与开发行为。
- `tsconfig.json`：启用严格模式、`moduleResolution: bundler`、`@/* -> src/*` 路径别名。
- `postcss.config.mjs`：使用 `@tailwindcss/postcss`，项目未发现独立 `tailwind.config.*` 文件。
- `eslint.config.mjs`：继承 Next Core Web Vitals + TypeScript 规则，并调整忽略目录。

## 3. 核心模块

### 3.1 `src/app`（路由结构）

- 主要职责：定义页面路由（客户端入口）与后端 API 路由（服务端聚合层）。
- 关键文件及作用：
  - `src/app/layout.tsx`：全局布局，加载全局样式与字体，设置站点 metadata。
  - `src/app/page.tsx`：首页入口，服务端预取集群列表后渲染首页。
  - `src/app/cluster/[id]/page.tsx`：单集群总览页，服务端预取当前集群摘要信息。
  - `src/app/cluster/[id]/namespace|event|service|deployment|statefulset|yaml-create/page.tsx`：各业务子页面。
  - `src/app/cluster/[id]/deployment/create/page.tsx`：Deployment 创建流程入口。
  - `src/app/api/*/route.ts`：后端接口层，转发请求到 Kubernetes API 或 Volcengine API。
- 与其他模块依赖关系：
  - 依赖 `src/components` 进行页面渲染。
  - 依赖 `src/lib/k8s.ts` 发起 Kubernetes 请求。
  - 依赖外部服务：K8s API（`K8S_API_SERVER`）与火山引擎 OpenAPI（`@volcengine/openapi`）。

路由概览（页面）：

```text
/
/cluster/[id]
/cluster/[id]/namespace
/cluster/[id]/event
/cluster/[id]/service
/cluster/[id]/deployment
/cluster/[id]/deployment/create
/cluster/[id]/statefulset
/cluster/[id]/yaml-create
```

路由概览（API）：

```text
/api/cluster
/api/namespaces
/api/events
/api/services
/api/deployments
/api/statefulsets
/api/nodes
/api/pods
/api/volcengine
/api/kubernetes/create
```

### 3.2 `src/components`（组件组织方式）

- 主要职责：承载 UI 展示、交互状态与页面级组合逻辑。
- 组织方式：
  - 页面壳与导航：`PageLayout.tsx`（侧边栏、主题切换、子模块入口）。
  - 资源列表组件：`NamespaceList.tsx`、`EventList.tsx`、`ServiceList.tsx`、`DeploymentList.tsx`、`StatefulSetList.tsx`、`NodeListPanel.tsx`、`PodListPanel.tsx`。
  - 首页与概览：`HomePage.tsx`、`ClusterSummary.tsx`、`ClusterTabs.tsx`（支持首屏服务端注入初始数据）。
  - 创建流程：`CreateDeploymentForm.tsx` + `CreateDeploymentForm/steps/*` + `DeploymentPreview.tsx`，以及 `YamlCreate.tsx`。
  - 通用展示组件：`FadeIn.tsx`、`ResponsiveContainer.tsx`、`TableSkeleton.tsx`、`EmptyState.tsx`。
- 关键文件及作用：
  - `PageLayout.tsx`：统一导航与内容区，负责侧边菜单路由跳转。
  - `HomePage.tsx`：加载集群列表并跳转到集群详情。
  - `CreateDeploymentForm.tsx`：多步骤表单、Zod 校验、草稿缓存、提交创建。
  - `YamlCreate.tsx`：YAML 编辑器上传/校验并调用创建接口。
- 与其他模块依赖关系：
  - 页面层采用“Server 首屏预取 + Client 交互续取”的混合模式。
  - 客户端交互场景通过浏览器 `fetch('/api/...')` 调用 `src/app/api`。
  - 使用 `src/lib/utils.ts`（时间格式化、状态显示等）辅助展示。
  - 依赖 Ant Design、react-hook-form、zod、CodeMirror 等第三方库。

### 3.3 `src/lib`（工具函数和第三方配置）

- 主要职责：提供复用工具函数和后端请求封装，降低 API 路由重复代码。
- 关键文件及作用：
  - `src/lib/k8s.ts`：封装 `k8sFetch`，统一注入 Token、Content-Type、no-store 策略与错误处理。
  - `src/lib/utils.ts`：时间格式化与状态标签计算等通用方法。
- 与其他模块依赖关系：
  - 被 `src/app/api/*` 直接调用（尤其 `k8sFetch`）。
  - 被 `src/components` 调用以统一展示逻辑。

### 3.4 `src/server`（服务端逻辑）

- 当前状态：项目中不存在 `src/server` 目录。
- 现有服务端逻辑位置：主要位于 `src/app/api/*/route.ts`（Next.js Route Handler）。

## 4. 数据流

- 客户端到服务端请求路径：
  - 首屏路径：`src/app` 页面在服务端直接调用 `k8sFetch` 或火山引擎 OpenAPI，组装初始数据后下发给客户端组件。
  - 交互路径：浏览器组件（如筛选、搜索、创建表单）按需发起 `fetch('/api/...')`。
  - `src/app/api/*/route.ts` 接收请求并进行服务端转发：
    - K8s 资源查询：通过 `src/lib/k8s.ts` 调用 `K8S_API_SERVER`。
    - 集群管理相关：通过 `@volcengine/openapi` 调用火山引擎接口。
  - Route Handler 返回 JSON，前端更新列表/表单状态并渲染。
- 状态管理方式：
  - 以组件本地状态为主（`useState`、`useEffect`、`useMemo`）。
  - 复杂表单使用 `react-hook-form + zod`。
  - `CreateDeploymentForm` 使用 `localStorage` 做草稿持久化。
  - 未发现 Redux、Zustand 等全局状态库。

## 5. 外部依赖

- `next` + `react` + `react-dom`：应用框架与渲染引擎。
- `antd`：UI 组件体系（表格、布局、表单、消息提示等）。
- `@volcengine/openapi`：调用火山引擎 VKE/集群相关 OpenAPI。
- `react-hook-form` + `@hookform/resolvers` + `zod`：表单建模与校验。
- `@uiw/react-codemirror` + `@codemirror/lang-yaml`：YAML 编辑能力。
- `js-yaml`：YAML 解析与转换。
- `dayjs`：时间格式化与相对时间展示。
- `framer-motion`：动效支持（由动画组件使用）。

## 6. 开发规范

- 目录约定：
  - 页面与 API 严格放在 `src/app`（App Router 模式）。
  - 组件按业务语义拆分，复杂场景按子目录继续细分（如 `CreateDeploymentForm/steps`）。
- 代码风格：
  - 全面 TypeScript，开启 `strict`。
  - 使用 `@/*` 路径别名，避免深层相对路径。
  - API 处理统一 `try/catch` 并返回 JSON 错误结构。
- 交互约定：
  - 列表页统一走 `/api/*` 中间层，不在前端直接访问外部集群接口。
  - 表单提交前进行前端校验；创建类操作在服务端再次解析/校验（如 YAML）。
  - UI 以 Ant Design 为主，主题切换在 `PageLayout` 中集中处理。
