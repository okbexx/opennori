# OpenNori Architecture Baseline

Status: active
Profile: typescript-agent-state-cli
Sticky: yes
Requires challenge to change: yes

## Goal

让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。

## Summary

Use strict TypeScript, a citty command layer, public JSON Schema with Ajv validation, tsc builds without bundling, Vitest and Biome quality gates, manifest-managed lifecycle actions, directory-based Skills, and build-vs-buy checks before custom infrastructure.

## Principles

- strict-typescript-source
- citty-command-layer
- thin-cli-entry
- domain-first-modules
- json-schema-public-protocol
- ajv-runtime-validation
- tsc-build-no-bundle-by-default
- vitest-and-biome-quality-gates
- plugin-packaged-skills
- manifest-managed-install-upgrade-uninstall
- skill-driven-natural-language-usage
- generic-context-export-for-external-review
- build-vs-buy-before-custom-infrastructure

## Technical Architecture Baseline

This section is the concrete implementation baseline. It is not Product AC and not an implementation task list.

### Runtime Topology

- agent-skill-layer: Codex loads package-provided OpenNori Skills from the Codex Plugin and uses them to translate natural language into deterministic CLI state operations. Reason: Skills hold subjective product and architecture judgment; the CLI must not become a hard-coded product-quality oracle.
- cli-state-layer: The opennori CLI is the deterministic state boundary for contracts, evidence, profile, architecture, lifecycle, report, and dashboard snapshot operations. Reason: The CLI gives agents stable JSON and gives humans short TTY summaries without requiring users to remember internal flags.
- project-state-layer: .opennori is the project-local source for Nori Contracts, evidence ledgers, profiles, architecture baselines, reports, events, activity, and snapshots. Reason: Project state must travel with the project and remain inspectable outside the chat session.
- dashboard-observation-layer: The dashboard kernel only reads state, events, activity, and snapshots and streams observation data to the local dashboard. Reason: The dashboard must not become an agent runtime, confirmation surface, or Product AC evidence source.
- mcp-context-layer: The MCP server exposes read-only context, snapshot, and doctor resources over stdio by reusing existing CLI/core/lifecycle projections. Reason: MCP helps agent clients inspect OpenNori state without adding a second write path or replacing Skills and CLI.

### Source Of Truth

- json-contract-state: Structured JSON files under .opennori are authoritative for protocol state; Markdown is generated review surface or human-readable supplement. Reason: Agents and tools need deterministic state while users need readable reports.
- schema-validation-boundary: Public JSON Schema plus Ajv validate objective protocol shape; subjective quality remains a Skill and user-review responsibility. Reason: Architecture and AC quality are contextual judgments and must not become brittle word-list validators.
- generated-projections: .opennori/events, activity, snapshots, reports, and baseline markdown are projections or review surfaces unless explicitly documented as authoritative state. Reason: Projection files must not replace contract, evidence, profile, or architecture JSON.

### Module Boundaries

- src/cli: Owns citty command definitions, argument normalization, human-vs-json output routing, and command composition only. Reason: CLI modules should stay thin and delegate OpenNori semantics to domain modules.
- src/core: Owns contracts, evidence ledgers, profiles, reports, recommendation state, and shared project-state helpers. Reason: Acceptance-loop semantics must remain reusable across CLI, reports, and dashboard projections.
- src/architecture: Owns architecture profiles, baselines, build-vs-buy decisions, challenges, apply records, agent surfaces, and architecture report sections. Reason: Architecture guidance is separate from Product AC but participates in completion confidence.
- src/lifecycle: Owns setup, init, install, upgrade, uninstall, manifest, doctor, managed-file plans, profile checks, context export, and plugin sync. Reason: Installation and recovery safety need dry-run, confirm, ownership, and recovery boundaries.
- src/kernel-and-dashboard: Kernel modules own event/activity/snapshot projections and dashboard transport; dashboard frontend owns visual observation only. Reason: Live observation must not be confused with workflow authority or evidence.
- src/mcp: MCP modules own read-only server/resource registration and resource payload projection only. Reason: MCP must be an integration surface over existing OpenNori state, not an independent runtime, persistence layer, or approval tool.
- plugins/opennori/skills: Packaged Skills own agent behavior protocols, natural-language routing, subjective AC/evidence/architecture judgment, and misuse guards. Reason: OpenNori is Skill-driven; users should not learn CLI internals.

