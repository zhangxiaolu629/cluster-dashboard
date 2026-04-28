# K8s 集群管理平台（cluster-dashboard）

基于 **Next.js App Router** 的 Web 控制台，用于查看与操作 Kubernetes 资源，并与火山引擎等集群源对接。技术栈为 **Next.js 16、React 19、TypeScript、Ant Design 6、Tailwind CSS 4** 等，详见 [架构文档](#架构文档)。

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

业务与接口依赖的密钥、集群地址等请通过环境变量配置；本地可自建 `.env.local`（勿提交含密钥的明文）。具体键名以 `src/app/api`、`src/lib` 中的引用与部署文档为准。

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
