# 项目架构文档

## 1. 概述

- 项目名称：`cluster-dashboard`
- 技术栈：`Next.js 16 (App Router)`、`React 19`、`TypeScript`、`Ant Design 6`、`Tailwind CSS 4（PostCSS 插件）`、`@volcengine/openapi`、`js-yaml`、`dayjs`
- 构建与运行：`Next.js + Turbopack`，包管理为 `npm`，Node 版本约束 `20.x`

## 2. 目录结构

```text
cluster-dashboard/
├─ src/
│  ├─ app/                    # App Router 页面与 Route Handler（API）
│  ├─ components/             # 业务组件、布局、表单、通用组件
│  ├─ contexts/               # 主题上下文（ThemeProvider）
│  ├─ lib/                    # 工具函数与 K8s/主题相关封装
│  └─ types/                  # K8s 事件等类型定义
├─ tests/                     # Vitest 单测与 Playwright E2E
├─ docs/                      # 开发、测试、代码审查规范文档
├─ public/                    # 静态资源
├─ scripts/                   # 开发辅助脚本（端口检测、共享规则链接）
├─ next.config.ts             # Next 配置（Turbopack root）
├─ tsconfig.json              # TS 严格模式、路径别名 @/*
├─ eslint.config.mjs          # ESLint（Next Core Web Vitals + TS）
├─ postcss.config.mjs         # PostCSS（@tailwindcss/postcss）
├─ vitest.config.ts           # 单元/组件/API 测试配置
├─ playwright.config.ts       # E2E 配置（dev server、baseURL）
├─ vercel.json                # Vercel 安装与构建命令
└─ package.json               # 脚本、依赖、Node 版本约束
```

核心配置文件作用：

- `next.config.ts`：设置 `turbopack.root`，确保在当前仓库根目录进行构建与热更新解析。
- `tsconfig.json`：启用 `strict`、`moduleResolution: bundler`、`noEmit`，并提供 `@/* -> src/*` 路径映射。
- `eslint.config.mjs`：基于 Next 官方规则集，补充忽略目录（如 `.next`、`scripts/**`）。
- `postcss.config.mjs`：启用 Tailwind v4 PostCSS 插件。
- `vitest.config.ts` / `playwright.config.ts`：分别覆盖单元测试与端到端测试执行入口。

## 3. 核心模块

### 3.1 `src/app`（路由结构）

主要职责：

- 定义页面路由、全局布局、加载态与 API Route Handlers。
- 在服务端首屏阶段预取集群/资源数据并下发给客户端组件。

关键文件及作用：

- `src/app/layout.tsx`：全局布局，挂载 `ThemeProvider`、全局样式与 `FloatingInfoDot`。
- `src/app/page.tsx`：首页（`/`）服务端调用火山引擎 `ListClusters`，向 `HomePage` 注入首屏数据。
- `src/app/cluster/[id]/page.tsx`：集群详情首页，服务端拉取指定集群摘要。
- `src/app/cluster/[id]/*/page.tsx`：命名空间、服务、部署、StatefulSet、事件、YAML 新建等资源页面。
- `src/app/cluster/[id]/deployment/create/page.tsx`：Deployment 表单创建入口。
- `src/app/api/*/route.ts`：后端 API 中间层，负责向 K8s API 或火山引擎 API 转发。

页面路由：

```text
/
/cluster/[id]
/cluster/[id]/namespace
/cluster/[id]/service
/cluster/[id]/deployment
/cluster/[id]/deployment/create
/cluster/[id]/statefulset
/cluster/[id]/event
/cluster/[id]/yaml-create
```

API 路由：

```text
/api/cluster
/api/nodes
/api/pods
/api/namespaces
/api/services
/api/deployments
/api/statefulsets
/api/events
/api/volcengine
/api/kubernetes/create
```

依赖关系：

- 页面路由依赖 `src/components` 进行渲染与交互。
- Route Handlers 依赖 `src/lib/k8s.ts` 或 `@volcengine/openapi` 完成数据访问。
- 动态路由参数 `id` 作为集群上下文传递给布局与资源组件。

### 3.2 `src/components`（组件组织方式）

主要职责：

- 承载 UI 视图、列表交互、表单创建流程与导航结构。

关键子模块：

- `components/layout/`
  - `PageLayout.tsx`：侧栏导航、主题切换、内容容器，统一集群子页面框架。
  - `ResponsiveContainer.tsx`、`ThemeSwitcher.tsx`：布局与主题能力补充。
- `components/cluster/`
  - `HomePage.tsx`、`ClusterCard.tsx`：首页集群卡片与统计视图。
  - `ClusterSummary.tsx`、`ClusterTabs.tsx`：集群概要与节点/Pod 面板。
