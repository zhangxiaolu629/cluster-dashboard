# 2026-05-05 11:02 (UTC) Critical Bug Inspection

## 用户任务

执行一次高严重度 bug 巡检，聚焦近期提交中可能导致数据丢失、崩溃、安全漏洞或显著用户影响的问题。若确认存在真实高危问题，则最小化修复并补充验证。

## 检查过程摘要

- 阅读项目代码审查规范与安全检查清单。
- 对比近期提交，重点检查新增的 Kubernetes 资源修改/删除接口和 AI 对话接口。
- 追踪 `src/app/api/kubernetes/resource/route.ts` 到各列表组件的删除、YAML 更新调用链。
- 确认 Kubernetes 资源接口将用户控制的 `name` 与 `namespace` 直接拼入下游 API path，存在路径穿越改道风险。

## 修复摘要

- 在 Kubernetes 资源接口中引入资源名/命名空间 schema 校验，拒绝包含路径片段的非法值。
- 对进入 Kubernetes API path 的动态段执行 `encodeURIComponent`。
- 新增单元测试覆盖 DELETE/GET 查询参数和 PUT YAML metadata 的路径穿越拦截，以及合法更新路径。

## 验证情况

- 已提交并推送修复提交：`4f296f0 fix: validate kubernetes resource path segments`。
- 当前环境缺少 `node`/`npm` 可执行文件，无法在本机执行 Vitest；已通过代码审阅和新增测试用例锁定预期行为。
