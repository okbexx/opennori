import fs from "node:fs";
import path from "node:path";
import { readJson, renderReport, slugify, writeJson } from "./core.js";

function relativeTo(root, filePath) {
  return path.relative(root, filePath) || ".";
}

export const ARCHITECTURE_CHALLENGE_SCHEMA_VERSION = "opennori/architecture-challenge-v1";
export const BUILD_VS_BUY_SCHEMA_VERSION = "opennori/build-vs-buy-v1";
export const REQUIRED_ARCHITECTURE_DIRS = ["profiles", "challenges", "decisions", "evidence"];
export const AGENT_ROUTE_START = "<!-- opennori:agent-route:start -->";
export const AGENT_ROUTE_END = "<!-- opennori:agent-route:end -->";
const ARCHITECTURE_BASELINE_SCHEMA_VERSION = "opennori/architecture-baseline-v1";

const BUILTIN_ARCHITECTURE_PROFILES = {
  "agent-native-cli": {
    id: "agent-native-cli",
    title: "Agent-native CLI",
    applies_to: [
      "project-local state tools",
      "agent-facing CLI products",
      "Skill Pack and manifest managed tools"
    ],
    summary: "Use a thin deterministic CLI, domain-first modules, schema-backed project state, manifest-managed lifecycle actions, agent-readable Skills, and build-vs-buy checks before custom infrastructure.",
    sources: [
      {
        label: "CodeGraph / GitNexus",
        lesson: "Expose deterministic agent-readable context, status, doctor, and staleness signals without making OpenNori a code graph platform."
      },
      {
        label: "Compound Engineering Plugin",
        lesson: "Keep command, parser, converter/target, and Skill surfaces separate without adopting process-centered multi-agent review."
      },
      {
        label: "ECC",
        lesson: "Use manifest/profile/component/install-state style productization without becoming a workflow OS."
      },
      {
        label: "CLI-Anything",
        lesson: "Treat CLI, Skill, tests, and registry-like discoverability as product assets without becoming a generic harness market."
      },
      {
        label: "vibecode-pro-max-kit",
        lesson: "Borrow managed-file install and Skill distribution boundaries, but reject RIPER phase folders and process/ as the mainline."
      }
    ],
    principles: [
      "thin-cli-entry",
      "domain-first-modules",
      "schema-backed-opennori-state",
      "manifest-managed-install-upgrade-uninstall",
      "skill-driven-natural-language-usage",
      "agent-readable-baseline-surface",
      "build-vs-buy-before-custom-infrastructure"
    ],
    checks: [
      {
        id: "ARCH-1",
        audience: "maintainer",
        statement: "Opening the CLI entry should make it clear that command parsing, dispatch, and output are separate from domain decisions.",
        review: "Inspect CLI entry, command handlers, and domain modules before claiming architecture complete."
      },
      {
        id: "ARCH-2",
        audience: "maintainer",
        statement: "Changing Product AC discovery should not require editing installer, Skill Pack, manifest, or report rendering logic.",
        review: "Inspect acceptance-discovery modules and tests."
      },
      {
        id: "ARCH-3",
        audience: "maintainer",
        statement: "Install, upgrade, uninstall, managed files, and doctor recovery are lifecycle concerns with dry-run preview and explicit confirmation boundaries.",
        review: "Inspect lifecycle commands, manifest state, and doctor output."
      },
      {
        id: "ARCH-4",
        audience: "agent",
        statement: "Before custom infrastructure work, check current project dependencies, standard libraries, official SDKs, mature open-source libraries, and documented reference projects.",
        review: "Record a build-vs-buy decision or challenge before self-building infrastructure."
      },
      {
        id: "ARCH-5",
        audience: "agent",
        statement: "Do not replace this baseline silently. Raise an Architecture Challenge when project evidence conflicts with it.",
        review: "Check .opennori/architecture/challenges for unresolved challenges."
      }
    ],
    preferred_libraries: [
      {
        area: "cli",
        policy: "Prefer a mature CLI parser or current project convention over growing custom argument parsing."
      },
      {
        area: "schema",
        policy: "Prefer schema validation libraries or JSON Schema over long-term handwritten schema validation."
      },
      {
        area: "markdown",
        policy: "Prefer established markdown/frontmatter libraries when parsing becomes non-trivial; keep OpenNori-specific rendering local when it is product domain logic."
      }
    ],
    avoid: [
      "process/ as OpenNori's workflow mainline",
      "phase/task-list state as product completion state",
      "agent self-summary as the only high-risk completion evidence",
      "silent architecture replacement",
      "custom infrastructure without build-vs-buy evidence"
    ],
    build_vs_buy_policy: {
      order: [
        "current-project-dependency",
        "standard-library",
        "official-sdk",
        "mature-open-source-library",
        "small-local-implementation"
      ],
      require_reason_when_self_building: true
    }
  }
};

