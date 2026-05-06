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

| 变量名                        | 必填                           | 使用位置                                                                                                                         | 用途                                                                                                                                    | 本地开发                | Vercel 预览环境             | Vercel 生产环境               |
| ----------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------- | ----------------------------- |
| `VOLC_ACCESS_KEY_ID`          | 是（涉及火山接口时）           | `src/app/page.tsx`、`src/app/cluster/[id]/page.tsx`、`src/app/api/volcengine/route.ts`、`src/app/api/kubernetes/create/route.ts` | 火山引擎 OpenAPI 鉴权 AK                                                                                                                | 配置测试账号 AK         | 建议独立预览账号 AK         | 生产账号 AK                   |
| `VOLC_SECRET_ACCESS_KEY`      | 是（涉及火山接口时）           | 同上                                                                                                                             | 火山引擎 OpenAPI 鉴权 SK                                                                                                                | 配置测试账号 SK         | 建议独立预览账号 SK         | 生产账号 SK                   |
| `REGION`                      | 是（涉及火山接口时）           | 同上                                                                                                                             | 火山引擎 Region（如 `cn-beijing`）                                                                                                      | 与测试集群一致          | 与预览集群一致              | 与生产集群一致                |
| `K8S_API_SERVER`              | 是（访问 K8s 资源时）          | `src/lib/k8s.ts`（被 `src/app/api/*` 与部分页面调用）                                                                            | Kubernetes API Server 地址                                                                                                              | 指向测试集群 apiserver  | 指向预览集群 apiserver      | 指向生产集群 apiserver        |
| `K8S_TOKEN`                   | 是（访问 K8s 资源时）          | `src/lib/k8s.ts`                                                                                                                 | 访问 Kubernetes API 的 Bearer Token                                                                                                     | 低权限测试 Token        | 低权限预览 Token            | 最小权限生产 Token            |
| `AI_API_KEY`                  | 否（启用 AI 时与下行密钥择一） | `src/app/api/ai/chat/route.ts`                                                                                                   | 通用 OpenAI 兼容接口密钥（任意厂商 Key 均可放此变量）                                                                                   | 国内/自建网关 Key       | 同上                        | 同上                          |
| `ZHIPU_API_KEY`               | 否                             | 同上                                                                                                                             | 智谱开放平台 API Key                                                                                                                    | open.bigmodel.cn 申请   | 同上                        | 同上                          |
| `BIGMODEL_API_KEY`            | 否                             | 同上                                                                                                                             | 与 `ZHIPU_API_KEY` 同义别名                                                                                                             | 同上                    | 同上                        | 同上                          |
| `DEEPSEEK_API_KEY`            | 否                             | 同上                                                                                                                             | DeepSeek 密钥（仍支持）                                                                                                                 | 控制台申请              | 同上                        | 同上                          |
| `OPENAI_API_KEY`              | 否                             | 同上                                                                                                                             | OpenAI 官方密钥                                                                                                                         | 官方 Key                | 同上                        | 同上                          |
| `AI_BASE_URL`                 | 否                             | `src/app/api/ai/chat/route.ts`                                                                                                   | OpenAI 兼容基址；智谱为 `https://open.bigmodel.cn/api/paas/v4`；留空则走 OpenAI 官方                                                    | 按需                    | 按需                        | 按需                          |
| `AI_MODEL`                    | 否                             | `src/app/api/ai/chat/route.ts`                                                                                                   | 模型 ID；留空时：官方默认 `gpt-4o-mini`，智谱默认 `glm-4.5-flash`，DeepSeek 默认 `deepseek-chat`                                        | 可留空                  | 按需配置                    | 建议明确配置                  |
| `BETTER_AUTH_SECRET`          | 是（控制台登录）               | `src/lib/auth.ts`、`src/middleware.ts`（Cookie 校验）、`src/lib/require-session.ts`                                              | Better Auth 加密密钥，须 ≥32 字符                                                                                                       | 本地随机生成            | Preview/Production 分别配置 | 生产强随机、勿与 Preview 共用 |
| `BETTER_AUTH_URL`             | 是（公网部署）                 | `src/lib/auth.ts`                                                                                                                | 站点完整 URL（含 `https://`）                                                                                                           | `http://127.0.0.1:3001` | 预览域名                    | 生产自定义域                  |
| `AUTH_USERS_JSON`             | 是（控制台登录，与下行择一）   | `src/lib/auth-seed.ts`                                                                                                           | 固定账号列表 JSON（仅 bcrypt 哈希）                                                                                                     | 见下文；注意 `$` 展开   | 与生产隔离的测试账号        | 生产账号哈希                  |
| `AUTH_USERS_JSON_FILE`        | 否                             | `src/lib/auth-seed.ts`                                                                                                           | 账号 JSON 文件路径（相对仓库根），优先于行内 JSON / Base64                                                                              | 推荐本地使用            | 可选                        | 可选                          |
| `AUTH_USERS_JSON_BASE64`      | 否                             | `src/lib/auth-seed.ts`                                                                                                           | 与 `AUTH_USERS_JSON` 相同内容经 **Base64** 编码，适合云端控制台不便写裸 `$` 时                                                          | 可选                    | **推荐**（免 `$` 插值问题） | 可选                          |
| `AUTH_DATABASE_URL`           | 是（控制台登录）               | `src/lib/auth-postgres.ts`、`src/lib/auth.ts`                                                                                    | **Postgres** 连接串（Better Auth + Kysely + `pg`）；未设时依次尝试 `POSTGRES_PRISMA_URL`、`POSTGRES_URL`、`DATABASE_URL`（Neon 见下文） | Neon（推荐）/ RDS 等    | 与托管库一致                | 与托管库一致                  |
| `BETTER_AUTH_TRUSTED_ORIGINS` | 否                             | `src/lib/auth.ts`                                                                                                                | 额外信任的 Origin（逗号/空格分隔），自定义域与预览域不一致时可配                                                                        | 可留空                  | 按需                        | 多域时建议配置                |

