# cli-支持-architecture-baseline-命令入口和-agent-readable-状态 Build-vs-Buy Decision

Area: cli
Need: 支持 Architecture Baseline 命令入口和 agent-readable 状态
Recommendation: self-build

## Summary

当前阶段先沿用现有单文件 CLI 命令分发补齐产品状态对象，避免在架构修复前引入 CLI 框架迁移风险；后续 CLI 架构修复必须重新评估 commander/citty/cac 等成熟库。

## Candidates Checked

- Current project: 当前项目只有 Node ESM、node:test、src/cli.js 手写 argValue/hasFlag，尚未引入 CLI 框架。
- Standard library: Node.js 没有完整子命令框架。
- Official SDK: 无官方 SDK。
- Open source: 可评估 commander、citty、cac；本次不迁移是为了先建立 Architecture Baseline 状态层。

## Self-build Reason

这是 OpenNori 产品域状态命令的短期落盘，不是长期 CLI 架构结论；目标 baseline 已要求后续架构修复前重新做 build-vs-buy。