export function architectureDir(root) {
  return path.join(root, ".opennori", "architecture");
}

export function architectureBaselinePaths(root) {
  return {
    jsonPath: path.join(architectureDir(root), "baseline.json"),
    markdownPath: path.join(architectureDir(root), "baseline.md")
  };
}

function architectureProfilePath(root, profileId) {
  return path.join(architectureDir(root), "profiles", `${profileId}.json`);
}

export function architectureChallengePath(root, challengeId) {
  return {
    jsonPath: path.join(architectureDir(root), "challenges", `${challengeId}.json`),
    markdownPath: path.join(architectureDir(root), "challenges", `${challengeId}.md`)
  };
}

export function buildVsBuyPath(root, decisionId) {
  return {
    jsonPath: path.join(architectureDir(root), "decisions", `${decisionId}.json`),
    markdownPath: path.join(architectureDir(root), "decisions", `${decisionId}.md`)
  };
}

export function agentGuidePath(root) {
  return path.join(root, ".opennori", "agent-guide.md");
}

function resolveArchitectureProfile(root, profileId = "agent-native-cli") {
  const localPath = architectureProfilePath(root, profileId);
  if (fs.existsSync(localPath)) {
    return {
      ...readJson(localPath),
      origin: "project"
    };
  }
  const builtin = BUILTIN_ARCHITECTURE_PROFILES[profileId];
  if (!builtin) throw new Error(`Unknown Architecture Profile: ${profileId}`);
  return {
    ...builtin,
    origin: "builtin"
  };
}

function localArchitectureProfiles(root) {
  const dir = path.join(architectureDir(root), "profiles");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      const profilePath = path.join(dir, fileName);
      try {
        const profileInput = readJson(profilePath);
        const profile = normalizeArchitectureProfile(profileInput, profileInput.id ? undefined : fileName.replace(/\.json$/, ""));
        return architectureProfileDescriptor(profile, {
          origin: "project",
          path: relativeTo(root, profilePath)
        });
      } catch (error) {
        return {
          id: fileName.replace(/\.json$/, ""),
          title: fileName.replace(/\.json$/, ""),
          origin: "project",
          path: relativeTo(root, profilePath),
          valid: false,
          error: error.message
        };
      }
    });
}

function architectureProfileDescriptor(profile, { origin, path: profilePath = undefined } = {}) {
  const issues = validateArchitectureProfile(profile);
  return {
    id: profile.id,
    title: profile.title,
    origin,
    path: profilePath,
    valid: issues.length === 0,
    validation_issues: issues,
    summary: profile.summary,
    applies_to: profile.applies_to || [],
    sources: profile.sources || [],
    principles: profile.principles || [],
    checks: profile.checks || [],
    preferred_libraries: profile.preferred_libraries || [],
    avoid: profile.avoid || [],
    build_vs_buy_policy: profile.build_vs_buy_policy || null,
    review: {
      can_generate_baseline: issues.length === 0,
      source_count: (profile.sources || []).length,
      check_count: (profile.checks || []).length,
      avoid_count: (profile.avoid || []).length,
      next: issues.length === 0
        ? "Preview a baseline from this profile, show it to the user, and confirm only after acceptance."
        : "Fix validation issues before using this profile for a baseline."
    }
  };
}

