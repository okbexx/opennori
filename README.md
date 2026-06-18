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
opennori plugin sync --local
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

If only the installed Codex Plugin cache is stale during local development or
recovery, run:

```bash
opennori plugin sync
```

Direct CLI use is an advanced or automation path, not a separate product path
from the Plugin and Skills. In an interactive terminal, common lifecycle and
status commands print short human summaries by default; pass `--json` when an
agent, script, or CI job needs the full deterministic payload.

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

For a rough idea where you want fewer clarification rounds, ask for autogoal:

```text
Use OpenNori autogoal to turn this rough idea into a Nori Contract: ...
```

Autogoal is not a new artifact type. It is a packaged Skill behavior that
reads project context, preserves the full idea, infers reasonable assumptions,
asks only questions that change completion meaning, and writes the same
standard Nori Contract Draft that a manual OpenNori discussion would produce.
It must not shrink broad ideas into MVP, first version, prototype, phase list,
or task list wording.

If you and the agent have already discussed the goal and candidate AC before
starting OpenNori, ask the agent to adopt the discussion:

```text
Use OpenNori to take over the AC we just discussed. Turn it into a Nori Contract Draft.
Do not start implementation; show it to me for confirmation first.
```

This writes the same standard draft Nori Contract under `.opennori/drafts/`.
It preserves the discussed AC, assumptions, and open questions, but it does not
approve the contract, start implementation, or treat conversation notes as
evidence.

Users do not need to memorize CLI flags or Skill names. The bundled Skills map
natural language to the deterministic `opennori` state layer.

OpenNori keeps protocol field names stable in English, but the human-readable
Contract presentation can be English or Simplified Chinese. By default the
Skills infer the Contract language from the user's goal and conversation; when
the user says "write the AC in Chinese" or "keep this contract in English", the
Skill records that preference in the draft so later status, report, and next
candidate surfaces can preserve it.

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

When the dashboard is being watched and a current goal/gap exists, OpenNori
Skills publish live activity while working. Users do not need to memorize this
command; the CLI can infer the unique current goal/gap when the project is
unambiguous. Draft contracts are not observed, setup/init previews do not invent
activity, and multiple current contracts are treated as broken state rather than
a normal dashboard choice:

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
with the user instead of silently treating them as done. This is an agent Skill
responsibility, not a CLI word-list validator. Before drafting or claiming
confident completion, the agent asks the questions that decide whether the user
can accept the result:

- which fields can be changed
- what validation rules apply
- what success feedback the user sees
- how persistence is verified after refresh or return
- what failed-save behavior looks like
- what is intentionally out of scope

The same review applies to broader product surfaces. If a criterion only says
"overall picture", "long-term assets", "project memory", "knowledge
candidates", "capabilities", or "result changes", the OpenNori Skills should
make the agent ask which visible objects, fields, lifecycle states, source
links, recovery paths, and boundaries the user must see. Passing evidence can
still be provisional until those questions are resolved or explicitly accepted
as remaining review risk.

### Contract Language Preference

Contract language is a presentation preference, not a Product AC. OpenNori
stores it as `presentation.language` on brainstorms, discoveries, and Nori
Contracts so generated goals, acceptance checks, discovery questions, and next
loop candidates stay in the language the user expects.

Examples:

```text
Use OpenNori for this goal. Write the acceptance checks in Chinese.
```

```text
用 OpenNori 跑这个目标，验收标准用中文。
```

Existing approved contracts are not silently translated. If the user wants to
change the presentation language of an existing contract, the agent should
revise any visible wording that needs to change, then ask the user to approve
the updated Nori Contract. The CLI only stores the approved presentation
preference; it does not pretend an old contract was translated as a side effect
of `status`, `report`, `check`, or evidence writes.

### Architecture Baseline

For non-trivial work, Nori should establish an Architecture Baseline before
implementation. The baseline has two layers: an Architecture Charter for
product boundaries and agent behavior, and a Technical Architecture Baseline
for runtime topology, source of truth, module/package boundaries, contract
surfaces, data flows, dependency decisions, reference mappings, and
verification.