### Contract Surfaces

- cli-json: Every agent-facing command keeps stable JSON with ok/data/artifacts/warnings/next_actions and agent_next where routing matters. Reason: Skills need deterministic state and next-step routing.
- human-tty: TTY commands without --json use concise human summaries for lifecycle, status, report, dashboard, and plugin sync flows. Reason: Human users should not receive large JSON blobs for normal operations.
- schemas: Protocol objects that are persisted or exchanged across commands have JSON Schema coverage. Reason: Schema coverage protects objective compatibility without judging product quality.
- plugin-skill-assets: Codex Plugin metadata points to directory-based Skills; lifecycle commands do not copy OpenNori Skills into user projects. Reason: Plugin-first distribution keeps OpenNori as one capability bundle.
- mcp-readonly-resources: MCP exposes opennori://project/context, opennori://project/snapshot, and opennori://project/doctor as read-only JSON resources. Reason: Agent clients can inspect goal, AC, evidence, profile, architecture, dashboard projection, and recovery state without gaining write authority.

### Data Flows

- natural-language-to-contract:
  1. User states a goal in natural language.
  2. Codex loads OpenNori Skills through Plugin discovery.
  3. Skill asks only completion-changing questions and calls draft/approve commands.
  4. CLI writes a standard draft or current Nori Contract under .opennori.
  5. User approves or revises before implementation.
- architecture-before-implementation:
  1. Agent reads current goal, Product AC, Project Profile, project evidence, and references.
  2. Skill selects or creates an Architecture Profile with product charter and concrete technical baseline.
  3. CLI previews a baseline without side effects.
  4. User confirms or revises the baseline.
  5. CLI writes baseline JSON/Markdown and agent-readable route surfaces.
- gap-to-evidence:
  1. Agent reads current gap and confirmed architecture baseline.
  2. Agent records architecture apply context when architecture matters.
  3. Agent implements only the current Product AC gap.
  4. Agent records reviewable Product AC evidence with sources, basis, confidence, and limitations.
  5. Status/report compute completion and review risks.
- dashboard-observation:
  1. CLI and Skills publish activity/events/snapshots as observation signals.
  2. Kernel reads .opennori state and streams snapshots/events.
  3. Dashboard renders current goal, gap, agent activity, architecture decision, and completion decision.
  4. Any user decision is routed back to the agent conversation and recorded through CLI state commands.
- mcp-readonly-context:
  1. An MCP client starts opennori mcp over stdio for a project root.
  2. The MCP server registers read-only resources using the official Model Context Protocol SDK.
  3. Resource handlers call existing context export, snapshot build, and doctor functions.
  4. The client receives context and recovery state but cannot approve AC, record evidence, confirm architecture, or write .opennori state through MCP.

### Dependency Decisions

- TypeScript: Use strict TypeScript source and tsc-emitted JavaScript for the published npm runtime. Reason: Types keep protocol and CLI boundaries coherent while npm users run plain JavaScript output.
- citty: Use citty for the command tree and command modules. Reason: Nested CLI growth should not be handled by handwritten argument parsing.
- Ajv-and-JSON-Schema: Use JSON Schema as public protocol documentation and Ajv for runtime validation. Reason: The protocol is inspectable by users and agents, and objective validation stays separate from subjective review.
- Vitest: Use Vitest for CLI, domain, lifecycle, and dashboard-kernel behavior tests. Reason: Tests should cover objective state behavior without encoding subjective AC quality.
- Hono-dashboard-kernel: Use Hono and @hono/node-server for local dashboard routing and SSE transport. Reason: Routing and streaming are solved infrastructure; OpenNori should own domain projections, not HTTP glue.
- React-dashboard: Use React, Vite, Tailwind, Radix primitives, Motion, and lucide-react for the dashboard UI. Reason: The dashboard needs responsive live visual state, accessible primitives, animation, and icons without becoming a control plane.
- Model-Context-Protocol-SDK: Use @modelcontextprotocol/sdk for the MCP stdio server and resource registration. Reason: MCP framing, capability negotiation, and transport behavior are protocol infrastructure that should not be hand-written.

