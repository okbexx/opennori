# OpenNori

Human-acceptable delivery contracts for coding agents. / 面向 AI 编码代理的人类可接受交付契约层。

---

> **[English](#english)** | **[简体中文](#简体中文)**

---

<a name="english"></a>

# OpenNori (English)

Human-acceptable delivery contracts for coding agents.

[![npm version](https://img.shields.io/npm/v/opennori.svg)](https://www.npmjs.com/package/opennori)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)

OpenNori helps coding agents turn natural-language goals into Nori Contracts:
human-centered acceptance checks, architecture baseline, reviewable evidence,
and completion reports.

OpenNori is not a phase system, plan template, or process archive. The agent can
plan internally, but the user-facing loop stays centered on what the user wants,
what acceptance checks define done, what evidence supports each check, and
whether the goal is complete.

## Install OpenNori Capability Bundle

OpenNori is one agent capability bundle, not three separate products:

- Codex Plugin distributes and discovers the packaged OpenNori Skills.
- OpenNori Skills are agent behavior protocols for natural-language work.
- `opennori` is the deterministic state layer those Skills call.
- `.opennori/` stores project contracts, evidence, profile, architecture, health, and reports.
- `opennori dashboard` is an optional local observation surface over that state.

First-time setup installs the complete bundle with preview and explicit
confirmation:

```bash
npx opennori setup
```

Setup previews the Codex Plugin registration, packaged Skill availability,
global `opennori` CLI installation, current project `.opennori/` initialization,
and final doctor check before it writes anything.

After setup, initialize any project from that project directory:

```bash
opennori init
```

For local OpenNori development from a checkout:

```bash
codex plugin marketplace add .
codex plugin add opennori@opennori
```

After installing the capability bundle, open a new Codex session and say:

```text
Use OpenNori for this goal.
```

For advanced recovery, the setup command is equivalent to previewing and then
confirming the same official Codex and npm actions:

```bash
codex plugin marketplace add okbexx/opennori --ref main
codex plugin add opennori@opennori
npm install -g opennori@latest
```

Direct CLI use is an advanced or automation path, not a separate product path
from the Plugin and Skills.

## Quick Start

If OpenNori is already installed on this machine, run the project initializer:

```bash
opennori init
```

The initializer previews the `.opennori/` state it would create and asks before
writing. Agents and CI can use `--json` for deterministic machine-readable
output.

Then talk to your agent:

```text
Use OpenNori for this goal. Discover the real acceptance criteria first,
confirm the Nori Contract with me, establish an Architecture Baseline for
non-trivial work, and keep working from acceptance gaps until the report can
say whether it is complete.
```

Users do not need to memorize CLI flags or Skill names. The bundled Skills map
natural language to the deterministic `opennori` state layer.

## What It Creates

OpenNori uses one project-local state directory:

```text
.opennori/
  manifest.json
  protocol.md
  agent-guide.md
  active/
    <goal>.acceptance.md
    <goal>.evidence.json
  completed/
  blocked/
  reports/
  brainstorms/
  events/
    events.jsonl
  activity/
    current.json
  snapshots/
    current.json
  architecture/
    baseline.json
    baseline.md
    profiles/
    challenges/
    decisions/
    evidence/
```

It does not create `process/` as the workflow surface, and it does not copy
OpenNori Skills into each user project.

## Local Dashboard

OpenNori can start a local visual dashboard:

```bash
opennori dashboard --root .
```

The dashboard shows agent activity, goal, current gap, user intervention,
architecture decision, and completion decision. When user input is needed, it
shows what to reply in the agent conversation. It does not provide confirm,
reject, waive, or accept buttons, and it does not write Product AC, evidence,
profile, architecture, or report state. It observes `.opennori/` state; it is
not an agent runtime, process log, or replacement for `status` and `report`.

OpenNori Skills may publish live activity while working. Users do not need to
memorize this command; the CLI can infer the unique current goal/gap when the
project is unambiguous, and asks for a goal when multiple active contracts could
be observed:

```bash
opennori activity start --root . --skill nori-evidence --state verifying --summary "Verifying the current gap"
opennori activity finish --root . --skill nori-evidence --summary "Evidence recorded"
```

Activity is not acceptance evidence. Completion still comes from Product AC,
evidence, profile, architecture, and report state.

## Core Concepts

### Nori Contract

A Nori Contract combines:

- the user's natural-language goal
- human-centered acceptance checks
- evidence state
- current acceptance gap
- completion judgment

Acceptance checks should describe user-visible operations and judgments, not
implementation files, modules, tests, Skills, or technology choices. OpenNori
surfaces likely mistakes as review questions for the agent and user; it does
not reject a contract just because a heuristic sees a technical word.

### Acceptance Discovery

Nori should review vague criteria such as "modify fields" or "show an error"
with the user instead of silently treating them as done. Before drafting or
claiming confident completion, OpenNori helps the agent ask the questions that
decide whether the user can accept the result:

- which fields can be changed
- what validation rules apply
- what success feedback the user sees
- how persistence is verified after refresh or return
- what failed-save behavior looks like
- what is intentionally out of scope

### Architecture Baseline

For non-trivial work, Nori should establish an Architecture Baseline before
implementation. The baseline records architecture profile, principles,
boundaries, preferred and avoided choices, build-vs-buy policy, and challenge
rules the agent must follow while completing Product AC.

Architecture Baseline is not a plan. It is sticky implementation guidance: if
project evidence conflicts with it, the agent creates an Architecture Challenge
instead of silently changing the technology stack, state model, dependency
policy, or directory boundary.

Missing, challenged, or stale architecture state is reported as
`architecture_review`: the Product AC can be objectively complete, but OpenNori
will not report confident completion until the agent or user reviews the
architecture risk.

### Evidence Record

Evidence can come from tests, screenshots, URLs, artifacts, logs, human
confirmation, waivers, or other reviewable sources. OpenNori keeps evidence
flexible, but high-risk completion should not rely only on an agent's
self-summary.

Architecture apply records can be attached to evidence as context, so a report
can show that the proof was produced under the confirmed baseline. They do not
prove Product AC by themselves; passing evidence still needs a user-visible
verification source.

### Next Loop Candidates

When a goal is confidently complete, `resume`, `status`, `next`, `report`, and
context export include `agent_next.candidate_goals` for Skill routing, with the
same candidates also shown under `next_recommendation.candidate_goals` for
reporting context. These are small candidate starts for the next Nori Contract:
each candidate names the goal, user value, acceptance directions, risks, and
draft metadata when available.

Candidate goals are not phases, task lists, approved acceptance checks, or
completion evidence. They help the agent continue after the user says
"continue" without making the user invent the next prompt from scratch.
When a candidate becomes a draft, the draft should already say how the user can
measure and judge the next outcome; it still remains unapproved until the user
accepts or revises the Nori Contract.

### Nori Profile

Nori Profile records execution preferences such as required Skills, preferred
stacks, avoided tools, and install policy. These preferences influence
completion risk and blocking status, but they are not user acceptance checks.

Build-vs-buy findings work the same way. They are architecture review risks,
not Product AC. If self-built infrastructure lacks reuse research or a
self-build reason, status/report say `build_vs_buy` review is required before
claiming mature completion.

## Example Uses

### Frontend Feature

User prompt:

```text
Use OpenNori for a settings page where users edit profile details.
```

Nori should flag vague acceptance checks like "modify fields" as
`acceptance_review` findings and ask which fields, validation rules, save
feedback, persistence behavior, failed-save states, and out-of-scope boundaries
matter. The final contract should describe what the user opens, edits, saves,
refhes, and expects to see.

### Skill And Stack Preference

User prompt:

```text
Use design-taste-frontend first, build custom components with Radix UI,
and avoid adding another UI framework.
```

Nori records these as Profile items, not acceptance checks. A violated `must` or
`avoid` item can block completion unless the user waives it. An unknown or
violated `prefer` item becomes `profile_review`: objectively complete work can
still require user or agent review before it is reported as confidently complete.

### Architecture Baseline

User prompt:

```text
Use OpenNori with an agent-native CLI architecture. Prefer mature libraries
before self-building infrastructure.
```

Nori lists available architecture profiles, previews the baseline, and asks the
user to confirm before implementation. Status and report then show Product
decision and Architecture decision separately.

If all Product ACs pass while the Architecture Baseline is missing, challenged,
or build-vs-buy is unhealthy, status/report answer: objectively complete with
review risk, not confidently complete.

### Existing OpenNori Project

User prompt:

```text
This repo already uses OpenNori. Bring it up to date without losing active contracts.
```

OpenNori previews upgrade actions before writing. Active contracts, evidence,
reports, brainstorms, and architecture state are preserved by default. `check`
can flag vague older acceptance checks for user-approved revision, surface
Architecture Baseline health, and warn when completion relies on stale, broad,
or summary-only evidence.

## Useful Commands

Users should start with natural language through an agent. These commands are
the deterministic state layer for agents and automation:

```bash
opennori setup
opennori init
opennori doctor --root .
opennori check --root .
opennori architecture profiles --root . --json
opennori architecture baseline --root . --goal "Ship a user-visible result"
opennori discover --goal "Ship a settings page" --root .
opennori brainstorm --idea "Explore this goal" --root .
opennori draft --goal "Ship a user-visible result" --root .
opennori approve --root . --summary "User approved the acceptance checks."
opennori status --root .
opennori dashboard --root .
opennori evidence add --root . --criterion AC-1 --kind review-result --summary "..." --result passing
opennori evidence prune --root . --criterion AC-1 --reason "Evidence no longer proves the current AC"
opennori report --root .
```

## Product Boundaries

- `setup` is the first-time machine installer for the complete capability
  bundle: Codex Plugin, packaged Skills, global CLI, project state, and doctor.
- `init` prepares or refreshes `.opennori/` state in the current project.
- `install`, `upgrade`, and `uninstall` support preview-first workflows;
  destructive writes require explicit confirmation.
- OpenNori Plugin Skills are package behavior protocols for agents. Install and
  upgrade write project state, not project-local copies of OpenNori Skills.
- In a human terminal, `opennori setup` and `opennori init` are interactive.
  With `--json` or non-interactive stdio they return structured JSON.
- `discover` finds underspecified acceptance gaps before draft, so vague ACs
  become user questions instead of weak contracts.
- `doctor` reports whether project state is `ready`, `needs-action`, or
  `broken`, with recovery actions.
- Nori Profile records required Skills, preferred stacks, avoided tools, and
  install policy without turning those preferences into user AC.
- Architecture Baseline records architecture guidance, build-vs-buy policy, and
  challenge rules without turning architecture checks into Product AC.
- Evidence stays flexible: tests, screenshots, URLs, artifacts, logs, human
  confirmation, waivers, or other reviewable sources can support an acceptance
  check.
- `dashboard` starts a loopback visual observation surface backed by events,
  activity, and snapshots. It does not execute agent work, certify completion,
  or host confirmation controls; user decisions stay in the agent conversation
  and are recorded through OpenNori Skills and CLI.
- `activity` commands publish live agent state for the dashboard. Activity is a
  signal, not evidence. Skills should prefer `agent_next.dashboard_activity`
  command templates when present; otherwise the CLI can infer the unique current
  goal/gap and refuses ambiguous multi-goal activity.
- Architecture apply records may be attached as evidence context, but they do
  not count as Product AC proof without a user-visible verification source.
- Context export can give review tools the current goal, checks, profile,
  Architecture Baseline, evidence, report, and `agent_next` routing state, but
  review tools do not take over the agent loop.
- Complete goals can expose `candidate_goals` for the next acceptance loop; the
  agent still turns the chosen candidate into a new draft Nori Contract before
  completion judgment begins.

## Development

```bash
npm test
npm run check
```

## License

GPL-3.0-only

---

<a name="简体中文"></a>

# OpenNori (简体中文)

面向 AI 编码代理（Coding Agents）的人类可接受交付契约层。

[![npm version](https://img.shields.io/npm/v/opennori.svg)](https://www.npmjs.com/package/opennori)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)

OpenNori 帮助 AI 编码代理将自然语言目标（Goals）转化为 Nori 交付契约（Nori Contracts）：
包括以人类为中心的验收检查项（Acceptance Checks）、架构基线（Architecture Baseline）、可审查的证据链（Reviewable Evidence）以及最终的完成度报告（Completion Reports）。

OpenNori 既不是阶段式流程系统，也不是固化的计划模板，更不是过往过程的归档器。AI 代理可以在内部进行自主规划，但面向人类用户的迭代循环始终紧密围绕四个核心点：用户期望什么、什么样的验收检查算作完成、有什么样的真实证据支持各项检查，以及该目标最终是否确实已完成。

## 安装 OpenNori 能力包

OpenNori 是一个整体的 AI 代理能力包，而非三个相互割裂的产品：

- **Codex 插件**：分发与发现封装好的 OpenNori 技能（Skills）。
- **OpenNori 技能 (Skills)**：AI 代理处理自然语言任务时的行为控制规约。
- **`opennori` 引擎**：这些 Skills 所调用的确定性状态层命令行工具。
- **`.opennori/` 目录**：在项目本地存储交付契约、证据链、运行画像、架构基线、项目体检和完成度报告。
- **`opennori dashboard`**：可选的本地可视化观察面。

首次在机器上安装时，使用以下命令进行一键预览和确认安装：

```bash
npx opennori setup
```

安装程序会首先预览 Codex 插件注册、封装技能就绪情况、全局 `opennori` 命令行工具的安装、当前项目 `.opennori/` 状态目录的初始化，并在写入任何文件之前进行最后的健康诊断（Doctor）。

安装完成后，在任意项目根目录下执行初始化：

```bash
opennori init
```

如果您是在本地拉取了 OpenNori 源码并进行二次开发：

```bash
codex plugin marketplace add .
codex plugin add opennori@opennori
```

安装能力包后，在新开启的 Codex 会话中只需对 AI 代理说：

```text
使用 OpenNori 来完成这个目标。
```

对于高级修复，`setup` 命令行等同于预览并执行以下官方的 Codex 和 npm 动作：

```bash
codex plugin marketplace add okbexx/opennori --ref main
codex plugin add opennori@opennori
npm install -g opennori@latest
```

直接使用 CLI 命令行是高级调试或 CI/CD 自动化的通道，绝非与插件/技能相脱离的独立产品线。

## 快速开始

如果您的机器已经完成了初始化安装，请直接在项目目录下运行初始化命令：

```bash
opennori init
```

初始化工具会预览它即将创建的 `.opennori/` 状态目录，并在实际写入前请求您的确认。AI 代理或 CI 流程可以带上 `--json` 参数以获取确定性的机器可读输出。

接下来，直接对您的开发代理输入：

```text
使用 OpenNori 来处理此目标。请先发现真实的验收标准，与我确认 Nori 契约；对于复杂的任务，请先确立架构基线，并针对验收差距不断迭代，直到最终报告可以明确判定是否已经彻底完成。
```

用户无需死记硬背任何 CLI 命令行参数或 Skill 的具体名字。内置的技能（Skills）会自动将您的自然语言指示翻译为调用确定性 `opennori` 状态层的指令。

## 生成的目录结构

OpenNori 在项目本地使用一个独立的状态目录进行所有信息持久化：

```text
.opennori/
  manifest.json          # 整体状态清单文件
  protocol.md            # Nori 契约协议规约说明
  agent-guide.md         # AI 代理行为指南
  active/                # 当前活跃中的契约目标
    <goal>.acceptance.md # 具体验收标准文件 (Markdown)
    <goal>.evidence.json # 对应验收标准的证据文件 (JSON)
  completed/             # 已完成的验收契约
  blocked/               # 处于阻塞状态的验收契约
  reports/               # 完成度判定的历史报告
  brainstorms/           # 头脑风暴与接力迭代提案
  events/                # dashboard 使用的事件账本
    events.jsonl
  activity/              # 当前 agent 活动信号
    current.json
  snapshots/             # 当前状态投影
    current.json
  architecture/          # 架构控制区
    baseline.json        # 架构基线数据
    baseline.md          # 架构基线人类可读规则 (Markdown)
    profiles/            # 项目技术画像
    challenges/          # 架构偏离挑战记录
    decisions/           # 架构决策记录
    evidence/            # 架构规约的偏离/合规证据
```

它不会在项目中创建如 `process/` 这样繁琐的工作流目录，也不会把 OpenNori 技能的实现源码复制到用户的项目内部。

## 本地 Dashboard

OpenNori 可以启动本地可视化 Dashboard：

```bash
opennori dashboard --root .
```

Dashboard 展示当前 agent 活动、目标、验收缺口、是否需要用户介入、架构判断和完成判断。需要用户介入时，它只提示用户应该回到 agent 对话里回复什么；不提供确认、拒绝、豁免或接受报告按钮，也不写入 Product AC、证据、profile、architecture 或 report 状态。它只是 `.opennori/` 状态上的观察面，不是 agent runtime、过程日志，也不能替代 `status` 和 `report`。

OpenNori Skills 可以在工作时发布实时活动信号。用户不需要记住这条命令；当项目只有唯一当前目标/缺口时，CLI 会自动推断 goal/gap；当多个 active contracts 都可能被观察时，CLI 会要求 agent 明确目标，避免 Dashboard 绑错上下文：

```bash
opennori activity start --root . --skill nori-evidence --state verifying --summary "正在验证当前缺口"
opennori activity finish --root . --skill nori-evidence --summary "证据已记录"
```

活动信号不是验收证据。完成判断仍然只来自 Product AC、证据、Profile、Architecture 和报告状态。

## 核心概念

### Nori 交付契约 (Nori Contract)

一个 Nori 交付契约紧密结合了：

- 用户的自然语言目标
- 以人类为中心的验收检查项（Acceptance Checks）
- 证据链的就绪状态（Evidence State）
- 当前的验收差距缺口（Acceptance Gap）
- 最终的完成度判定结论（Completion Judgment）

验收检查项应当描述“用户可见的操作和判定逻辑”，而非具体的实现文件、代码模块、测试类、AI 技能或特定的底层技术选择。OpenNori 会自动检测容易混淆的描述并将其作为审查问题呈现给代理和用户；它绝不会仅仅因为发现了某些技术词汇而武断地驳回契约。

### 验收条件发现 (Acceptance Discovery)

Nori 倡导对于“修改字段”或“抛出错误提示”等含糊不清的验收指标进行主动的用户审查，而不是默默地将其糊弄为已完成。在起草契约或宣称信心交付之前，OpenNori 会引导 AI 代理主动向用户提出决定项目能否真正被接受的细节问题：

- 哪些字段允许编辑
- 输入数据应遵循什么校验规则
- 成功保存后用户能看到什么反馈
- 页面刷新或重入后，如何验证数据确实持久化了
- 保存失败时，界面的交互表现应当是什么样
- 哪些需求是故意被排除在本次交付范围之外的

### 架构基线 (Architecture Baseline)

对于非平凡（复杂）的技术实现，Nori 要求在动手敲代码前先建立架构基线。基线记录了当前项目的技术画像、设计原则、规范边界、首选及规避的工具技术、自研与复用策略，以及代理在实现产品验收条件（Product AC）时必须严格遵守的质询挑战规则。

架构基线绝不是开发计划，而是具有粘性的约束指南：如果项目实施证据与基线发生冲突，AI 代理必须显式发起一个架构质询（Architecture Challenge），而不是默默地更改技术栈、状态模型、依赖方针或目录结构。

任何缺失、被质询或过期的架构基线状态都会被报告为 `architecture_review`（架构审查）：虽然产品功能本身可能在客观上已经完全写好，但在代理或用户解决架构偏离风险之前，OpenNori 绝不会出具“确信交付”的最终结论。

### 证据记录链 (Evidence Record)

证据可以来自于自动化测试结果、屏幕截图、可访问的 URL、打包生成的产物、运行日志、用户人工确认、授权豁免或其他可追溯的来源。OpenNori 保持证据的弹性灵活性，但面对高风险的交付，绝对不允许仅仅依赖代理的自我文字总结作为通过证据。

### 接力迭代候选任务 (Next Loop Candidates)

当一个目标被确信完成后，CLI 里的 `resume`、`status`、`next`、`report` 等命令和上下文导出数据中都会包含给 Skill 路由用的 `agent_next.candidate_goals`，并在 `next_recommendation.candidate_goals` 中保留同一批候选作为报告解释面。这是自动生成的一组小型后续卡片，为下一个 Nori 契约提供合理的起点：每一个候选提案均明确指出了建议的目标、用户价值、验收方向、偏离风险，以及可用时的 draft 元数据。

接力候选并不是繁重的迭代阶段或必须完成的任务列表。它们的作用是当用户说“继续”时，AI 代理能立刻接力推进，而不需要用户每次都费尽心思去构思全新的 Prompt。

候选转成 draft 后，draft 应该已经说明用户如何操作、复查和判断通过；但在用户 approve 或 revise 之前，它仍然不是已批准的 Nori Contract。

### Nori 项目画像 (Nori Profile)

Nori 画像记录了项目运行的全局偏好，如强制要求的 Skills、倾向的技术栈、规避的依赖包以及环境安装策略。这些偏好会影响交付风险评估和阻塞审查，但它们绝不会被混淆进面向用户的业务验收条件（AC）中。

自研与复用的研判也遵循相同的逻辑。它们属于架构审查风险（Architecture Review Risks），而不是产品业务的 AC。如果自研的基础设施缺乏复用研究或明确的自建理由，状态/报告里会直接声明需要进行 `build_vs_buy` 审查后方可 claimed 最终成熟完成。

## 典型使用示例

### 1. 开发前端页面

用户 Prompt 输入：

```text
使用 OpenNori 来做个人设置页面，用户在此编辑个人档案。
```

Nori 会自动将类似“修改字段”等含糊不清的叙述标记为 `acceptance_review` 缺陷，并引导代理去向用户明确哪些字段可变、校验规则是什么、保存成功反馈、刷新持久化、保存失败响应以及超出范围的边界。最终起草的契约会准确描述用户怎么打开、怎么编辑、怎么保存和刷新、以及应当看到什么。

### 2. 声明技能与技术栈偏好

用户 Prompt 输入：

```text
优先采用 design-taste-frontend 规范，基于 Radix UI 开发自定义组件，且不要引入其他的 UI 框架。
```

Nori 会将这些规则记录在 Profile 画像中，而非验收条件（AC）里。当发生强约束 `must`（必须）或 `avoid`（避免）规则的违背时会直接阻塞流程，除非获得用户显式豁免；而推荐 `prefer`（首选）规则的偏离会被标记为 `profile_review`：此时功能上可能已经客观完成，但仍需要用户或代理进行画像合规审查。

### 3. 确立架构基线

用户 Prompt 输入：

```text
使用 OpenNori 针对代理原生 CLI 架构开展工作。在自研基础设施前，优先使用成熟类库。
```

Nori 会列出可用的架构 Profile，预览基线内容，并请求用户确认。随后，状态和报告中会清晰地将“产品业务 AC”与“架构基线合规”分开并行评估。

如果产品功能 AC 全部通过，但架构基线未确立、存在质询冲突或 `build_vs_buy` 健康状态低下，报告会回答：“客观功能已完成，但存在架构风险”，拒绝输出“确信交付”。

### 4. 迭代已采用 OpenNori 的项目

用户 Prompt 输入：

```text
这个仓库已经在使用 OpenNori 了。请将它升级到最新状态，且不要弄丢我正在活跃的合同。
```

OpenNori 在写入前会进行升级影响预览。活跃中的契约、证据、报告、脑风暴和架构信息默认会被完整保护。`check` 命令会自动发现历史遗留的含糊 AC 并引导修正，监测架构基线的健康度，并在依靠过期/过于宽泛/代理自吹自擂的自我总结做证据时给出明确警告。

## 常用 CLI 命令

虽然用户通常通过 AI 代理在后台默默调用，但这些确定性的状态层命令行工具也是代理集成和流水线自动化的基石：

```bash
opennori setup                                                        # 机器首次一键部署包安装 (含 Plugin, CLI, doctor)
opennori init                                                         # 在当前项目初始化 .opennori/ 状态目录
opennori doctor --root .                                              # 运行环境、插件访问权与契约健康诊断
opennori check --root .                                               # 检查项目活动契约的验收标准健康度
opennori architecture profiles --root . --json                        # 列出当前项目可用的架构模板
opennori architecture baseline --root . --goal "交付某功能"           # 交互式起草并确立架构基线规约
opennori discover --goal "Ship a settings page" --root .              # 审查模糊指标，发现真正的验收条件
opennori brainstorm --idea "探索当前业务目标下的架构偏离" --root .    # 头脑风暴与偏离风险推演
opennori draft --goal "Ship a user-visible result" --root .           # 正式起草一份 Nori 契约文件
opennori approve --root . --summary "用户人工同意了当前验收标准"       # 授权同意进入开发阶段
opennori status --root .                                              # 查看当前活动目标的验收差距与审查状态
opennori dashboard --root .                                           # 启动本地视觉观察面
opennori evidence add --root . --criterion AC-1 --kind review-result --summary "..." --result passing  # 为指定 AC 关联通过证据
opennori evidence prune --root . --criterion AC-1 --reason "证据过期"  # 修剪已经不再适用当前 AC 的证据项
opennori report --root .                                              # 生成项目最终的契约验收交付报告
```

## 产品与设计边界

- `setup` 是首次在机器上部署的完整大礼包：包含 Codex 插件安装、打包 Skills 分发、全局 CLI 工具和 doctor 检查。
- `init` 仅在本地初始化或重构 `.opennori/` 状态文件夹。
- `install`、`upgrade`、`uninstall` 采用预览优先工作流，任何破坏性写入均需人类显式同意。
- 插件技能（Skills）作为代理行为控制规约进行整体打包升级，项目本地仅保存状态，绝不复制 Skills 源码到用户目录。
- 在人机终端下，`setup` 与 `init` 是友好的人机交互；在非交互 stdio 或传入 `--json` 时会自动返回确定性、结构化的 JSON。
- `discover` 在 draft 正式立项前发现模糊验收指标的盲区，将其转化为人机对话问题，杜绝草率的糊弄契约。
- `doctor` 以极简指示标输出当前仓库状态是 `ready`、`needs-action` 还是 `broken`，并给出精准的恢复路线。
- Nori Profile 记录 Skills、工具链、包控制等偏好倾向，与业务验收 AC 彻底解耦。
- Architecture Baseline 确立原则、首选技术、自研政策和质询规范，与业务验收 AC 彻底解耦。
- 证据链保持无限弹性：可以是测试套件、图片证据、外部链接、编译日志或豁免权，但不接受代理空头总结。
- `dashboard` 启动 loopback 本地视觉观察面，读取事件、活动和状态投影。它不执行 agent 工作，不认证完成，也不承载确认控件；用户决策仍然发生在 agent 对话里，再由 OpenNori Skill/CLI 记录。
- `activity` 命令只发布 agent 实时活动信号。活动信号不是证据。Skill 应优先使用 `agent_next.dashboard_activity` 里的命令模板；否则 CLI 可以推断唯一当前 goal/gap，并在多个 active goals 歧义时拒绝误绑定。
- 上下文导出仅为其他审查和报告工具提供当前的契约画像、状态数据和 `agent_next` 路由面，审查工具不可反向干预代理的自治运行。
- 已完成的目标会产出 `candidate_goals` 推荐卡片，但只有当用户决定接力推进，并将其正式转化为新 draft 契约并签署后，完成度判定逻辑才会正式开启。

## 开发

```bash
npm test                                                              # 运行 Vitest 测试套件
npm run check                                                         # 执行代码规范与静态类型诊断
```

## 许可证

GPL-3.0-only