Architecture Baseline is not a plan. It is sticky implementation guidance: if
project evidence conflicts with it, the agent creates an Architecture Challenge
instead of silently changing the technology stack, state model, dependency
policy, contract surface, module boundary, or directory boundary.

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

### Autogoal From Rough Idea

User prompt:

```text
Use OpenNori autogoal to turn this rough idea into a Nori Contract:
I want this agent tool to help teams understand whether a delivery is truly done.
```

Nori should converge the rough idea into a standard draft Nori Contract, not an
autogoal-specific report. The draft should preserve the full intended user
closure, include user-facing AC with concrete measurement and passing
thresholds, list assumptions, and ask only questions that change the completion
definition. It should not downgrade the idea to an MVP, first version,
prototype, phase list, or task list.

### Frontend Feature

User prompt:

```text
Use OpenNori for a settings page where users edit profile details.
```

Nori should not accept vague checks like "modify fields". The Skill should make
the agent ask which fields, validation rules, save feedback, persistence
behavior, failed-save states, and out-of-scope boundaries matter. The final
contract should describe what the user opens, edits, saves, refreshes, and
expects to see.

### Adopt An Existing AC Discussion

User prompt:

```text
Use OpenNori to take over the AC we just discussed. Turn it into a Nori Contract Draft.
Do not start implementation; show it to me for confirmation first.
```

Nori should preserve the goal, candidate AC, assumptions, and unresolved
questions already discussed in the conversation. It writes a standard draft
Nori Contract with `source: conversation`, asks the user to approve or revise
it, and does not route the material through autogoal, start implementation, or
record passing evidence.

### Product Workbench

User prompt:

```text
Use OpenNori for a project workbench where users inspect project state,
assets, memory, knowledge candidates, capabilities, and agent results.
```

Nori should not accept broad checks like "show the overall situation" or "show
project memory" as confidently complete just because evidence is passing. It
should ask what exact objects, fields, states, source links, recovery actions,
and out-of-scope boundaries the user must see before the workbench can be
accepted.

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
This repo already uses OpenNori. Bring it up to date without losing current, draft, or archived contracts.
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
opennori plugin sync
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
- `plugin sync` refreshes the installed Codex Plugin cache for local
  development or recovery without writing project `.opennori/` state.
- `init` prepares or refreshes `.opennori/` state in the current project.
- `install`, `upgrade`, and `uninstall` support preview-first workflows;
  destructive writes require explicit confirmation.
- OpenNori Plugin Skills are package behavior protocols for agents. Install and
  upgrade write project state, not project-local copies of OpenNori Skills.
- In a human terminal, `opennori setup` and `opennori init` are interactive.
  With `--json` or non-interactive stdio they return structured JSON.
- Lifecycle, health, status, report, dashboard, and plugin sync commands print
  short human summaries in a TTY by default. `--json` preserves the full
  machine-readable state for agents and automation.
- `autogoal` is Skill-driven convergence from a rough idea to a standard Nori
  Contract Draft. The CLI stores the normal draft state, often through
  `opennori draft --brief`; it does not create a separate Autogoal Contract or
  decide subjective AC quality through hard validators.
- Conversation adoption is a `nori-acceptance` behavior for AC discussions that
  already happened. It uses the same draft state path with
  `acceptance_basis.source: "conversation"` and remains draft-only until user
  approval.
- `discover` can create a question source before draft, but AC quality remains
  the agent Skill's responsibility and the user's final decision.
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
  signal, not evidence. When the dashboard is observed and a current goal/gap
  exists, Skills start activity before work, heartbeat only during longer work,
  and finish when the turn ends. Skills prefer `agent_next.dashboard_activity`
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
opennori plugin sync --local
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

如果只是本地开发或恢复时 Codex Plugin 缓存落后，可以只刷新插件缓存：

```bash
opennori plugin sync
```

