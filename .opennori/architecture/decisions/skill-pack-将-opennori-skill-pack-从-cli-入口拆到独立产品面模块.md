# skill-pack-将-opennori-skill-pack-从-cli-入口拆到独立产品面模块 Build-vs-Buy Decision

Area: skill-pack
Need: 将 OpenNori Skill Pack 从 CLI 入口拆到独立产品面模块
Recommendation: self-build

## Summary

Skill Pack 是 OpenNori 自有产品文案和 agent 路由面，不需要新增运行时依赖；拆成 src/skills.js 可以让 CLI 更 thin，同时保留纯字符串定义和生成函数。

## Candidates Checked

- Current project: 当前 package.json 无运行时依赖；src/cli.js 内已有 SKILL_PACK、skillMarkdown、skillPackMarkdowns，可直接模块化复用。
- Standard library: Node.js ESM import/export 足够；不需要文件系统或解析库参与 Skill 定义。
- Official SDK: 无官方 SDK 适用；Codex Skill 格式是本地 Markdown/frontmatter 约定。
- Open source: 参考 TK 中 ECC/vibecode/Understand-Anything 的 Skill-as-product-surface 和 manifest-managed asset 思路；没有必要为静态 Skill 文案引入模板库。

## Self-build Reason

这是 OpenNori 产品领域内容，不是通用基础设施；小型本地模块比新增依赖更低风险。
