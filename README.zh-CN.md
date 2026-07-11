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

在项目中开启新的 Codex 对话，然后说：

```text
Use OpenNori for this goal: <goal>
```

这就是正常用户路径。你继续用自然语言描述产品结果，OpenNori 负责引导 agent，并阻止没有依据的完成声明。

Claude Code 是可选的第二宿主：

```bash
npx opennori setup --platform claude
opennori init --user <name> --platform claude
```

随后开启新的 Claude Code 对话，使用同一条目标提示。

## 四阶段工作流

每个目标都经过四个阶段：

1. **Plan**：agent 阅读项目、澄清最终结果、提出可审阅的结果清单，并规划 Git 交付。实现开始前，由你批准结果边界。
2. **Implement**：agent 完成约定修改，但不会把“代码已经写完”当成目标完成。
3. **Verify**：agent 独立检查真实 diff、项目检查和用户可见行为，并记录实际通过或失败的结果。
4. **Finish**：必需结果和 Git 交付没有验证完成时，OpenNori 拒绝结束。稳定项目知识与已完成任务会进入最终干净的 Git 状态。

执行了多少命令、改了多少文件或 agent 有多自信，都不是完成证据。

## 你可以审阅什么

在工作流中，OpenNori 会给你四类有用信息：

- 实现前提出的结果边界；
- 当前阶段、剩余缺口和下一步；
- 每个必需结果的验证结论和经过验证的 Git 交付；
- 留在仓库中的最终人类可读报告。

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
