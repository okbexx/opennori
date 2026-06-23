import type {
  ActiveGoalSummary,
  AgentNext,
  BootstrapData,
  DoctorState
} from "./types.ts";
import { agentNext } from "./agent-next-builder.ts";
import { activeGoalCount, activeGoals } from "./agent-next-doctor.ts";

const draftReviewInstruction =
  "Do not implement yet. Show a compact draft Nori Contract overview, then start the one-AC-at-a-time AC Review Loop. Review only the first unconfirmed AC with exact entries, objects, fields, states, non-passing examples, and evidence objects. Ask for final approve only after every AC is confirmed one by one.";

const noGoalAcceptanceInstruction =
  "Do not implement yet. Use the user's already stated goal if available; otherwise ask for the goal. Run acceptance discovery or draft a Nori Contract before implementation.";

function draftCount(doctor: DoctorState | undefined): number {
  return doctor?.draft_goals?.filter((goal) => goal.recoverable !== false).length ?? 0;
}

function initializedNoCurrentContract(root: string, drafts: number, source: "bootstrap" | "doctor"): AgentNext {
  return agentNext({
    state: "initialized_no_active_contract",
    recommendedSkill: "nori-acceptance",
    summary: drafts > 0
      ? source === "bootstrap"
        ? "OpenNori is initialized with draft contracts, but no current Nori Contract is approved yet."
        : "OpenNori is ready with draft contracts, but no current Nori Contract is approved yet."
      : source === "bootstrap"
        ? "OpenNori is initialized, and no current Nori Contract exists yet."
        : "OpenNori is ready, and no current Nori Contract exists yet.",
    instruction: drafts > 0
      ? draftReviewInstruction
      : source === "bootstrap"
        ? "Use the user's already stated natural-language goal if the current conversation includes one; otherwise ask for the goal. Then run acceptance discovery or draft human-centered acceptance criteria before implementation."
        : noGoalAcceptanceInstruction,
    userVisibleNext: drafts > 0
      ? "Review and confirm the draft one AC at a time before final approval."
      : source === "bootstrap"
        ? "Continue with acceptance discovery for the stated goal, or ask for the goal if it was not provided."
        : "Turn the stated goal into human-centered acceptance criteria, or ask for the goal if it was not provided.",
    needsUser: true,
    commands: [`opennori doctor --root ${root} --json`]
  });
}

function readyWithCurrentGoal(root: string, goals: ActiveGoalSummary[], source: "bootstrap" | "doctor"): AgentNext {
  const goal = goals.length === 1 ? goals[0] : undefined;
  const hasMultipleGoals = goals.length > 1;

  return agentNext({
    state: "ready_with_current_goal",
    recommendedSkill: "nori-reporting",
    summary: "OpenNori is ready and has a current Nori Contract.",
    instruction: hasMultipleGoals
      ? source === "doctor"
        ? "Run doctor and recover .opennori/current so exactly one current Nori Contract remains before publishing dashboard activity or resuming work."
        : "Run doctor and recover .opennori/current so exactly one current Nori Contract remains before resuming work."
      : source === "doctor"
        ? "Resume the current goal and report the current gap, completion decision, and evidence basis."
        : "Resume the current contract and report the current gap, completion decision, and evidence basis.",
    userVisibleNext: hasMultipleGoals
      ? "Recover OpenNori current state before continuing."
      : goal?.current_gap
        ? `Continue from current gap ${goal.current_gap.id}.`
        : source === "doctor"
          ? "Review the current Nori Contract status."
          : "Resume the current OpenNori goal.",
    goalId: goal?.goal_id,
    currentGapId: goal?.current_gap?.id ?? null,
    needsUser: hasMultipleGoals,
    commands: hasMultipleGoals || !goal
      ? [`opennori doctor --root ${root} --json`]
      : [`opennori resume --root ${root} --json`]
  });
}

export function agentNextForBootstrap(data: Pick<BootstrapData, "status" | "root" | "doctor">): AgentNext {
  if (data.status === "needs_confirm") {
    return agentNext({
      state: "setup_preview_needs_confirmation",
      recommendedSkill: "nori-project-health",
      summary: "OpenNori project initialization is only previewed.",
      instruction: "Show the preview to the user and ask for explicit confirmation before writing .opennori state.",
      userVisibleNext: "Confirm initialization or revise the setup target.",
      needsUser: true,
      commands: [`opennori init --root ${data.root} --confirm --json`]
    });
  }

  if (data.doctor.status !== "ready") {
    return agentNextForDoctor(data.root, data.doctor);
  }

  if (activeGoalCount(data.doctor) === 0) {
    return initializedNoCurrentContract(data.root, draftCount(data.doctor), "bootstrap");
  }

  return readyWithCurrentGoal(data.root, activeGoals(data.doctor), "bootstrap");
}

export function agentNextForDoctor(root: string, doctor: DoctorState): AgentNext {
  if (doctor.status !== "ready") {
    const missingProjectState = doctor.checks.some((check) => check.name === "opennori_directory" && !check.ok);
    return agentNext({
      state: "health_needs_recovery",
      recommendedSkill: "nori-project-health",
      summary: missingProjectState
        ? "This project has no .opennori state yet."
        : `OpenNori health is ${doctor.status}.`,
      instruction: missingProjectState
        ? "Run the init preview, summarize the planned .opennori writes in human terms, and ask for confirmation before writing."
        : "Summarize failed checks and recovery actions; preview any lifecycle write before asking the user to confirm.",
      userVisibleNext: missingProjectState
        ? "Preview OpenNori project initialization, then ask for confirmation."
        : "Recover OpenNori bundle readiness before continuing the acceptance loop.",
      needsUser: doctor.recovery_actions.length > 0,
      safeNextCommand: missingProjectState ? `opennori init --root ${root} --json` : undefined,
      commands: [`opennori doctor --root ${root} --json`]
    });
  }

  if (doctor.active_goals.length === 0) {
    return initializedNoCurrentContract(root, draftCount(doctor), "doctor");
  }

  return readyWithCurrentGoal(root, activeGoals(doctor), "doctor");
}