export function architectureProfiles(root) {
  const builtins = Object.values(BUILTIN_ARCHITECTURE_PROFILES)
    .map((profile) => architectureProfileDescriptor(profile, { origin: "builtin" }));
  const local = localArchitectureProfiles(root);
  const localIds = new Set(local.map((profile) => profile.id));
  return [
    ...local,
    ...builtins.filter((profile) => !localIds.has(profile.id))
  ];
}

export function buildArchitectureBaseline(root, {
  profileId = "agent-native-cli",
  goal = "",
  goalId = undefined,
  summary = undefined,
  accepted = false
} = {}) {
  const profile = resolveArchitectureProfile(root, profileId);
  const now = new Date().toISOString();
  return {
    schema_version: ARCHITECTURE_BASELINE_SCHEMA_VERSION,
    status: accepted ? "active" : "draft",
    profile: profile.id,
    profile_title: profile.title,
    profile_origin: profile.origin,
    goal_id: goalId || slugify(goal || profile.id),
    goal,
    summary: summary || profile.summary,
    created_at: now,
    updated_at: now,
    accepted_at: accepted ? now : null,
    sticky: true,
    requires_challenge_to_change: true,
    applies_to: profile.applies_to || [],
    sources: profile.sources || [],
    principles: profile.principles || [],
    checks: profile.checks || [],
    preferred_libraries: profile.preferred_libraries || [],
    avoid: profile.avoid || [],
    build_vs_buy_policy: profile.build_vs_buy_policy || {
      order: ["current-project-dependency", "standard-library", "official-sdk", "mature-open-source-library", "small-local-implementation"],
      require_reason_when_self_building: true
    },
    challenge_policy: {
      agent_may_challenge: true,
      agent_must_not_silently_replace: true,
      requires_user_confirmation: true
    },
    agent_surfaces: [
      ".opennori/architecture/baseline.json",
      ".opennori/architecture/baseline.md",
      ".opennori/agent-guide.md",
      "AGENTS.md",
      "CLAUDE.md",
      ".agents/skills/nori-architecture-apply/SKILL.md"
    ]
  };
}

function validateArchitectureBaseline(baseline) {
  const issues = [];
  if (!baseline || typeof baseline !== "object") {
    return [{ path: "$", message: "Architecture Baseline is not an object." }];
  }
  if (baseline.schema_version !== ARCHITECTURE_BASELINE_SCHEMA_VERSION) {
    issues.push({ path: "schema_version", message: `Expected ${ARCHITECTURE_BASELINE_SCHEMA_VERSION}.` });
  }
  if (!["draft", "active"].includes(baseline.status)) {
    issues.push({ path: "status", message: "Architecture Baseline status must be draft or active." });
  }
  if (!baseline.profile) issues.push({ path: "profile", message: "Architecture Baseline must name a profile." });
  if (!baseline.goal_id) issues.push({ path: "goal_id", message: "Architecture Baseline must include a goal_id." });
  if (!Array.isArray(baseline.principles) || baseline.principles.length === 0) {
    issues.push({ path: "principles", message: "Architecture Baseline must include architecture principles." });
  }
  if (!Array.isArray(baseline.checks) || baseline.checks.length === 0) {
    issues.push({ path: "checks", message: "Architecture Baseline must include architecture checks." });
  }
  if (!baseline.build_vs_buy_policy) {
    issues.push({ path: "build_vs_buy_policy", message: "Architecture Baseline must include build-vs-buy policy." });
  }
  return issues;
}

export function validateArchitectureProfile(profile) {
  const issues = [];
  if (!profile || typeof profile !== "object") {
    return [{ path: "$", message: "Architecture Profile is not an object." }];
  }
  if (!profile.id) issues.push({ path: "id", message: "Architecture Profile must include an id." });
  if (!profile.title) issues.push({ path: "title", message: "Architecture Profile must include a title." });
  if (!profile.summary) issues.push({ path: "summary", message: "Architecture Profile must include a summary." });
  if (!Array.isArray(profile.principles) || profile.principles.length === 0) {
    issues.push({ path: "principles", message: "Architecture Profile must include architecture principles." });
  }
  if (!Array.isArray(profile.checks) || profile.checks.length === 0) {
    issues.push({ path: "checks", message: "Architecture Profile must include architecture checks." });
  }
  if (!profile.build_vs_buy_policy) {
    issues.push({ path: "build_vs_buy_policy", message: "Architecture Profile must include build-vs-buy policy." });
  }
  return issues;
}

