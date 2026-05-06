# 项目架构文档

## 1. 概述

- **项目名称**：`cluster-dashboard`（K8s 集群管理平台前端）。
- **技术栈**：`Next.js 16.2`（App Router）、`React 19`、`TypeScript`、`Ant Design 6`、`Tailwind CSS 4`（通过 `globals.css` 中 `@import "tailwindcss"` 与 PostCSS 插件接入）、`better-auth`（会话与用户名密码登录）、`pg` + `kysely`（认证数据落库）、`@volcengine/openapi`（火山引擎 VKE 集群列表等）、`Vercel AI SDK`（`ai` + `@ai-sdk/openai` 兼容 OpenAI 协议的上游对话）、`zod`（API 与表单校验）、`js-yaml` + CodeMirror（YAML 编辑）、`react-markdown` + `remark-gfm`（AI 回复 Markdown）。
- **构建与运行**：`npm`，`Node 20.x`；开发脚本 `scripts/dev-with-port-check.js` 做端口检测；Next 使用 `turbopack.root` 指向仓库根（见 `next.config.ts`）。

## 2. 目录结构

```text
cluster-dashboard/
├─ src/
│  ├─ app/                 # App Router：页面、loading、全局样式与 Route Handlers（API）
│  ├─ components/          # 布局、集群页、列表、表单、AI、通用组件
│  ├─ contexts/            # 主题上下文 ThemeProvider
│  ├─ lib/                 # K8s 请求、认证、会话校验、工具与 YAML 模板等
│  ├─ types/               # K8s 相关类型（如事件）
│  └─ middleware.ts        # 基于会话 Cookie 的登录拦截（排除部分静态路径）
├─ tests/                  # Vitest 单测、Playwright E2E
├─ docs/                   # 开发/审查/规范文档
├─ public/                 # 静态资源（如图标）
├─ scripts/                # dev 端口检查、husky 共享链接等辅助脚本
├─ next.config.ts          # Next 与 Turbopack root
├─ tsconfig.json           # strict、路径别名 @/* → src/*
├─ postcss.config.mjs      # @tailwindcss/postcss
├─ eslint.config.mjs       # ESLint（含 Next 推荐集）
├─ vitest.config.ts        # 单元/组件测试
├─ playwright.config.ts    # E2E
├─ vercel.json             # 平台侧构建/安装配置（若部署在 Vercel）
└─ package.json            # 依赖、脚本、engines
```

**核心配置文件作用**：

- `next.config.ts`：配置 `turbopack.root` 为项目根，保证 Turbopack 解析路径正确。
- `tsconfig.json`：`strict`、`moduleResolution: bundler`、`noEmit`，别名 `@/*` → `./src/*`。
- `postcss.config.mjs`：接入 Tailwind v4 的 PostCSS 插件。
- `src/instrumentation.ts`：Node 运行时启动时调用 `ensureAuthDatabaseReady()`，与请求路径上的兜底共同保证认证库就绪。

**说明**：仓库中不存在 `src/server` 目录；服务端逻辑分布在 Route Handlers、部分 RSC 页面与 `src/lib` 中。

## 3. 核心模块

### 3.1 `src/app`（路由结构）

**主要职责**：声明路由与布局；部分页面在服务端拉取火山引擎或 K8s 数据；通过 `src/app/api/**/route.ts` 提供 BFF 式 API。

**关键页面**：

- `layout.tsx`：根布局，引入 Ant Design reset 与 `globals.css`；包裹 `ClientLayout`（Ant Design `App` + 主题）；挂载 `FloatingInfoDot`；可选接入 `Analytics` / `SpeedInsights`。
- `page.tsx`（`/`）：服务端使用 `@volcengine/openapi` 调用 `ListClusters`，将初始列表交给 `HomePage`。
- `login/page.tsx`、`login/LoginForm.tsx`：登录页与表单（配合 better-auth）。
- `ai-chat/page.tsx`：全屏 AI 对话入口页，渲染 `AiChatStandaloneView`（无 `PageLayout`）。
- `cluster/[id]/page.tsx` 及子路径：`namespace`、`service`、`deployment`、`deployment/create`、`statefulset`、`event`、`yaml-create` 等资源视图；`loading.tsx` 使用 `PageLayout` 骨架。

