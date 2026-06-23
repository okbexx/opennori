import path from "node:path";
import {
  findCurrentPairs,
  findDraftPairs,
  findGoalPairs,
  inferGoalLocation,
  pruneInvalidEvidence,
  readGoalPayload,
  writeGoalDossierFromPaths,
  type GoalStateLocation
} from "../core.ts";
import { refreshManifest } from "../lifecycle.ts";
import type { EvidenceLedger, NoriContract } from "../types.ts";
import type { ActiveGoalArgs } from "./active-goal-args.ts";

export type ActiveGoalPair = {
  contract: NoriContract;
  ledger: EvidenceLedger;
  goalDir: string;
  contractPath: string;
  ledgerPath: string;
  acceptancePath: string;
  evidencePath: string;
  root: string;
  location: GoalStateLocation;
  evidencePrune?: ReturnType<typeof pruneInvalidEvidence>;
};

export type ActiveGoalRuntime = {
  loadPair: (args?: ActiveGoalArgs) => ActiveGoalPair;
  savePair: typeof savePair;
  refreshManifest: typeof refreshManifest;
};

export type ActiveGoalLoadErrorType =
  | "no_current_goal"
  | "no_draft_contract"
  | "multiple_current_goals"
  | "multiple_draft_contracts";

type ActiveGoalLoadErrorOptions = {
  type: ActiveGoalLoadErrorType;
  root: string;
  location: GoalStateLocation;
  goal?: string;
  message: string;
};

export class ActiveGoalLoadError extends Error {
  readonly type: ActiveGoalLoadErrorType;
  readonly root: string;
  readonly location: GoalStateLocation;
  readonly goal?: string;

  constructor(options: ActiveGoalLoadErrorOptions) {
    super(options.message);
    this.name = "ActiveGoalLoadError";
    this.type = options.type;
    this.root = options.root;
    this.location = options.location;
    this.goal = options.goal;
  }
}

export function isActiveGoalLoadError(error: unknown): error is ActiveGoalLoadError {
  return error instanceof ActiveGoalLoadError;
}

export function savePair(acceptancePath: string, evidencePath: string, contract: NoriContract, ledger: EvidenceLedger): void {
  writeGoalDossierFromPaths(acceptancePath, evidencePath, contract, ledger);
}

function preparePair(pair: Omit<ActiveGoalPair, "evidencePrune">): ActiveGoalPair {
  const evidencePrune = pruneInvalidEvidence(pair.contract, pair.ledger, { root: pair.root });
  if (evidencePrune.changed) {
    savePair(pair.acceptancePath, pair.evidencePath, pair.contract, pair.ledger);
  }
  return {
    ...pair,
    evidencePrune
  };
}

export function inferRootFromAcceptancePath(acceptancePath: string): string {
  const parts = path.resolve(acceptancePath).split(path.sep);
  const noriIndex = parts.lastIndexOf(".opennori");
  if (noriIndex <= 0) return process.cwd();
  return parts.slice(0, noriIndex).join(path.sep) || path.sep;
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const stringValue = String(value).trim();
  return stringValue || undefined;
}

export function loadPair(args: ActiveGoalArgs = {}): ActiveGoalPair {
  const explicitAcceptance = optionalString(args.acceptance);
  const explicitEvidence = optionalString(args.evidence);
  if (explicitAcceptance || explicitEvidence) {
    if (!explicitAcceptance || !explicitEvidence) {
      throw new Error("Both --acceptance and --evidence are required");
    }
    const acceptancePath = path.resolve(explicitAcceptance);
    const evidencePath = path.resolve(explicitEvidence);
    const goalDir = path.dirname(acceptancePath);
    const contractPath = path.join(goalDir, "contract.json");
    const payload = readGoalPayload({
      goalDir,
      contractPath,
      ledgerPath: evidencePath
    });
    return preparePair({
      contract: payload.contract,
      ledger: payload.ledger,
      goalDir,
      contractPath,
      ledgerPath: evidencePath,
      acceptancePath,
      evidencePath,
      root: inferRootFromAcceptancePath(acceptancePath),
      location: inferGoalLocation(acceptancePath) || "current"
    });
  }

  const root = path.resolve(optionalString(args.root) || process.cwd());
  const goal = optionalString(args.goal);
  const location: GoalStateLocation = args.fromDraft ? "drafts" : "current";
  const pairs = location === "drafts" ? findDraftPairs(root) : findCurrentPairs(root);
  const pair = goal ? pairs.find((item) => item.goalId === goal) : pairs[0];
  if (!pair) {
    throw new ActiveGoalLoadError({
      type: location === "drafts" ? "no_draft_contract" : "no_current_goal",
      root,
      location,
      goal,
      message: location === "drafts"
        ? `No draft OpenNori contract found under ${root}`
        : `No current OpenNori goal found under ${root}`
    });
  }
  if (!goal && pairs.length > 1) {
    throw new ActiveGoalLoadError({
      type: location === "drafts" ? "multiple_draft_contracts" : "multiple_current_goals",
      root,
      location,
      message: location === "drafts"
        ? "Multiple draft OpenNori contracts found. Pass --goal <goal-id> or explicit --acceptance/--evidence paths."
        : "OpenNori current state is invalid: multiple current goals found. Run opennori doctor --root <project> --json."
    });
  }
  const payload = readGoalPayload(pair);
  return preparePair({
    contract: payload.contract,
    ledger: payload.ledger,
    goalDir: pair.goalDir,
    contractPath: pair.contractPath,
    ledgerPath: pair.ledgerPath,
    acceptancePath: pair.acceptancePath,
    evidencePath: pair.evidencePath,
    root,
    location: pair.location
  });
}

export function loadGoalFromLocation(root: string, goalId: string, location: GoalStateLocation): ActiveGoalPair {
  const pair = findGoalPairs(root, location).find((item) => item.goalId === goalId);
  if (!pair) {
    throw new Error(`No OpenNori ${location} goal found: ${goalId}`);
  }
  const payload = readGoalPayload(pair);
  return preparePair({
    contract: payload.contract,
    ledger: payload.ledger,
    goalDir: pair.goalDir,
    contractPath: pair.contractPath,
    ledgerPath: pair.ledgerPath,
    acceptancePath: pair.acceptancePath,
    evidencePath: pair.evidencePath,
    root,
    location: pair.location
  });
}

export function activeGoalRuntime(): ActiveGoalRuntime {
  return {
    loadPair,
    savePair,
    refreshManifest
  };
}