直接使用 CLI 命令行是高级调试或 CI/CD 自动化的通道，绝非与插件/技能相脱离的独立产品线。在交互式终端里，常见生命周期和状态命令默认输出短摘要；当 agent、脚本或 CI 需要完整确定性状态时，请显式传入 `--json`。

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

如果您只有一个粗略想法，并希望减少来回澄清，可以让代理使用 autogoal：

```text
用 OpenNori autogoal 把这个想法变成可验收的 Nori Contract：……
```

autogoal 不是新的产物类型。它是打包 Skill 的一种收敛行为：读取项目上下文、保留用户完整意图、推断合理假设、只询问会改变完成定义的问题，最后写出的仍然是和手动多轮讨论一致的标准 Nori Contract Draft。它不能把大目标降级成 MVP、第一版、原型、阶段清单或任务列表。

如果您已经和代理讨论过目标和候选 AC，再决定让 OpenNori 接管，请直接告诉代理：

```text
用 OpenNori 接管我们刚才讨论的 AC，整理成 Nori Contract Draft，不要开始实现，先给我确认。
```

这会把已有讨论整理为 `.opennori/drafts/` 下的标准 draft Nori Contract，保留已讨论的 AC、假设和开放问题；但不会批准契约、不会开始实现，也不会把聊天记录当作完成证据。

用户无需死记硬背任何 CLI 命令行参数或 Skill 的具体名字。内置的技能（Skills）会自动将您的自然语言指示翻译为调用确定性 `opennori` 状态层的指令。

OpenNori 的协议字段名保持稳定英文，但人类可读的契约内容可以使用英文或简体中文。默认情况下，Skills 会从用户目标和对话语言中推断契约表达语言；当用户明确说“验收标准用中文”或“keep this contract in English”时，Skill 会把这个偏好记录进 draft，后续 status、report 和候选下一轮目标会沿用它。

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

OpenNori Skills 可以在工作时发布实时活动信号。用户不需要记住这条命令；当项目只有唯一当前目标/缺口时，CLI 会自动推断 goal/gap。draft contract 不会被观察；如果出现多个 current contract，这是需要 doctor 恢复的损坏状态，不是正常选择题：

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

### 契约语言偏好 (Contract Language Preference)

契约语言是表达偏好，不是 Product AC。OpenNori 会在 brainstorm、discovery 和 Nori Contract 上保存 `presentation.language`，让生成的 goal、验收标准、发现问题和下一轮候选目标保持用户期望的语言。

示例：

```text
用 OpenNori 跑这个目标，验收标准用中文。
```

```text
Use OpenNori for this goal. Write the acceptance checks in Chinese.
```

已经批准的契约不会被静默翻译。如果用户希望改变现有契约的表达语言，agent 应显式修订需要改变的可见文案，并重新请求用户批准更新后的 Nori Contract。CLI 只保存经过批准的表达偏好；不会在 `status`、`report`、`check` 或证据写入时假装旧契约已经被自动翻译。

### 架构基线 (Architecture Baseline)

对于非平凡（复杂）的技术实现，Nori 要求在动手敲代码前先建立架构基线。基线记录了当前项目的技术画像、设计原则、规范边界、首选及规避的工具技术、自研与复用策略，以及代理在实现产品验收条件（Product AC）时必须严格遵守的质询挑战规则。

架构基线分两层：Architecture Charter 约束产品边界和 agent 行为；Technical Architecture Baseline 约束运行拓扑、真相源、模块/包边界、CLI/MCP/API/IPC 契约面、数据流、依赖决策、参考项目映射和验证方式。只有原则、偏好或治理约束的 baseline 不足以指导非平凡实现。

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

### 1. 从粗略想法自动收敛契约

用户 Prompt 输入：

```text
用 OpenNori autogoal 把这个想法变成可验收的 Nori Contract：我希望这个 agent 工具帮助团队判断一次交付是否真的完成。
```