**页面路由一览**：

```text
/
/login
/ai-chat
/cluster/[id]
/cluster/[id]/namespace
/cluster/[id]/service
/cluster/[id]/deployment
/cluster/[id]/deployment/create
/cluster/[id]/statefulset
/cluster/[id]/event
/cluster/[id]/yaml-create
```

**API Route Handlers 一览**：

```text
/api/auth/[...all]          # better-auth 统一入口（GET/POST）
/api/ai/chat                # 流式对话（需登录，限流，OpenAI 兼容上游）
/api/cluster                # K8s 版本/根信息类探测
/api/nodes|pods|namespaces|services|deployments|statefulsets|events
/api/kubernetes/create      # 基于 YAML 创建资源
/api/kubernetes/resource    # 查询/更新受 allowlist 约束 namespaced 资源
/api/volcengine             # 火山引擎 VKE ListClusters 等转发
```

**依赖关系**：页面组合 `src/components/*`；数据经 `fetch("/api/...")` 或 SSR 直接调库/第三方；动态段 `[id]` 作为集群上下文在 URL 与组件间传递。

### 3.2 `src/components`（组件组织方式）

**主要职责**：可复用 UI、集群资源列表与创建向导、首页与布局壳层。

**关键子目录与文件**：

- `layout/`
  - `ClientLayout.tsx`：全局 `antd` `App` 与 `ThemeProvider`，为消息框、主题切换等提供上下文。
  - `PageLayout.tsx`：集群内页侧栏导航 + 顶栏（含「AI 对话」链到 `/ai-chat`）、登出、主题切换；内容区 `ResponsiveContainer`。
  - `HomeTopBar.tsx`：首页顶栏（含「AI 对话」入口，与集群页顶栏行为对齐）。
  - `ThemeSwitcher.tsx`、`ResponsiveContainer.tsx`：主题与内容宽度。
- `cluster/`：`HomePage`、`ClusterCard`、`ClusterSummary`、`ClusterTabs` 等首页与集群概览。
- `lists/`：命名空间、工作负载、事件、节点、Pod 等表格/面板组件。
- `forms/`：`YamlCreate`、`CreateDeploymentForm` 及分步表单（代码中使用 `react-hook-form` 与 `@hookform/resolvers`、zod 等协作校验）。
- `ai/`：`AiChatPanel`（Markdown 渲染、草稿本地存储）、`AiChatStandaloneView`（全屏壳 + 返回 + 模型说明文案）。
- `common/`：`AppLinkButton`、`EmptyState`、`TableSkeleton`、`FadeIn`、`FloatingInfoDot` 等。

**依赖关系**：通过 `fetch` 调用自有 API；主题依赖 `contexts/ThemeContext.tsx`；部分展示依赖 `src/lib/utils.ts`、`k8sYamlTemplates.ts`。

### 3.3 `src/lib`（工具与集成）

**主要职责**：封装 K8s 与认证、会话门闸、环境解析与展示工具。

**关键文件**：

- `k8s.ts`：`k8sFetch` 读取 `K8S_API_SERVER`、`K8S_TOKEN`，统一 Bearer 与 `no-store`；模块加载时对 TLS 校验有项目内约定（见源码注释）。
- `auth.ts`：配置 `better-auth`（如 `username` 插件、`nextCookies`）、密码哈希、可信 Origin、`BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` 等解析。
- `auth-client.ts`：浏览器端 `authClient`（会话、登出等）。
- `auth-postgres.ts`：PostgreSQL 连接选项，供 better-auth / Kysely 使用。
- `auth-bootstrap.ts`：`ensureAuthDatabaseReady()` — 执行迁移并同步环境变量中的固定用户（启动与 API 入口多次幂等调用）。
- `auth-seed.ts` / `auth-seed-postgres.ts`：从环境解析用户列表并写入数据库的逻辑。
- `require-session.ts`：`assertAuthenticated()` 供 Route Handlers 在返回业务数据前校验会话。
- `utils.ts`、`k8sYamlTemplates.ts`、`theme.ts`：时间/状态文案、YAML 模板、主题 token 辅助。

