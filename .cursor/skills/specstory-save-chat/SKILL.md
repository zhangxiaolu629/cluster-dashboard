---
name: specstory-save-chat
description: 在重要会话结束后，按项目约定使用 SpecStory 将聊天记录保存到 docs/specstory/ 并使用时间命名文件。
---

# SpecStory 会话保存助手

当用户要求“保存聊天记录”“归档当前会话”“用 SpecStory 保存对话”时，使用此 skill。

## 目标

将当前会话通过 SpecStory 保存到项目目录 `docs/specstory/`，并使用时间命名文件，便于版本管理与追溯。

## 执行步骤

1. 打开命令面板：`Ctrl+Shift+P`  
2. 输入并执行：`SpecStory: Save Story`（或 `SpecStory: Save Current Story`）  
3. 在保存位置中选择：`docs/specstory/`  
4. 文件名使用时间格式，推荐：
   - `YYYY-MM-DD-HH-mm.md`
   - 或 `YYYY-MM-DD-HH-mm-主题关键词.md`（例如：`2026-04-27-18-45-ssr-refactor.md`）

## 输出模板

完成后按以下格式反馈用户：

```markdown
已完成 SpecStory 会话保存：
- 保存目录：`docs/specstory/`
- 文件名：`<实际文件名>`
```

## 执行规则

- 输出全文使用中文。
- 优先遵循项目约定：重要会话统一保存到 `docs/specstory/`。
- 如果文件名不是时间格式，需提示用户并建议改名。
- 每次新生成文件必须只包含“本次新增会话内容”，不得重复包含已在历史文件中归档的内容。
- 如发现新文件包含历史重复内容，需自动去重：保留新增部分并移除与最近已归档文件重叠的前缀内容。
- 去重后建议在文件开头补时间标题（例如：`# YYYY-MM-DD HH:mm (UTC+8)`）以提升可读性。
