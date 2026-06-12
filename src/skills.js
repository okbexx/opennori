export const SKILL_PACK = [
  {
    name: "nori",
    description: "Route OpenNori work through user-centered acceptance criteria, evidence, project health, and reporting Skills.",
    body: [
      "## When to use",
      "Use when the user mentions OpenNori, asks to use OpenNori for a task, continue OpenNori, check completion, inspect project health, define acceptance criteria, record evidence, manage capability preferences, or produce an OpenNori report.",
      "",
      "## Route",
      "- Goal, acceptance discovery, brainstorm, approval, or AC revision -> use `nori-acceptance`.",
      "- Verification, evidence sufficiency, human confirmation, waiver, or why an AC is passing -> use `nori-evidence`.",
      "- Required Skills, preferred stacks, avoided tools, or install policy -> use `nori-capability-profile`.",
      "- Architecture baseline, architecture profile selection, applying baseline before implementation, architecture challenge, or build-vs-buy -> use `nori-architecture-brainstorm`, `nori-architecture-apply`, `nori-architecture-challenge`, or `nori-build-vs-buy`.",
      "- Install, uninstall, doctor, manifest, Skill sync, or project recoverability -> use `nori-project-health`.",
      "- Status, report, current gap, completion answer, user intervention, or change summary -> use `nori-reporting`.",
      "",
      "## Baseline",
      "At the start of each OpenNori turn, run `opennori bootstrap --root <repo> --json` if project readiness is unknown; otherwise run `opennori resume --root <repo> --json` or `opennori status --root <repo> --json`.",
      "If bootstrap returns `needs_confirm`, show the preview briefly and ask the user before rerunning with `--confirm`.",
      "For non-trivial goals, make sure an Architecture Baseline exists before implementation. Use `nori-architecture-brainstorm` to establish it and `nori-architecture-apply` before each implementation loop.",
      "Use `next_recommendation` and top-level `next_actions` to continue the OpenNori loop; do not make the user repeatedly ask what the next step is.",
      "If `opennori` is not on PATH, use the installed package binary such as `node ./node_modules/opennori/bin/opennori.js` or this repository's `node ./bin/opennori.js` with the same arguments.",
      "",
      "## Rule",
      "Progress is determined by acceptance evidence, not implementation steps.",
      "Architecture Baseline is sticky after user confirmation. Challenge it with evidence; do not silently replace it.",
      "Do not make the user remember CLI syntax or internal Skill names.",
      "Do not answer confidently complete while the acceptance basis is draft, required AC/profile evidence is missing, `architecture_check` has warnings, or `evidence_health` needs review."
    ]
  },
  {
    name: "nori-acceptance",
    description: "Create, review, approve, and revise OpenNori human-centered acceptance criteria from natural language goals.",
    body: [
      "## When to use",
      "Use when the user gives a goal, wants to discover real acceptance criteria, wants to brainstorm acceptance directions, approves criteria, revises completion criteria, or says the AC is wrong.",
      "",
      "## Commands",
      "- Before drafting from a fuzzy goal: `opennori discover --goal \"<goal>\" --root <repo> --json`.",
      "- Fuzzy idea or discussion: `opennori brainstorm --idea \"<idea>\" --root <repo> --json`.",
      "- Start from a goal: `opennori draft --goal \"<goal>\" --root <repo> --json`.",
      "- Start from a chosen brainstorm candidate: `opennori draft --from-brainstorm <brainstorm-id> --candidate <A|B|C> --root <repo> --json`.",
      "- User approves criteria: `opennori approve --root <repo> --summary \"<approval>\" --json`.",
      "- User revises a criterion: `opennori criterion update --root <repo> --criterion <id> --user-story ... --measurement ... --threshold ... --json`.",
      "",
      "## Rules",
      "Run discovery before draft when the goal or candidate AC contains vague verbs such as modify, save, support, show an error, or improve.",
      "Discovery gaps are questions for the user, not implementation tasks and not completion evidence.",
      "Do not draft generic ACs like 'modify fields' or 'show failure prompt' until field scope, validation rules, success signal, persistence scope, failure cases, and out-of-scope boundaries are clear enough for the user to judge.",
      "ACs must describe user actions or judgments, not implementation files, commands, modules, fields, tests, Skills, or technology choices.",
      "Capability preferences belong in the Nori Profile, not user ACs.",
      "Do not treat brainstorm output as a Nori Contract or completion evidence."
    ]
  },
  {
    name: "nori-evidence",
    description: "Record and judge OpenNori evidence while preserving agent freedom to choose verification methods.",
    body: [
      "## When to use",
      "Use when the user asks to record validation as evidence, asks why an AC is passing, asks whether evidence is enough, confirms or waives an AC, or wants a verification attached to OpenNori.",
      "",
      "## Evidence Protocol",
      "The agent may choose any useful verification method: tests, diff, screenshots, browser checks, logs, artifacts, URLs, AW doctor, human confirmation, or another reviewable signal.",
      "When submitting evidence, explain basis, sources, reviewability, confidence, and limitations.",
      "",
      "## Command",
      "`opennori evidence add --root <repo> --criterion <id> --kind <kind> --summary \"...\" --result <passing|failing|blocked|waived> --basis <basis> --source '<json-or-label>' --source-command '<command>' --source-path '<path>' --source-url '<url>' --reviewability \"...\" --limitations \"...\" --json`",
      "",
      "Use multiple source flags when one AC is supported by several signals; prefer typed `--source-command`, `--source-path`, or `--source-url` when they fit, and use raw `--source` for anything else.",
      "For high-risk passing evidence, use a strong evidence kind or explicit strong confidence only when justified.",
      "Do not force evidence into a fixed adapter taxonomy."
    ]
  },
  {
    name: "nori-capability-profile",
    description: "Record and report OpenNori execution preferences such as required Skills, preferred stacks, avoided tools, and install policy.",
    body: [
      "## When to use",
      "Use when the user says a task must use a Skill, prefers a technology stack, wants to avoid a tool/library, or requires asking before installs.",
      "",
      "## Commands",
      "- Add preference: `opennori profile add --root <repo> --type <skill|stack|constraint> --name \"<name>\" --strength <must|prefer|avoid> --purpose \"<why>\" --install-policy <existing_only|ask_before_install|allowed> --json`.",
      "- Add compliance evidence: `opennori profile evidence --root <repo> --item <item-id> --result <satisfied|violated|waived> --summary \"<evidence>\" --json`.",
      "- Show profile: `opennori profile show --root <repo> --json`.",
      "",
      "## Rules",
      "Do not turn Skills or stack preferences into user ACs.",
      "`must` and violated `avoid` items block completion unless satisfied or waived.",
      "`prefer` should be reported but should not block completion by itself."
    ]
  },
  {
    name: "nori-architecture-brainstorm",
    description: "Create and confirm an OpenNori Architecture Baseline before non-trivial implementation.",
    body: [
      "## When to use",
      "Use when the user starts a non-trivial OpenNori goal, asks to use a good architecture, asks to choose a technical architecture, wants built-in architecture profiles, or wants agent work to follow a confirmed architecture.",
      "",
      "## Commands",
      "- List profiles: `opennori architecture profiles --root <repo> --json`.",
      "- Add a project profile from a reviewed JSON file: `opennori architecture profile --root <repo> --from <profile.json> --json`.",
      "- Preview a baseline: `opennori architecture baseline --root <repo> --goal \"<goal>\" --profile <profile-id> --json`.",
      "- Confirm a baseline after user acceptance: `opennori architecture baseline --root <repo> --goal \"<goal>\" --goal-id <goal-id> --profile <profile-id> --confirm --json`.",
      "- Show current baseline: `opennori architecture show --root <repo> --json`.",
      "",
      "## Rules",
      "Architecture Baseline answers what architecture should guide the work. It is not a plan, phase list, task list, or implementation step sequence.",
      "Use the user's goal, existing project structure, Nori Profile preferences, OpenNori built-in profiles, and relevant reference projects to recommend a baseline.",
      "Treat `architecture profiles --json` as a review surface: show the user the profile's suitable use cases, sources, principles, checks, preferred libraries, avoid boundaries, and build-vs-buy policy before asking for confirmation.",
      "When the user has a preferred architecture, save it as a project Architecture Profile first, then preview a baseline from that profile.",
      "For OpenNori-like agent CLI products, prefer `agent-native-cli` unless project evidence clearly points elsewhere.",
      "Do not treat architecture choices as Product AC. Product AC remains human end-user acceptance; Architecture Checks are maintainer/agent-facing quality gates.",
      "Ask the user to confirm the baseline before implementation starts."
    ]
  },
  {
    name: "nori-architecture-apply",
    description: "Apply the confirmed OpenNori Architecture Baseline before implementing acceptance gaps.",
    body: [
      "## When to use",
      "Use before implementing or modifying code for a non-trivial OpenNori active goal, especially after `opennori resume` or `opennori status` reports architecture state.",
      "",
      "## Commands",
      "- Inspect current state: `opennori status --root <repo> --json`.",
      "- Inspect baseline: `opennori architecture show --root <repo> --json`.",
      "- Export full context for review tools: `opennori context export --root <repo> --json`.",
      "",
      "## Rules",
      "Read `.opennori/architecture/baseline.md` and the current Product AC before code changes.",
      "Implement only acceptance gaps that are compatible with the confirmed baseline.",
      "If the baseline is missing for an active non-trivial goal, use `nori-architecture-brainstorm` before implementation.",
      "If project evidence conflicts with the baseline, use `nori-architecture-challenge`; do not silently change technology stack, directory boundaries, dependency policy, or state model.",
      "Keep Product AC and Architecture Checks separate in explanations and reports."
    ]
  },
  {
    name: "nori-architecture-challenge",
    description: "Create reviewable Architecture Challenges when project evidence conflicts with the confirmed baseline.",
    body: [
      "## When to use",
      "Use when the confirmed Architecture Baseline seems too heavy, too weak, incompatible with current project conventions, blocked by dependency/license/security constraints, or contradicted by evidence.",
      "",
      "## Command",
      "`opennori architecture challenge --root <repo> --summary \"<conflict>\" --evidence \"<project evidence>\" --recommendation \"<suggested baseline change>\" --json`",
      "",
      "## Rules",
      "A challenge is not permission to change the baseline. It is a request for user confirmation.",
      "Agent must not silently replace the Architecture Baseline.",
      "Include current baseline, observed project evidence, the conflict, recommendation, and risk of not changing.",
      "Do not create a process plan or task list.",
      "After creating a challenge, report that user confirmation is required unless the user explicitly waived confirmation."
    ]
  },
  {
    name: "nori-build-vs-buy",
    description: "Record build-vs-buy decisions so agents prefer existing libraries and avoid repeating solved infrastructure.",
    body: [
      "## When to use",
      "Use before implementing infrastructure or platform capabilities such as CLI parsing, schema validation, markdown parsing, storage, routing, auth, rendering, indexing, installers, component primitives, or protocol adapters.",
      "",
      "## Command",
      "`opennori architecture build-vs-buy --root <repo> --area \"<area>\" --need \"<need>\" --recommendation <reuse|buy|self-build> --summary \"<decision>\" --current-project \"<existing deps/patterns>\" --standard-library \"<stdlib option>\" --official-sdk \"<sdk option>\" --open-source \"<libraries checked>\" --self-build-reason \"<why self-build if chosen>\" --json`",
      "",
      "## Rules",
      "Preference order: current project dependency, standard library, official SDK, mature open-source library, then small local implementation.",
      "Do not add a dependency just to avoid writing a few stable product-domain lines.",
      "If recommending self-build, explain license, maintenance, security, package size, runtime cost, product-domain, or fit reasons.",
      "Record the decision as architecture evidence, not as Product AC."
    ]
  },
  {
    name: "nori-project-health",
    description: "Install, uninstall, diagnose, and recover project-local OpenNori assets, manifest, and Skill Pack sync.",
    body: [
      "## When to use",
      "Use when the user asks to install OpenNori, uninstall OpenNori, check whether OpenNori is ready, diagnose broken OpenNori state, inspect manifest, or sync project Skills.",
      "",
      "## Commands",
      "- Short readiness / first-time preview: `opennori bootstrap --root <repo> --json`.",
      "- Confirm first-time setup after user approval: `opennori bootstrap --root <repo> --confirm --json`.",
      "- Preview install: `opennori install --root <repo> --dry-run --json`.",
      "- Install Skill Pack: `opennori install --root <repo> --skill --json`.",
      "- Preview safe existing-project refresh: `opennori install --root <repo> --skill --refresh-skill --merge-agent-route --dry-run --json`.",
      "- Confirm safe existing-project refresh after user approval: `opennori install --root <repo> --skill --refresh-skill --merge-agent-route --confirm --json`.",
      "- Preview manifest/protocol upgrade when entry assets are stale: `opennori upgrade --root <repo> --skill --merge-agent-route --dry-run --json`.",
      "- Confirm manifest/protocol upgrade after user approval: `opennori upgrade --root <repo> --skill --merge-agent-route --confirm --json`.",
      "- Preview destructive overwrite only when safe refresh is not enough: `opennori install --root <repo> --skill --force --dry-run --json`.",
      "- Confirm destructive overwrite only after explicit user approval: `opennori install --root <repo> --skill --force --confirm --json`.",
      "- Doctor: `opennori doctor --root <repo> --json`.",
      "- Existing contract check after upgrade: `opennori check --root <repo> --json`.",
      "- Preview uninstall: `opennori uninstall --root <repo> --dry-run --json`.",
      "- Remove entry assets while preserving state: `opennori uninstall --root <repo> --confirm --json`.",
      "- Remove all OpenNori state only after explicit user acceptance: `opennori uninstall --root <repo> --include-state --confirm --json`.",
      "",
      "## Rules",
      "Always show dry-run plans before destructive writes.",
      "Use `--refresh-skill --merge-agent-route` for existing projects that need current OpenNori Skills or Architecture Baseline routes without overwriting project guidance.",
      "Default uninstall preserves active goals, evidence, reports, archives, brainstorms, and architecture state.",
      "Doctor output includes Architecture Baseline health and agent-readable surface checks.",
      "`opennori check` output includes `acceptance_quality`, `architecture_check`, and `evidence_health`; resolve architecture warnings and review evidence-health findings before treating a goal as confidently complete.",
      "Upgrade must preserve existing active contracts, evidence, and architecture baselines. After upgrade, run `opennori check` and route `acceptance_quality` warnings to `nori-acceptance`, `architecture_check` warnings to the architecture Skills, and `evidence_health` findings to `nori-evidence` for user-approved revision."
    ]
  },
  {
    name: "nori-reporting",
    description: "Summarize OpenNori status, reports, current gaps, user intervention, and acceptance evidence for humans.",
    body: [
      "## When to use",
      "Use when the user asks whether work is complete, what remains, what they need to do, what changed, or asks for an OpenNori report.",
      "",
      "## Commands",
      "- Resume: `opennori resume --root <repo> --json`.",
      "- Next gap: `opennori next --root <repo> --json`.",
      "- Status: `opennori status --root <repo> --json`.",
      "- Report: `opennori report --root <repo> --json`.",
      "- Changes: `opennori changes --root <repo> --json`.",
      "- List goals: `opennori list --root <repo> --json`.",
      "",
      "## Rules",
      "Lead with completion state, current gap, architecture decision, evidence health, evidence basis, and required human intervention.",
      "After reporting, follow `next_recommendation` / `next_actions` when the user has asked to continue, instead of asking the user what the next step is.",
      "Summarize implementation details only as supporting evidence.",
      "Report Product decision and Architecture decision separately.",
      "Never report confidently complete unless all required ACs and blocking Nori Profile items are passing or waived, `evidence_health` is clear, and any active Architecture Challenge is surfaced."
    ]
  }
];

export function skillMarkdown(skill) {
  return [
    "---",
    `name: ${skill.name}`,
    `description: ${skill.description}`,
    "---",
    "",
    ...skill.body,
    ""
  ].join("\n");
}

export function exportedSkillMarkdown() {
  return skillMarkdown(SKILL_PACK[0]);
}

export function skillPackMarkdowns() {
  return Object.fromEntries(SKILL_PACK.map((skill) => [skill.name, skillMarkdown(skill)]));
}