### Reference Mappings

- OpenAI Codex Skills: Map directory-based Skills and Plugin discovery into plugins/opennori/skills and .codex-plugin metadata. Reason: OpenNori must be agent-discoverable without project-local Skill copies.
- vibecode-pro-max-kit: Reuse the Skill directory and managed install insight, reject process/phase workflow as OpenNori mainline. Reason: OpenNori is acceptance-centered, not phase-centered.
- ECC: Map profiles/components/manifest/doctor thinking into Project Profile, lifecycle manifest, doctor, and Architecture Profile review. Reason: Productized recovery and capability checks matter, but they must serve the acceptance loop.
- CLI-Anything: Map agent-native tool wrapping into stable CLI JSON, Skill guidance, and context export. Reason: Agents need deterministic command contracts rather than prose-only instructions.
- CodeGraph/GitNexus: Borrow context/status/search/doctor discipline, not a full symbol graph platform. Reason: OpenNori needs completion context and evidence health without becoming code intelligence infrastructure.
- Model Context Protocol TypeScript SDK: Reuse the official MCP TypeScript SDK for read-only agent/client interoperability. Reason: OpenNori should own acceptance state semantics while delegating MCP server and transport infrastructure.

### Verification

- npm run check
- node ./bin/opennori.js check --root . --json
- node ./bin/opennori.js status --root . --json
- git diff --check

## Architecture Checks

- ARCH-1 (maintainer): CLI command definitions are thin citty command modules that delegate product decisions to domain modules.
- ARCH-2 (maintainer): Persisted OpenNori state has public JSON Schema and Ajv runtime validation; OpenNori semantic rules stay separate from structural schema validation.
- ARCH-3 (maintainer): OpenNori Skill content lives in plugin-packaged plugins/opennori/skills/*/SKILL.md with optional references/scripts/assets/openai metadata, not as hard-coded JS strings or project-local copies.
- ARCH-4 (maintainer): Install, upgrade, uninstall, managed files, and doctor recovery are lifecycle concerns with deterministic plans, dry-run preview, and explicit confirmation boundaries.
- ARCH-5 (agent): Before custom infrastructure work, check current project dependencies, standard libraries, official SDKs, mature open-source libraries, and documented reference projects.
- ARCH-6 (agent): Do not replace this baseline silently. Raise an Architecture Challenge when project evidence conflicts with it.

## Build-vs-Buy Policy

1. current-project-dependency
2. standard-library
3. official-sdk
4. mature-open-source-library
5. small-local-implementation

## Prefer

- language: Use TypeScript strict mode for source modules and keep generated JavaScript as npm runtime output.
- cli: Use citty for command definitions; keep commander as a fallback only if packaging, nested command, or compatibility evidence blocks citty.
- interactive: Use @clack/prompts for minimal project-aware quickstart prompts; keep all state commands JSON-capable.
- build: Use tsc emit without bundling by default; add tsdown or tsup only when a real packaging need appears.
- schema: Use public JSON Schema files as protocol truth and Ajv for runtime validation.
- markdown-frontmatter: Use yaml for frontmatter when needed; keep JSON authoritative and avoid micromark/unified unless Markdown import requires it.
- test: Use Vitest plus tsc --noEmit; CLI integration tests should spawn the real bin against temporary projects.
- quality: Use Biome for lint and format; agents must not weaken quality config to pass checks.
- skills: Ship directory-based Skills as Codex Plugin package assets; project lifecycle commands manage .opennori state, not project-local Skill copies.

## Avoid

- process/ as OpenNori's workflow mainline
- phase/task-list state as product completion state
- agent self-summary as the only high-risk completion evidence
- Markdown as authoritative protocol state when JSON state exists
- hard-coded Skill bodies in JS strings
- silent architecture replacement
- custom infrastructure without build-vs-buy evidence
- bundler-first builds before tsc emit proves insufficient
- external review tools as OpenNori's control plane

## Agent Rule

Before implementing a non-trivial acceptance gap, read this baseline and keep the implementation aligned with it.
If project evidence conflicts with this baseline, create an Architecture Challenge instead of silently replacing it.
