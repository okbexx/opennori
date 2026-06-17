import { defineCommand } from "citty";
import fs from "node:fs";
import path from "node:path";
import { briefFromBrainstorm, briefFromDiscoveryAnswers, briefFromGoal, briefFromNextGoalCandidate } from "../../../acceptance.ts";
import { architectureState } from "../../../architecture.ts";
import {
  buildContractFromBrief,
  buildEvidenceLedger,
  currentGap,
  appendEvent,
  fail,
  findGoalPairs,
  ok,
  pathsForGoal,
  readJson,
  renderAcceptanceMarkdown,
  nextRecommendation,
  validateContract,
  writeJson
} from "../../../core.ts";
import { bootstrap, refreshManifest } from "../../../lifecycle.ts";
import { loadGoalFromLocation, loadPair, runJsonCommand, type ActiveGoalPair } from "../../runtime.ts";
import type { AcceptanceDiscovery, AcceptanceDiscoveryAnswers, Brainstorm, NoriBrief, NextGoalCandidate } from "../../../types.ts";
import { withContractLanguage } from "../../../language.ts";
import { brainstormPaths, discoveryPaths, jsonArg, resolveRoot, rootArg } from "./shared.ts";

const briefFromBrainstormForCommand = briefFromBrainstorm as unknown as (brainstorm: Brainstorm, candidateId: string) => NoriBrief;
const briefFromGoalForCommand = briefFromGoal as (goal: string, goalId?: string, languageInput?: unknown) => NoriBrief;
const briefFromDiscoveryAnswersForCommand = briefFromDiscoveryAnswers as (
  discovery: AcceptanceDiscovery,
  answers: AcceptanceDiscoveryAnswers,
  goalId?: string,
  languageInput?: unknown
) => NoriBrief;
const briefFromNextGoalCandidateForCommand = briefFromNextGoalCandidate as (
  candidate: NextGoalCandidate,
  options?: { sourceGoalId?: string; goalId?: string; language?: unknown }
) => NoriBrief;

function loadNextCandidateSource(args: Record<string, unknown>, root: string): ActiveGoalPair | null {
  if (args.acceptance || args.evidence) {
    return loadPair({
      root,
      acceptance: args.acceptance,
      evidence: args.evidence
    });
  }
  const sourceGoal = args.sourceGoal ? String(args.sourceGoal) : "";
  if (!sourceGoal) {
    return loadPair({ root });
  }
  for (const location of ["current", "completed", "blocked"] as const) {
    if (findGoalPairs(root, location).some((pair) => pair.goalId === sourceGoal)) {
      return loadGoalFromLocation(root, sourceGoal, location);
    }
  }
  return null;
}