export function readArchitectureBaseline(root) {
  const paths = architectureBaselinePaths(root);
  if (!fs.existsSync(paths.jsonPath)) return null;
  return readJson(paths.jsonPath);
}

function renderArchitectureBaselineMarkdown(baseline) {
  const lines = [
    "# OpenNori Architecture Baseline",
    "",
    `Status: ${baseline.status}`,
    `Profile: ${baseline.profile}`,
    `Sticky: ${baseline.sticky ? "yes" : "no"}`,
    `Requires challenge to change: ${baseline.requires_challenge_to_change ? "yes" : "no"}`,
    "",
    "## Goal",
    "",
    baseline.goal || "<none>",
    "",
    "## Summary",
    "",
    baseline.summary || "<none>",
    "",
    "## Principles",
    "",
    ...baseline.principles.map((principle) => `- ${principle}`),
    "",
    "## Architecture Checks",
    ""
  ];
  for (const check of baseline.checks || []) {
    lines.push(`- ${check.id || "ARCH"} (${check.audience || "reviewer"}): ${check.statement}`);
  }
  lines.push(
    "",
    "## Build-vs-Buy Policy",
    "",
    ...((baseline.build_vs_buy_policy?.order || []).map((item, index) => `${index + 1}. ${item}`)),
    "",
    "## Prefer",
    "",
    ...((baseline.preferred_libraries || []).map((entry) => `- ${entry.area}: ${entry.policy}`)),
    "",
    "## Avoid",
    "",
    ...((baseline.avoid || []).map((item) => `- ${item}`)),
    "",
    "## Agent Rule",
    "",
    "Before implementing a non-trivial acceptance gap, read this baseline and keep the implementation aligned with it.",
    "If project evidence conflicts with this baseline, create an Architecture Challenge instead of silently replacing it.",
    ""
  );
  return `${lines.join("\n")}\n`;
}

export function normalizeArchitectureProfile(input, idOverride = undefined) {
  const id = idOverride || input.id || slugify(input.title || input.summary || "architecture-profile");
  return {
    ...input,
    id,
    title: input.title || id,
    applies_to: Array.isArray(input.applies_to) ? input.applies_to : [],
    sources: Array.isArray(input.sources) ? input.sources : [],
    principles: Array.isArray(input.principles) ? input.principles : [],
    checks: Array.isArray(input.checks) ? input.checks : [],
    preferred_libraries: Array.isArray(input.preferred_libraries) ? input.preferred_libraries : [],
    avoid: Array.isArray(input.avoid) ? input.avoid : [],
    build_vs_buy_policy: input.build_vs_buy_policy || {
      order: ["current-project-dependency", "standard-library", "official-sdk", "mature-open-source-library", "small-local-implementation"],
      require_reason_when_self_building: true
    },
    updated_at: new Date().toISOString()
  };
}

export function writeArchitectureProfile(root, profile, { force = false } = {}) {
  const target = architectureProfilePath(root, profile.id);
  if (fs.existsSync(target) && !force) {
    throw new Error(`Architecture Profile already exists: ${relativeTo(root, target)}. Rerun with --force only after review.`);
  }
  writeJson(target, profile);
  return target;
}

export function writeArchitectureBaseline(root, baseline) {
  const paths = architectureBaselinePaths(root);
  writeJson(paths.jsonPath, baseline);
  fs.mkdirSync(path.dirname(paths.markdownPath), { recursive: true });
  fs.writeFileSync(paths.markdownPath, renderArchitectureBaselineMarkdown(baseline));
  return paths;
}

