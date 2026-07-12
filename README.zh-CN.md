# OpenNori

面向编码 agent 的 repo-native 工程工作流，以可验证结果判断完成。

阅读语言：[English](./README.md) | 简体中文

[![npm version](https://img.shields.io/npm/v/opennori.svg)](https://www.npmjs.com/package/opennori)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)

OpenNori 帮助编码 agent 把一个目标从结果确认推进到经过验证的 Git 交付。工作流和稳定项目知识随仓库保留，因此新的对话可以继续工作，而不必把聊天记录当成项目事实。

## 开始使用

先在当前机器安装一次 OpenNori，再初始化每个项目：

```bash
npx opennori setup
cd <project>
opennori init --user <name>
```

在项目中开启新的 Codex 对话，直接描述你的需求：

```text
为账号删除增加可恢复的确认流程。
```

OpenNori 会自动参与。创建 task 前，agent 会询问本轮是否进入 OpenNori 工作流。小修改可以拒绝并直接处理；同意后进入 Plan。创建 task 不代表批准结果边界，也不会直接开始实现。

Claude Code 是可选的第二宿主：

```bash
npx opennori setup --platform claude
opennori init --user <name> --platform claude
```

随后开启新的 Claude Code 对话，同样直接描述目标。
setup 会通过 Claude Code 官方 Marketplace 命令安装 OpenNori Plugin；init 只写项目
入口和共享状态。Claude 的会话与每轮 Hook 会像 Codex 一样自动完成 task 路由和有界
上下文注入。

如果项目已经在使用 Codex，可以保留原适配器，再通过可审阅的生命周期操作加入
Claude Code：

```bash
npx opennori setup --platform claude
opennori platform add claude --dry-run
opennori platform add claude --confirm
opennori doctor
```

之后 OpenNori 会根据当前 Codex 或 Claude Code 会话选择宿主；两者共享同一套项目
task、结果约定、验证事实和 Git 交付状态。

## 四阶段工作流

每个目标都经过四个阶段：

1. **Plan**：agent 阅读项目、澄清最终结果，以可直接打开的文件提供完整 `contract.md`，并规划 Git 交付。实现开始前，你只需要审阅并批准这份 Contract。复杂任务可以按需维护 `design.md` 或 `plan.md`，它们不需要单独批准。
2. **Implement**：agent 完成约定修改，但不会把“代码已经写完”当成目标完成。
3. **Verify**：在 Codex 上，新的检查 agent 会复核真实 diff、项目检查和用户可见行为，再由主 agent 记录实际通过或失败的结果。Claude Code 使用同一套独立检查上下文顺序验证。
4. **Finish**：必需结果和 Git 交付没有验证完成时，OpenNori 拒绝结束。稳定项目知识与已完成任务会进入最终干净的 Git 状态。

执行了多少命令、改了多少文件或 agent 有多自信，都不是完成证据。

## 你可以审阅什么

在工作流中，OpenNori 会给你四类有用信息：

- 完整的 `contract.md`，这是唯一需要你批准的任务文档；
- 复杂任务按需产生的 `design.md` 和 `plan.md`，用于阅读技术方案与执行进度；
- 当前阶段、剩余缺口和下一步；
- 每个必需结果的验证结论和经过验证的 Git 交付；
- Finish 生成并留在仓库中的最终 `report.md`。

如果结果边界改变，让 agent 返回 Plan 修订。如果仍有必需结果未证明或 Git 交付缺失，Finish 会继续阻塞。

## 继续或恢复

在之后的对话中说：

```text
Continue the current OpenNori task.
```

直接检查项目健康状态：

```bash
opennori doctor
opennori status
```

安全升级时，先审阅计划再应用：

```bash
opennori update --dry-run
opennori update --confirm
```

Plugin 或 Skill 更新需要开启新的 agent 对话才能生效。

## 技术参考

- [产品参考](docs/product-reference.md)：工作流行为、项目状态、失败处理和操作命令。
- [升级与迁移](docs/migrations.md)：预览、回滚与恢复。
- [公共 API](docs/api.md)：受支持的程序化集成入口。

## 许可证

GPL-3.0-only