export const draftCommand = defineCommand({
  meta: {
    name: "draft",
    description: "Create a draft Nori Contract from a goal or selected brainstorm candidate."
  },
  args: {
    root: rootArg,
    goal: {
      type: "string",
      description: "Natural language goal to draft."
    },
    goalId: {
      type: "string",
      description: "Optional stable goal id."
    },
    language: {
      type: "string",
      description: "Human-readable Contract language for generated goal and AC text, such as zh-CN or en."
    },
    brief: {
      type: "string",
      description: "Brief JSON file to draft from."
    },
    fromBrainstorm: {
      type: "string",
      description: "Brainstorm id to draft from."
    },
    fromDiscovery: {
      type: "string",
      description: "Acceptance Discovery id to draft from after user answers."
    },
    fromNextCandidate: {
      type: "string",
      description: "Completed goal candidate id to draft from."
    },
    sourceGoal: {
      type: "string",
      description: "Completed source goal id for --from-next-candidate."
    },
    acceptance: {
      type: "string",
      description: "Explicit source acceptance markdown path for --from-next-candidate."
    },
    evidence: {
      type: "string",
      description: "Explicit source evidence JSON path for --from-next-candidate."
    },
    answers: {
      type: "string",
      description: "JSON file with user answers keyed by discovery gap id."
    },
    candidate: {
      type: "string",
      description: "Brainstorm candidate id."
    },
    json: jsonArg
  },
  run({ args }) {
    const root = resolveRoot(args.root);
    const brainstormId = args.fromBrainstorm;
    const discoveryId = args.fromDiscovery;
    const nextCandidateId = args.fromNextCandidate;
    let brief;
    if (args.brief) {
      brief = readJson<NoriBrief>(path.resolve(String(args.brief)));
      if (args.language) brief = withContractLanguage(brief, String(args.language));
    } else if (brainstormId) {
      const candidateId = args.candidate;
      if (!candidateId) throw new Error("--candidate is required with --from-brainstorm");
      brief = briefFromBrainstormForCommand(readJson<Brainstorm>(brainstormPaths(root, brainstormId).jsonPath), String(candidateId));
      if (args.language) brief = withContractLanguage(brief, String(args.language));
    } else if (discoveryId) {
      if (!args.answers) throw new Error("--answers is required with --from-discovery");
      brief = briefFromDiscoveryAnswersForCommand(
        readJson<AcceptanceDiscovery>(discoveryPaths(root, discoveryId).jsonPath),
        readJson<AcceptanceDiscoveryAnswers>(path.resolve(String(args.answers))),
        args.goalId,
        args.language
      );
    } else if (nextCandidateId) {
      const sourcePair = loadNextCandidateSource(args, root);
      if (!sourcePair) {
        return fail(
          "next_candidate_source_unavailable",
          args.sourceGoal
            ? `No current or archived OpenNori goal found for --source-goal ${args.sourceGoal}`
            : "No current OpenNori goal found for --from-next-candidate.",
          "Use a current/completed/blocked goal as the source. Draft Nori Contracts must be approved before they can become executable current goals."
        );
      }
      const { contract, ledger } = sourcePair;
      const architecture = architectureState(sourcePair.root, contract.goal_id);
      const recommendation = nextRecommendation(contract, ledger, { root: sourcePair.root, architecture });
      if (recommendation.status !== "ready-for-next-loop") {
        return fail(
          "next_candidate_unavailable",
          `Source goal is not ready for next loop: ${recommendation.status}`,
          recommendation.actions[0] || "Finish or review the current OpenNori goal before drafting from candidate goals."
        );
      }
      const candidate = (recommendation.candidate_goals || []).find((item) => item.id === String(nextCandidateId));
      if (!candidate) {
        return fail(
          "next_candidate_not_found",
          `Next goal candidate not found: ${nextCandidateId}`,
          `Choose one of: ${(recommendation.candidate_goals || []).map((item) => item.id).join(", ")}`
        );
      }
      brief = briefFromNextGoalCandidateForCommand(candidate, {
        sourceGoalId: contract.goal_id,
        goalId: args.goalId,
        language: args.language || contract.presentation?.language
      });
    } else {
      const goal = String(args.goal || "").trim();
      if (!goal) throw new Error("--goal is required");
      brief = briefFromGoalForCommand(goal, args.goalId, args.language);
    }
    const contract = buildContractFromBrief(brief);
    const ledger = buildEvidenceLedger(contract);
    const issues = validateContract(contract, ledger);
    if (issues.length > 0) {
      return { ...fail("invalid_acceptance", "Draft does not produce a valid OpenNori contract", "Rewrite ACs from the user's perspective"), issues };
    }
    const paths = pathsForGoal(root, contract.goal_id, "drafts");
    fs.mkdirSync(path.dirname(paths.acceptancePath), { recursive: true });
    fs.writeFileSync(paths.acceptancePath, renderAcceptanceMarkdown(contract, ledger));
    writeJson(paths.evidencePath, { contract, ledger });
    refreshManifest(root);
    appendEvent(root, {
      type: "contract.drafted",
      goal_id: contract.goal_id,
      gap_id: currentGap(contract, ledger)?.id,
      actor: { kind: "agent", name: "Agent", skill: "nori-acceptance" },
      summary: `Drafted Nori Contract for ${contract.goal_id}.`,
      data: { acceptance_path: paths.acceptancePath, evidence_path: paths.evidencePath }
    });
    return ok(
      {
        goal_id: contract.goal_id,
        state: "draft",
        presentation: contract.presentation,
        acceptance_basis: contract.acceptance_basis,
        acceptance_path: paths.acceptancePath,
        evidence_path: paths.evidencePath,
        criteria: contract.criteria,
        current_gap: currentGap(contract, ledger)
      },
      [
        { kind: "draft_acceptance_contract", path: paths.acceptancePath },
        { kind: "evidence_ledger", path: paths.evidencePath }
      ],
      [],
      ["Ask the user to approve or revise these acceptance criteria before implementation."]
    );
  }
});

export async function runDraftCommand(rawArgs: string[]) {
  return runJsonCommand(draftCommand, rawArgs);
}

export const initCommand = defineCommand({
  meta: {
    name: "init",
    description: "Initialize OpenNori project state in the current project."
  },
  args: {
    root: rootArg,
    confirm: {
      type: "boolean",
      description: "Apply initialization actions after preview.",
      default: false
    },
    json: jsonArg
  },
  run({ args }) {
    const root = resolveRoot(args.root);
    return bootstrap(root, { confirmed: Boolean(args.confirm) });
  }
});

export async function runInitCommand(rawArgs: string[]) {
  return runJsonCommand(initCommand, rawArgs);
}