export function renderAgentGuideMarkdown() {
  return [
    "# OpenNori Agent Guide",
    "",
    "Before implementing a non-trivial OpenNori acceptance gap, read:",
    "",
    "- `.opennori/active/*.acceptance.md`",
    "- `.opennori/architecture/baseline.md`",
    "- `.opennori/architecture/baseline.json` when structured data is needed",
    "",
    "Follow the Architecture Baseline while completing Product AC.",
    "If the baseline conflicts with project evidence, create an Architecture Challenge and ask for confirmation.",
    "Do not silently replace technology stack, directory boundaries, dependency policy, or state model.",
    "",
    "Build-vs-buy is required before custom infrastructure work: check current dependencies, standard libraries, official SDKs, mature open-source libraries, and documented reference projects before self-building.",
    ""
  ].join("\n");
}

export function renderAgentRouteSectionMarkdown() {
  return [
    AGENT_ROUTE_START,
    "## OpenNori",
    "",
    "Before implementing a non-trivial change, read:",
    "",
    "- `.opennori/active/*.acceptance.md`",
    "- `.opennori/architecture/baseline.md`",
    "- `.opennori/agent-guide.md`",
    "",
    "Follow the Architecture Baseline while completing Product AC.",
    "If the baseline conflicts with project evidence, create an Architecture Challenge instead of silently replacing it.",
    AGENT_ROUTE_END,
    ""
  ].join("\n");
}

export function renderAgentRouteMarkdown(agentName) {
  return [
    `# ${agentName} Project Instructions`,
    "",
    renderAgentRouteSectionMarkdown()
  ].join("\n");
}

function architectureSurfaceState(root) {
  const guide = agentGuidePath(root);
  const agents = path.join(root, "AGENTS.md");
  const claude = path.join(root, "CLAUDE.md");
  const containsRoute = (filePath) => fs.existsSync(filePath)
    && fs.readFileSync(filePath, "utf8").includes(".opennori/architecture/baseline.md");
  return {
    guide: {
      path: ".opennori/agent-guide.md",
      installed: fs.existsSync(guide),
      in_sync: fs.existsSync(guide) && fs.readFileSync(guide, "utf8") === renderAgentGuideMarkdown()
    },
    agents: {
      path: "AGENTS.md",
      installed: fs.existsSync(agents),
      references_baseline: containsRoute(agents)
    },
    claude: {
      path: "CLAUDE.md",
      installed: fs.existsSync(claude),
      references_baseline: containsRoute(claude)
    }
  };
}

function architectureChallengeSummaries(root) {
  const dir = path.join(architectureDir(root), "challenges");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      try {
        const challenge = readJson(path.join(dir, fileName));
        return {
          id: challenge.id || fileName.replace(/\.json$/, ""),
          status: challenge.status || "open",
          summary: challenge.summary || "",
          needs_user: challenge.needs_user !== false,
          path: relativeTo(root, path.join(dir, fileName))
        };
      } catch (error) {
        return {
          id: fileName.replace(/\.json$/, ""),
          status: "unreadable",
          summary: error.message,
          needs_user: true,
          path: relativeTo(root, path.join(dir, fileName))
        };
      }
    });
}

function buildVsBuyDecisionSummaries(root) {
  const dir = path.join(architectureDir(root), "decisions");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      try {
        const decision = readJson(path.join(dir, fileName));
        return {
          id: decision.id || fileName.replace(/\.json$/, ""),
          area: decision.area,
          need: decision.need,
          recommendation: decision.recommendation,
          summary: decision.summary,
          path: relativeTo(root, path.join(dir, fileName))
        };
      } catch (error) {
        return {
          id: fileName.replace(/\.json$/, ""),
          error: error.message,
          path: relativeTo(root, path.join(dir, fileName))
        };
      }
    });
}