- `components/lists/`
  - `NamespaceList.tsx`、`ServiceList.tsx`、`DeploymentList.tsx`、`StatefulSetList.tsx`、`EventList.tsx`、`NodeListPanel.tsx`、`PodListPanel.tsx`。
  - 统一包含筛选、排序、搜索、空态等列表行为。
- `components/forms/`
  - `YamlCreate.tsx`：YAML 编辑、格式校验、上传与创建请求。
  - `CreateDeploymentForm.tsx` + `CreateDeploymentForm/steps/*`：多步骤创建 Deployment。
- `components/common/`
  - `AppLinkButton.tsx`：基于 `next/link` 的按钮型导航组件（支持预取）。
  - `EmptyState.tsx`、`TableSkeleton.tsx`、`FadeIn.tsx`、`FloatingInfoDot.tsx` 等通用组件。

依赖关系：

- 组件层通过浏览器 `fetch("/api/*")` 调用 `src/app/api`。
- 表单与列表复用 `src/lib/utils.ts`、`src/lib/k8sYamlTemplates.ts` 的工具能力。
- 主题相关组件依赖 `src/contexts/ThemeContext.tsx`。

### 3.3 `src/lib`（工具函数和第三方配置）

主要职责：

- 提供跨模块复用工具，封装外部 API 访问与展示辅助逻辑。

关键文件及作用：

- `src/lib/k8s.ts`：封装 `k8sFetch`，统一注入 Bearer Token、`no-store` 缓存策略与错误处理。
- `src/lib/utils.ts`：时间格式化、资源状态文本/颜色映射。
- `src/lib/k8sYamlTemplates.ts`：YAML 快速创建模板生成（Namespace/Service/Deployment/StatefulSet）。
- `src/lib/theme.ts`：定义 light/dark/compact/cartoon/illustration 主题 token。

依赖关系：

- 被 `src/app/api/*` 与服务端页面直接使用（尤其 `k8sFetch`）。
- 被 `src/components` 用于展示逻辑和初始模板。

### 3.4 `src/server`（服务端逻辑）

- 当前仓库中不存在 `src/server` 目录。
- 现有服务端逻辑集中在：
  - `src/app/api/*/route.ts`（Next.js Route Handlers）
  - 部分服务端页面（如 `src/app/page.tsx`、`src/app/cluster/[id]/*/page.tsx`）中的首屏数据预取。

## 4. 数据流

- 客户端到服务端请求路径：
  - 首屏 SSR：页面组件在服务端直接调用 `k8sFetch` 或火山引擎 `Service.createJSONAPI(...)` 拉取初始数据。
  - 交互阶段：客户端组件通过 `fetch("/api/...")` 访问 Route Handlers。
  - Route Handlers 再向上游发起请求：
    - Kubernetes API：由 `src/lib/k8s.ts` 统一访问 `K8S_API_SERVER`。
    - 火山引擎 API：由 `@volcengine/openapi` 调用 `ListClusters`、`ForwardKubernetesApi` 等能力。
  - 返回 JSON 后由客户端更新本地状态并刷新表格/卡片/表单状态。
- 状态管理方式：
  - 以组件内 `useState/useEffect/useMemo/useCallback` 为主。
  - 表单流程使用 `react-hook-form + zod`（依赖已在 `package.json` 声明）。
  - 主题状态由 `ThemeContext` + `localStorage` 持久化。
  - 当前未引入 Redux、Zustand 等全局状态库。

## 5. 外部依赖

- `next`、`react`、`react-dom`：应用框架与渲染运行时。
- `antd`：布局、表格、表单、反馈提示等 UI 组件。
- `@volcengine/openapi`：与火山引擎 VKE/OpenAPI 通信。
- `js-yaml`、`@uiw/react-codemirror`、`@codemirror/lang-yaml`：YAML 编辑与解析。
- `dayjs`：时间展示（绝对时间/相对时间）。
- `framer-motion`：动效支持。
- `@vercel/analytics`：页面访问分析埋点。
- 测试工具：`vitest`、`@testing-library/*`、`playwright`、`msw`。

## 6. 开发规范

- 基于现有代码可归纳的约定：
  - 页面与后端接口统一放在 `src/app`（App Router 结构）。
  - API 请求优先走 `/api/*` 中间层，避免前端直接暴露集群凭据。
  - 列表页模式统一：服务端首屏预取 + 客户端按需刷新（筛选/搜索）。
  - 导航统一使用 `next/link`（含预取），并由 `PageLayout` 管理菜单入口。
  - 样式以 Ant Design token 与组件样式为主，主题通过 `ThemeProvider` 管理。
  - TypeScript 严格模式 + `@/*` 别名，减少隐式类型与深层相对路径。
  - 资源创建（如 YAML）在服务端再次校验并转发，降低客户端误提交风险。
