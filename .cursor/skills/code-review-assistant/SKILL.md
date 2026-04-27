---
name: code-review-assistant
description: 按项目约定执行代码审查，重点检查安全、业务逻辑、性能与目录规范，并按统一 PR 评论格式输出结论。
---

# 代码审查助手

当用户要求进行代码审查（Code Review / CR / review）时，使用此 skill。

## 目标

基于项目实际代码与变更内容，输出可直接用于 PR 评论的中文审查结果。

## 审查前必读

开始审查前，先阅读并遵循以下文档：
- `docs/code-review/README.md`
- `docs/code-review/security.md`
- `docs/code-review/performance.md`
- `docs/code-review/nextjs-checklist.md`
- `docs/code-review/examples.md`

## 必须检查

- [ ] 是否有潜在的性能问题（N+1 查询、不必要的客户端组件）
- [ ] 是否有安全风险（XSS、敏感信息硬编码）
- [ ] 是否遵循项目目录约定
- [ ] 是否有明显的逻辑错误

## 忽略项

- 代码格式（交给 Prettier）
- 命名风格（除非严重不规范）

## 优先级

1. 安全性
2. 业务逻辑
3. 性能
4. 可维护性
5. 代码风格

## Next.js 特殊检查项

- [ ] Server Component 是否错误地使用了 `'use client'`
- [ ] 图片是否优先使用 `next/image` 而不是 `<img>`
- [ ] API 密钥是否通过环境变量注入，而不是写死在代码中
- [ ] 是否在 Server Action 外部直接调用了数据库

## 输出格式（用于 PR 评论）

必须使用以下结构：

```markdown
**严重问题** 🔴
- 问题描述 + 具体位置 + 修复建议

**建议改进** 🟡
- 问题描述 + 为什么 + 可选方案

**正面反馈** 🟢
- 指出写得好的地方
```

## 执行规则

- 输出全文必须使用中文。
- 所有结论必须基于真实代码或真实变更，不得臆测。
- 发现问题时，优先给出可执行修复建议。
- 如果未发现严重问题，也要明确写出“未发现严重问题”，并补充剩余风险或测试盲区。
