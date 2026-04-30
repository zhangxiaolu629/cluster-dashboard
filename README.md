# K8s 集群管理平台（cluster-dashboard）

基于 **Next.js App Router** 的 Web 控制台，用于查看与操作 Kubernetes 资源，并与火山引擎等集群源对接。技术栈为 **Next.js 16、React 19、TypeScript、Ant Design 6、Tailwind CSS 4** 等，详见 [架构文档](#架构文档)。

## 文档索引

### 架构文档

系统性的目录结构、路由、核心模块、数据流与配置说明见项目根目录：

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**

架构文档如需随代码更新，可配合仓库内 Cursor Skill **`architecture-doc-generator`**（见下表）按代码现状重新生成或增补。

### 测试文档

测试分层、运行方式、目录说明与到「自动化测试方案」的链接：

- **[docs/testing.md](./docs/testing.md)**（测试说明与命令索引）
- **[docs/testing-plan.md](./docs/testing-plan.md)**（自动化测试方案，目标、分层、Mock 与 CI 策略等）

### 共享规则仓库

- 统一规则源目录：`/.shared/rules`
- 本地通过符号链接（Windows 使用 junction）将以下目录指向共享规则：
  - `.cursor/rules -> .shared/rules`
  - `.trae/rules -> .shared/rules`
- 首次 `npm install` 会自动执行 `prepare`，创建/修复这些链接；也可手动执行：
  - `npm run setup:shared-links`

## 环境要求

- **Node.js**：`20.x`（见 `package.json` 中 `engines`）
- 包管理：本仓库使用 **npm**（`package-lock.json`）

## 快速开始

```bash
npm install
npm run dev
```

开发服务器默认使用 **3001** 端口（由 `scripts/dev-with-port-check.js` 启动 `next dev -p 3001`；若 3001 被占用，脚本会尝试先清理再启动）。浏览器访问：

**http://127.0.0.1:3001**

> 与官方模板默认的 3000 不同，请以外部脚本与 `playwright.config.ts` 中 `baseURL` 为准。

其他常用命令：

| 命令                         | 说明                                                  |
| ---------------------------- | ----------------------------------------------------- |
| `npm run build`              | 生产构建                                              |
| `npm run start`              | 启动生产服务（需先 `build`）                          |
| `npm run lint`               | ESLint 检查                                           |
| `npm run test:unit`          | 单元/组件/API 测试（Vitest）                          |
| `npm run test:e2e`           | E2E 测试（Playwright）                                |
| `npm run test`               | 单元后接 E2E（完整验证耗时较长）                      |
| `npm run setup:shared-links` | 创建/修复 `.cursor/.trae` 到 `.shared` 的规则目录链接 |

## 环境变量

业务与接口依赖的密钥、集群地址等请通过环境变量配置；本地可使用 `.env.local`（勿提交到仓库）。

### 环境变量矩阵

| 变量名                   | 必填                  | 使用位置                                                                                                                         | 用途                                | 本地开发               | Vercel 预览环境        | Vercel 生产环境        |
| ------------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------- | ---------------------- | ---------------------- |
| `VOLC_ACCESS_KEY_ID`     | 是（涉及火山接口时）  | `src/app/page.tsx`、`src/app/cluster/[id]/page.tsx`、`src/app/api/volcengine/route.ts`、`src/app/api/kubernetes/create/route.ts` | 火山引擎 OpenAPI 鉴权 AK            | 配置测试账号 AK        | 建议独立预览账号 AK    | 生产账号 AK            |
| `VOLC_SECRET_ACCESS_KEY` | 是（涉及火山接口时）  | 同上                                                                                                                             | 火山引擎 OpenAPI 鉴权 SK            | 配置测试账号 SK        | 建议独立预览账号 SK    | 生产账号 SK            |
| `REGION`                 | 是（涉及火山接口时）  | 同上                                                                                                                             | 火山引擎 Region（如 `cn-beijing`）  | 与测试集群一致         | 与预览集群一致         | 与生产集群一致         |
| `K8S_API_SERVER`         | 是（访问 K8s 资源时） | `src/lib/k8s.ts`（被 `src/app/api/*` 与部分页面调用）                                                                            | Kubernetes API Server 地址          | 指向测试集群 apiserver | 指向预览集群 apiserver | 指向生产集群 apiserver |
| `K8S_TOKEN`              | 是（访问 K8s 资源时） | `src/lib/k8s.ts`                                                                                                                 | 访问 Kubernetes API 的 Bearer Token | 低权限测试 Token       | 低权限预览 Token       | 最小权限生产 Token     |

> 说明：
>
> - 当前代码中上述变量使用了非空断言（`!`）或启动即校验，缺失会导致请求失败或启动时报错。
> - `K8S_API_SERVER` 与 `K8S_TOKEN` 在 `src/lib/k8s.ts` 中是模块加载即检查，因此任何引用 `k8sFetch` 的服务端逻辑都会依赖这两个变量。

### 本地 `.env.local` 示例

```bash
VOLC_ACCESS_KEY_ID=your_ak
VOLC_SECRET_ACCESS_KEY=your_sk
REGION=cn-beijing
K8S_API_SERVER=https://your-k8s-api-server
K8S_TOKEN=your_k8s_bearer_token
```

## 部署说明（Vercel）

### 1) 部署前检查

- Node 版本保持 `20.x`（与 `package.json#engines` 一致）。
- 在 Vercel Project Settings -> Environment Variables 中按上表配置 `Preview` 与 `Production`。
- 确认目标环境可访问 Kubernetes API Server（网络与证书策略一致）。

### 2) 构建与启动

- `vercel.json` 已定义：
  - `installCommand`: `npm ci`
  - `buildCommand`: `npm run build`
  - `framework`: `nextjs`
- 本地模拟生产：
  - `npm ci`
  - `npm run build`
  - `npm run start`

### 3) 发布建议

- `Preview` 使用测试/沙箱集群与最小权限凭据，避免误操作生产资源。
- `Production` 使用独立生产凭据，严禁与 Preview 共用同一组 AK/SK、Token。
- 凭据轮换后同步更新 Vercel 环境变量并重新部署验证。

## 项目 Cursor Skills 列表

以下 Skill 位于 **`.cursor/skills/<技能名>/SKILL.md`**，供 Cursor 根据任务自动选用或你手动 @ 使用。

| 技能名                       | 路径                                                                                                         | 用途简述                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `architecture-doc-generator` | [`.cursor/skills/architecture-doc-generator/SKILL.md`](./.cursor/skills/architecture-doc-generator/SKILL.md) | 按当前仓库分析目录、技术栈、路由与数据流，生成或更新 `ARCHITECTURE.md`   |
| `code-review-assistant`      | [`.cursor/skills/code-review-assistant/SKILL.md`](./.cursor/skills/code-review-assistant/SKILL.md)           | 按 `docs/code-review/` 下约定做代码审查，输出可贴 PR 的中文结论          |
| `specstory-save-chat`        | [`.cursor/skills/specstory-save-chat/SKILL.md`](./.cursor/skills/specstory-save-chat/SKILL.md)               | 重要会话结束后，用 SpecStory 将对话保存到 `docs/specstory/` 并按时间命名 |

## 其他约定

- 代码审查输出格式等：见 [docs/code-review/README.md](./docs/code-review/README.md)
- 与 Next.js 本身相关的学习资料，仍以 [Next.js 官方文档](https://nextjs.org/docs) 为准

## License

以仓库内 `LICENSE` 或组织策略为准；若未提供则默认与组织私有政策一致。