export function architectureState(root, goalId = undefined) {
  const paths = architectureBaselinePaths(root);
  const surface = architectureSurfaceState(root);
  const challenges = architectureChallengeSummaries(root);
  const openChallenges = challenges.filter((challenge) => challenge.status !== "resolved");
  const decisions = buildVsBuyDecisionSummaries(root);

  let baseline = null;
  let issues = [];
  if (fs.existsSync(paths.jsonPath)) {
    try {
      baseline = readJson(paths.jsonPath);
      issues = validateArchitectureBaseline(baseline);
    } catch (error) {
      issues = [{ path: "baseline", message: error.message }];
    }
  }

  let decision = "missing";
  if (baseline && issues.length > 0) decision = "invalid";
  if (baseline && issues.length === 0 && baseline.status === "draft") decision = "draft";
  if (baseline && issues.length === 0 && baseline.status === "active") decision = "valid";
  if (baseline && issues.length === 0 && openChallenges.length > 0) decision = "challenged";

  return {
    schema_version: "opennori/architecture-state-v1",
    decision,
    required_for_goal: Boolean(goalId),
    baseline: baseline ? {
      status: baseline.status,
      profile: baseline.profile,
      profile_title: baseline.profile_title,
      goal_id: baseline.goal_id,
      sticky: baseline.sticky,
      requires_challenge_to_change: baseline.requires_challenge_to_change,
      accepted_at: baseline.accepted_at
    } : null,
    issues,
    open_challenges: openChallenges,
    build_vs_buy_decisions: decisions,
    agent_surface: surface,
    paths: {
      baseline_json: relativeTo(root, paths.jsonPath),
      baseline_markdown: relativeTo(root, paths.markdownPath),
      agent_guide: ".opennori/agent-guide.md"
    }
  };
}

function renderArchitectureReportSection(root, goalId = undefined) {
  const state = architectureState(root, goalId);
  const lines = [
    "## Architecture Baseline",
    "",
    `Architecture decision: ${state.decision}`,
    `Baseline: ${state.baseline ? `${state.baseline.profile} (${state.baseline.status})` : "<missing>"}`,
    `Challenge: ${state.open_challenges.length > 0 ? `${state.open_challenges.length} open` : "none"}`,
    `Build-vs-buy decisions: ${state.build_vs_buy_decisions.length}`,
    `Agent guide: ${state.agent_surface.guide.installed ? "installed" : "missing"}`,
    "",
    "Paths:",
    `- ${state.paths.baseline_markdown}`,
    `- ${state.paths.agent_guide}`,
    ""
  ];
  if (state.open_challenges.length > 0) {
    lines.push("Open challenges:");
    for (const challenge of state.open_challenges) {
      lines.push(`- ${challenge.id}: ${challenge.summary || "<none>"}`);
    }
    lines.push("");
  }
  if (state.issues.length > 0) {
    lines.push("Issues:");
    for (const issue of state.issues) {
      lines.push(`- ${issue.path}: ${issue.message}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function renderReportWithArchitecture(root, contract, ledger) {
  const base = renderReport(contract, ledger).trimEnd();
  return `${base}\n\n${renderArchitectureReportSection(root, contract.goal_id).trimEnd()}\n`;
}

export function renderArchitectureChallengeMarkdown(challenge) {
  return [
    `# ${challenge.id} Architecture Challenge`,
    "",
    `Status: ${challenge.status}`,
    `Needs user: ${challenge.needs_user ? "yes" : "no"}`,
    `Baseline: ${challenge.baseline?.profile || "<none>"}`,
    "",
    "## Summary",
    "",
    challenge.summary || "<none>",
    "",
    "## Evidence",
    "",
    challenge.evidence || "<none>",
    "",
    "## Recommendation",
    "",
    challenge.recommendation || "<none>",
    "",
    "## Rule",
    "",
    "This challenge is the only valid way for an agent to request a baseline change. Do not silently replace the Architecture Baseline.",
    ""
  ].join("\n");
}

export function renderBuildVsBuyMarkdown(decision) {
  return [
    `# ${decision.id} Build-vs-Buy Decision`,
    "",
    `Area: ${decision.area}`,
    `Need: ${decision.need}`,
    `Recommendation: ${decision.recommendation}`,
    "",
    "## Summary",
    "",
    decision.summary || "<none>",
    "",
    "## Candidates Checked",
    "",
    `- Current project: ${decision.current_project || "<not checked>"}`,
    `- Standard library: ${decision.standard_library || "<not checked>"}`,
    `- Official SDK: ${decision.official_sdk || "<not checked>"}`,
    `- Open source: ${decision.open_source || "<not checked>"}`,
    "",
    "## Self-build Reason",
    "",
    decision.self_build_reason || "<none>",
    ""
  ].join("\n");
}