<!-- > 说明：
>
> - 当前代码中上述变量使用了非空断言（`!`）或启动即校验，缺失会导致请求失败或启动时报错。
> - **AI 对话**：密钥按 `AI_API_KEY` → `ZHIPU_API_KEY` → `BIGMODEL_API_KEY` → `DEEPSEEK_API_KEY` → `OPENAI_API_KEY` 依次读取，至少配置其一才会启用流式对话。使用智谱、DeepSeek 等国内 OpenAI 兼容服务时，**必须**设置 `AI_BASE_URL`，否则仍会请求 OpenAI 官方；`AI_MODEL` 可省略（代码会按基址 URL 选择默认模型，见上表）。智谱 Flash 系列单价低且常有试用额度，具体计费以官网为准。
> - `K8S_API_SERVER` 与 `K8S_TOKEN` 在 `src/lib/k8s.ts` 中是模块加载即检查，因此任何引用 `k8sFetch` 的服务端逻辑都会依赖这两个变量。
> - 未登录用户无法访问 `/` 与 `/cluster/*` 等页面；所有业务 API 也会校验会话，请勿在浏览器外暴露 Cookie。
> - **登录仅使用 Postgres**（`src/lib/auth.ts` + `src/lib/auth-postgres.ts`）：须配置 `AUTH_DATABASE_URL` 或回退变量之一（见上表）。本地与线上推荐 [Neon](https://neon.tech) 等托管库；GitHub Actions 的 `npm run build` 须在仓库 **Actions secrets** 中配置 `AUTH_DATABASE_URL`（可与 Neon 上专用于 CI 的分支库一致），见 `.github/workflows/lint-dev.yml`。
> - 固定账号由 **`AUTH_USERS_JSON_FILE`（存在则最优先）**、**`AUTH_USERS_JSON_BASE64`** 或 **`AUTH_USERS_JSON`** 提供其一即可，为 JSON 数组，元素形如 `{"username":"alice","passwordHash":"$2b$..."}`。生成哈希（Node）：`node -e "const b=require('bcryptjs'); console.log(b.hashSync('你的密码',10))"`，勿把明文密码写入仓库或 Vercel 变量值。
> - **重要**：Next.js 加载 `.env.local` 时会展开 `$变量名`。bcrypt 哈希里的 `$2b`、`$10` 等会被破坏，导致永远提示密码错误。可选：① `AUTH_USERS_JSON_FILE` 指向 JSON 文件（已忽略 `auth-users.local.json`）；② `.env.local` 里 `AUTH_USERS_JSON` 对每个 `$` 写成 `\$`；③ **线上控制台**：用 **`AUTH_USERS_JSON_BASE64`**（见下），避免裸 `$` 与 `\$` 在各平台行为不一致。 -->

<!-- ### 本地 `.env.local` 示例

```bash
VOLC_ACCESS_KEY_ID=your_ak
VOLC_SECRET_ACCESS_KEY=your_sk
REGION=cn-beijing
K8S_API_SERVER=https://your-k8s-api-server
K8S_TOKEN=your_k8s_bearer_token
# OpenAI 官方（不设 AI_BASE_URL）
OPENAI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4o-mini

# 智谱 GLM（OpenAI 兼容，推荐 Flash 低成本）：须设置基址 + 其一密钥变量
# AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
# ZHIPU_API_KEY=你的_api_key
# AI_MODEL=glm-4.5-flash
# DeepSeek 示例：AI_BASE_URL=https://api.deepseek.com/v1 ； DEEPSEEK_API_KEY=...
# 须 ≥32 字符；勿用中文说明句当值（长度不够）。生成示例：openssl rand -base64 32
BETTER_AUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BETTER_AUTH_URL=http://127.0.0.1:3001
# 登录库（Neon pooled URL 等标准 Postgres 连接串）
AUTH_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
# 推荐：账号 JSON 单独文件，避免 .env 破坏 bcrypt 中的 $
AUTH_USERS_JSON_FILE=auth-users.local.json
# 若坚持用一行 JSON，须对哈希里每个 $ 转义为 \$
# AUTH_USERS_JSON=[{"username":"admin","passwordHash":"\\$2b\\$10\\$……"}]
#
# 线上（Vercel 等）推荐 Base64，避免控制台对 $ 的插值/转义与本地不一致。生成（bash：单引号包住整段脚本，哈希用真实 60 字符替换占位）：
# node -e 'const j=JSON.stringify([{username:"admin",passwordHash:"$2b$10$此处替换为node生成的完整哈希"}]); console.log(Buffer.from(j,"utf8").toString("base64"))'
# AUTH_USERS_JSON_BASE64=（粘贴上面命令输出的整段 base64，勿换行）
```

`auth-users.local.json` 示例（单行或多行均可，勿提交到 git）：

```json
[{ "username": "admin", "passwordHash": "$2b$10$此处粘贴 node 生成的完整 60 字符哈希" }]
```

> 未配置时，`next dev` 下会使用代码内本地占位密钥并打日志警告；`next build` / 生产环境仍必须在环境变量中提供 ≥32 字符的 `BETTER_AUTH_SECRET`。

Playwright E2E 会由 `playwright.config.ts` 注入 `BETTER_AUTH_*` 与测试账号 JSON；**还须**在环境里提供 `AUTH_DATABASE_URL`（或 `DATABASE_URL` 等回退变量），与 `npm run dev` 相同，否则 dev server 无法启动。若使用 `PW_REUSE_DEV_SERVER=1`，本机 dev 须已配置上述全部变量。

### Neon 接入（登录用 Postgres）

本仓库登录库固定为 **`pg` + Kysely + Postgres**，与 [Neon](https://neon.tech) 等托管库兼容。业务里若另有 Server Action 写库，可另装 `@neondatabase/serverless` 使用 `neon()`，与认证无关。

1. **在 Neon 控制台**创建项目，打开 **Connection details**。部署在 Vercel Serverless 时，优先复制带 **Connection pooling**（主机名常含 `pooler`）的 URL，避免冷启动打满直连数。
2. **写入环境变量**（任选其一，优先级从上到下，见 `src/lib/auth-postgres.ts` 中 `resolvePostgresConnectionString`）：
   - **推荐**：`AUTH_DATABASE_URL` = 上一步连接串（与业务库 `DATABASE_URL` 分离时，认证表独占一库更清晰）。
   - 若使用 **Vercel Marketplace · Neon** 且只注入了 `POSTGRES_PRISMA_URL` / `POSTGRES_URL` / `DATABASE_URL`，代码会自动读取，无需再复制一份到 `AUTH_DATABASE_URL`（注意：若 `DATABASE_URL` 指向非 Postgres 或非本应用库，请勿依赖回退，应显式配置 `AUTH_DATABASE_URL`）。
3. 连接串一般已含 **`sslmode=require`**；若手动拼接，请保留 TLS 相关参数。
4. **其余与本地一致**：`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`（或依赖 `VERCEL_URL`）、`AUTH_USERS_JSON_BASE64` 等。首次有流量时 `ensureAuthDatabaseReady` 会跑 Better Auth **迁移**并在库里 **upsert 固定账号**。

#### 与 Neon 官方「Next.js + Server Actions」教程的对应

Neon 文档中的典型流程是：`vercel env pull .env.development.local` → 安装 `@neondatabase/serverless` → 在 Server Action 里用 `neon(process.env.DATABASE_URL)` 执行 `INSERT`。与本仓库关系如下：

| 教程步骤                   | 在本仓库中的情况                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 拉取环境变量               | 可同样执行 `vercel env pull .env.development.local`（或 `.env.local`），确保本地有 `DATABASE_URL` / `POSTGRES_PRISMA_URL` 等；Next 会按 [官方说明](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables) 加载。                                                                                     |
| `@neondatabase/serverless` | **登录（Better Auth）不依赖该包**：`src/lib/auth-postgres.ts` 使用 **`pg` + Kysely**，只要连接串是标准 Postgres（含 Neon 的 pooled URL）即可。若你要**另外**写业务表（如教程里的 `comments`）的 Server Action，可单独 `npm install @neondatabase/serverless` 并在那些模块里使用 `neon()`，与认证库可以共用同一个 Neon 项目里的不同表。 |
| 在控制台建表               | 认证相关表由 **Better Auth 迁移**自动创建，无需手抄教程里的 `CREATE TABLE`。业务表仍可在 Neon SQL Editor 中自行执行 DDL。                                                                                                                                                                                                              |
| `DATABASE_URL`             | 已在 `resolvePostgresConnectionString()` 中作为回退读取；与教程示例一致。更稳妥时可另设 `AUTH_DATABASE_URL` 指向同一串或专用分支库。                                                                                                                                                                                                   | -->

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