Nori 会先自行读取项目上下文并补齐真实验收闭环，然后输出标准 Nori Contract Draft，而不是 autogoal 专用报告。该 draft 会保留完整目标意图，写出用户视角 AC、衡量方式、通过条件、假设和真正影响完成定义的开放问题；它不能把目标降级成 MVP、第一版、原型、阶段清单或任务列表。

### 2. 接管已经讨论过的 AC

用户 Prompt 输入：

```text
用 OpenNori 接管我们刚才讨论的 AC，整理成 Nori Contract Draft，不要开始实现，先给我确认。
```

Nori 会保留对话里已经讨论过的目标、候选 AC、假设和未决问题，将它们整理为 `source: conversation` 的标准 draft Nori Contract，并要求用户 approve 或 revise。它不会把这段材料重新送进 autogoal，不会直接进入实现，也不会把讨论记录当作 passing evidence。

### 3. 开发前端页面

用户 Prompt 输入：

```text
使用 OpenNori 来做个人设置页面，用户在此编辑个人档案。
```

Nori 不应该接受类似“修改字段”等含糊不清的叙述。OpenNori Skill 会要求 agent 先向用户明确哪些字段可变、校验规则是什么、保存成功反馈、刷新持久化、保存失败响应以及超出范围的边界。最终起草的契约会准确描述用户怎么打开、怎么编辑、怎么保存和刷新、以及应当看到什么。

### 4. 开发项目工作台

用户 Prompt 输入：

```text
使用 OpenNori 来做项目工作台，用户要查看项目状态、资产、记忆、知识候选、能力和 agent 操作结果。
```

Nori 不应该因为证据显示 passing，就把“整体情况”“长期资产”“项目记忆”“知识候选”“能力”“结果变化”等抽象 AC 当成可信完成。OpenNori Skill 必须让 agent 追问用户必须看到哪些具体对象、字段、状态、来源链接、失败恢复方式和范围边界；这不是 CLI 词表能替用户决定的事情。

### 5. 声明技能与技术栈偏好

用户 Prompt 输入：

```text
优先采用 design-taste-frontend 规范，基于 Radix UI 开发自定义组件，且不要引入其他的 UI 框架。
```

Nori 会将这些规则记录在 Profile 画像中，而非验收条件（AC）里。当发生强约束 `must`（必须）或 `avoid`（避免）规则的违背时会直接阻塞流程，除非获得用户显式豁免；而推荐 `prefer`（首选）规则的偏离会被标记为 `profile_review`：此时功能上可能已经客观完成，但仍需要用户或代理进行画像合规审查。

### 6. 确立架构基线

用户 Prompt 输入：

```text
使用 OpenNori 针对代理原生 CLI 架构开展工作。在自研基础设施前，优先使用成熟类库。
```

Nori 会列出可用的架构 Profile，预览基线内容，并请求用户确认。随后，状态和报告中会清晰地将“产品业务 AC”与“架构基线合规”分开并行评估。

如果产品功能 AC 全部通过，但架构基线未确立、存在质询冲突或 `build_vs_buy` 健康状态低下，报告会回答：“客观功能已完成，但存在架构风险”，拒绝输出“确信交付”。

### 7. 迭代已采用 OpenNori 的项目

用户 Prompt 输入：

```text
这个仓库已经在使用 OpenNori 了。请将它升级到最新状态，且不要弄丢我正在活跃的合同。
```

OpenNori 在写入前会进行升级影响预览。活跃中的契约、证据、报告、脑风暴和架构信息默认会被完整保护。`check` 命令只检查契约结构、架构基线、Profile 和证据健康这类客观状态；历史遗留的含糊 AC 由 OpenNori Skills 引导 agent 与用户复核，而不是交给 CLI 词表裁决。`check` 也会在依靠过期/过于宽泛/代理自吹自擂的自我总结做证据时给出明确警告。

## 常用 CLI 命令

虽然用户通常通过 AI 代理在后台默默调用，但这些确定性的状态层命令行工具也是代理集成和流水线自动化的基石：

