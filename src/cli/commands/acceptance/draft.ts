import { defineCommand } from "citty";
import fs from "node:fs";
import path from "node:path";
import { briefFromSkillPreparedBrief } from "../../../acceptance.ts";
import {
  buildContractFromBrief,
  buildEvidenceLedger,
  currentGap,
  appendEvent,
  fail,
  ok,
  pathsForGoal,
  readJson,
  renderAcceptanceMarkdown,
  validateContract,
  writeJson
} from "../../../core.ts";
import { bootstrap, refreshManifest } from "../../../lifecycle.ts";
import { runJsonCommand } from "../../runtime.ts";
import type { NoriBrief } from "../../../types.ts";
import { withContractLanguage } from "../../../language.ts";
import { jsonArg, resolveRoot, rootArg } from "./shared.ts";

export const draftCommand = defineCommand({
  meta: {
    name: "draft",
    description: "Create a draft Nori Contract from a Skill-prepared brief."
  },
  args: {
    root: rootArg,
    language: {
      type: "string",
      description: "Human-readable Contract language for generated goal and AC text, such as zh-CN or en."
    },
    brief: {
      type: "string",
      description: "Brief JSON file to draft from."
    },
    json: jsonArg
  },
  run({ args }) {
    const root = resolveRoot(args.root);
    if (!args.brief) {
      return fail(
        "brief_required",
        "opennori draft requires a Skill-prepared --brief file.",
        "Use OpenNori Skills to discover/review acceptance criteria, then pass the resulting NoriBrief with opennori draft --brief <brief.json>."
      );
    }
    let brief = briefFromSkillPreparedBrief(readJson<NoriBrief>(path.resolve(String(args.brief))), args.language);
    if (args.language) brief = withContractLanguage(brief, String(args.language));
    const contract = buildContractFromBrief(brief);
    const ledger = buildEvidenceLedger(contract);
    const issues = validateContract(contract, ledger);
    if (issues.length > 0) {
      return { ...fail("invalid_acceptance", "Draft does not produce a valid OpenNori contract", "Fix the reported contract or ledger structure issues."), issues };
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
      ["Show AC Interpretation Review for every criterion, then ask the user to approve or revise before implementation."]
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