**依赖关系**：被 `src/app/api/*`、`middleware` 间接依赖会话、`instrumentation.ts` 与部分服务端页面调用。

### 3.4 `src/middleware.ts`

**主要职责**：除 `/login` 与静态资源等匹配例外外，无 better-auth 会话 Cookie 则重定向到 `/login`，并附带 `callbackUrl`。

### 3.5 `src/contexts`、`src/types`

- `ThemeContext.tsx`：明暗等主题状态与持久化（与 `theme.ts`、Switcher 配合）。
- `types/k8s.ts`：如事件等结构的 TypeScript 描述，供列表/详情使用。

## 4. 数据流

- **认证**：浏览器持有 better-auth 会话 Cookie；`middleware` 保护页面路由；`/api/auth/*` 由 `auth.handler` 处理登录会话；受保护 API 在 handler 内 `await assertAuthenticated()`，内部 `auth.api.getSession` + `ensureAuthDatabaseReady()`。
- **客户端 → 本应用 BFF**：组件使用 `fetch("/api/...")`（如资源列表、YAML 应用、AI 发送）。AI 对话为流式响应，由 `/api/ai/chat` 输出。
- **BFF → Kubernetes**：多数 `/api/*` 在鉴权通过后调用 `k8sFetch` 访问集群 API。
- **BFF → 火山引擎**：首页 SSR 与 `/api/volcengine` 使用 `@volcengine/openapi` 与 AK/SK、区域等环境变量。
- **BFF → 大模型**：`/api/ai/chat` 使用 `AI_API_KEY` / `ZHIPU_API_KEY` 等环境变量与可选 `AI_BASE_URL`，通过 `@ai-sdk/openai` 兼容 OpenAI 协议；带简单内存限流（按 IP）。
- **状态管理**：以组件局部状态为主；主题为 `Context` + 持久化；Deployment 向导为 `react-hook-form` 生态；未引入 Redux/Zustand。

## 5. 外部依赖（摘要）

| 类别       | 代表依赖                                                           | 用途                      |
| ---------- | ------------------------------------------------------------------ | ------------------------- |
| 框架       | `next`、`react`、`react-dom`                                       | App Router、UI 渲染       |
| UI         | `antd`、`@ant-design/icons`                                        | 组件与图标                |
| 样式       | `tailwindcss`、`@tailwindcss/postcss`                              | 工具类与构建链            |
| 云与 K8s   | `@volcengine/openapi`、自建 `k8sFetch`                             | 火山 VKE、集群 API        |
| 认证与数据 | `better-auth`、`bcryptjs`、`pg`、`kysely`                          | 登录会话、Postgres 持久化 |
| AI         | `ai`、`@ai-sdk/openai`                                             | 服务端流式补全            |
| 校验与协议 | `zod`                                                              | 请求体/查询校验           |
| 编辑与文档 | `@uiw/react-codemirror`、`js-yaml`、`react-markdown`、`remark-gfm` | YAML 与富文本             |
| 观测       | `@vercel/analytics`、`@vercel/speed-insights`                      | 访问与性能（可选）        |
| 测试       | `vitest`、`@testing-library/*`、`playwright`、`msw`                | 单测与 E2E                |

## 6. 开发规范（从代码归纳）

- **路由与文件位置**：页面与 API 遵循 App Router 约定；动态路由参数通过 props/`useParams` 传递。
- **凭据不暴露给浏览器**：K8s Token、火山 AK/SK、模型 API Key 仅出现在服务端与环境变量；前端只调同源 `/api/*`。
- **导航**：优先 `next/link`；集群内统一 `PageLayout`；首页用 `HomeTopBar`；AI 为独立全屏页，入口在顶栏而非侧栏。
- **类型与路径**：严格 TypeScript；模块引用统一 `@/` 别名。
- **鉴权一致性**：新 API 若需登录，复用 `assertAuthenticated()`；页面级保护依赖 `middleware` 与会话 Cookie。
- **认证库就绪**：数据库迁移与用户种子通过 `ensureAuthDatabaseReady` 在 `instrumentation` 与 API 层触发，避免竞态。
- **列表与表单**：列表组件模式相近（筛选、空态、骨架）；YAML 与多步表单在提交前做校验，服务端再次校验（如 zod + allowlist）。