```bash
opennori setup                                                        # 机器首次一键部署包安装 (含 Plugin, CLI, doctor)
opennori plugin sync                                                   # 本地开发/恢复时刷新 Codex Plugin 缓存
opennori init                                                         # 在当前项目初始化 .opennori/ 状态目录
opennori doctor --root .                                              # 运行环境、插件访问权与契约健康诊断
opennori check --root .                                               # 检查活动契约结构、架构、Profile 与证据健康
opennori architecture profiles --root . --json                        # 列出当前项目可用的架构模板
opennori architecture baseline --root . --goal "交付某功能"           # 交互式起草并确立架构基线规约
opennori discover --goal "Ship a settings page" --root .              # 生成可供 agent 参考的验收问题来源
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
- `plugin sync` 只刷新已安装的 Codex Plugin 缓存，用于本地开发或恢复，不写入项目 `.opennori/` 状态。
- `init` 仅在本地初始化或重构 `.opennori/` 状态文件夹。
- `install`、`upgrade`、`uninstall` 采用预览优先工作流，任何破坏性写入均需人类显式同意。
- 插件技能（Skills）作为代理行为控制规约进行整体打包升级，项目本地仅保存状态，绝不复制 Skills 源码到用户目录。
- 在人机终端下，`setup` 与 `init` 是友好的人机交互；在非交互 stdio 或传入 `--json` 时会自动返回确定性、结构化的 JSON。
- 生命周期、健康诊断、状态、报告、dashboard 和插件同步命令在 TTY 下默认显示短摘要；`--json` 保留完整机器可读 payload。
- `autogoal` 是从粗略想法收敛到标准 Nori Contract Draft 的 Skill 行为。CLI 只保存普通 draft 状态，常见路径是 `opennori draft --brief`；它不会创建单独的 Autogoal Contract，也不会用硬编码 validator 替用户判断主观 AC 质量。
- 已讨论 AC 接管属于 `nori-acceptance` 行为：当对话里已经存在目标、候选 AC、假设和开放问题时，Skill 用同一条 draft 状态路径保存 `acceptance_basis.source: "conversation"`，并在用户 approve 前保持 draft-only。
- `discover` 在 draft 正式立项前生成问题来源；问题是否足够、该问哪些追问，由 OpenNori Skill 结合用户目标和项目上下文判断。
- `doctor` 以极简指示标输出当前仓库状态是 `ready`、`needs-action` 还是 `broken`，并给出精准的恢复路线。
- Nori Profile 记录 Skills、工具链、包控制等偏好倾向，与业务验收 AC 彻底解耦。
- Architecture Baseline 确立原则、首选技术、自研政策和质询规范，与业务验收 AC 彻底解耦。
- 证据链保持无限弹性：可以是测试套件、图片证据、外部链接、编译日志或豁免权，但不接受代理空头总结。
- `dashboard` 启动 loopback 本地视觉观察面，读取事件、活动和状态投影。它不执行 agent 工作，不认证完成，也不承载确认控件；用户决策仍然发生在 agent 对话里，再由 OpenNori Skill/CLI 记录。
- `activity` 命令只发布 agent 实时活动信号。活动信号不是证据。dashboard 被观察且存在 current goal/gap 时，Skill 在开始处理当前缺口前发布 start，长时间工作才 heartbeat，本轮结束发布 finish。Skill 优先使用 `agent_next.dashboard_activity` 里的命令模板；否则 CLI 可以推断唯一当前 goal/gap；无 current 时不绑定 draft 或 setup/init preview，多个 current 时拒绝误绑定并交给 doctor 恢复。
- 上下文导出仅为其他审查和报告工具提供当前的契约画像、状态数据和 `agent_next` 路由面，审查工具不可反向干预代理的自治运行。
- 已完成的目标会产出 `candidate_goals` 推荐卡片，但只有当用户决定接力推进，并将其正式转化为新 draft 契约并签署后，完成度判定逻辑才会正式开启。

## 开发

```bash
npm test                                                              # 运行 Vitest 测试套件
npm run check                                                         # 执行代码规范与静态类型诊断
```

## 许可证

GPL-3.0-only
