import fs from "node:fs";
import path from "node:path";
import { OpenNoriError } from "./errors.ts";
import { contentHash, nowIso, readJson, writeBufferAtomic, writeJsonAtomic, writeTextAtomic } from "./io.ts";
import type { ContractApprovalInput, ContractInput, NoriContract, TaskRecord } from "./types.ts";
import { assertSchema } from "./validation.ts";
import { withTaskDirectoryLock } from "./task-lock.ts";

const CONTRACT_FILE = "contract.json";
const CONTRACT_REVIEW_FILE = "contract.md";

export function contractPath(taskDirectory: string): string {
  return path.join(taskDirectory, CONTRACT_FILE);
}

export function contractReviewPath(taskDirectory: string): string {
  return path.join(taskDirectory, CONTRACT_REVIEW_FILE);
}

/** Load the JSON authority. The generated Markdown review surface is never parsed. */
export function loadContract(taskDirectory: string, expectedTaskId?: string): NoriContract {
  const filePath = contractPath(taskDirectory);
  if (!fs.existsSync(filePath)) {
    throw new OpenNoriError("contract_not_found", `No Nori Contract exists at ${filePath}.`, {
      context: { path: filePath },
      recovery: "Draft the task contract before trying to start implementation."
    });
  }
  const contract = readJson<NoriContract>(filePath);
  assertContract(contract, expectedTaskId);
  return contract;
}

/** Create or replace a draft while the task is still in planning. */
export function writeContractDraft(taskDirectory: string, task: TaskRecord, input: ContractInput): NoriContract {
  return withTaskDirectoryLock(taskDirectory, () => writeContractDraftUnlocked(taskDirectory, task, input));
}

function writeContractDraftUnlocked(taskDirectory: string, task: TaskRecord, input: ContractInput): NoriContract {
  assertSchema<ContractInput>("contractInput", input);
  const canonicalTask = loadCanonicalTask(taskDirectory, task.id);
  if (canonicalTask.status !== "planning") {
    throw new OpenNoriError("contract_locked", `Task ${canonicalTask.id} is ${canonicalTask.status}; its Outcome definition is locked.`, {
      context: { task_id: canonicalTask.id, status: canonicalTask.status },
      recovery: "Revise the contract while the task is planning, before approval and implementation."
    });
  }

  const filePath = contractPath(taskDirectory);
  if (fs.existsSync(filePath)) {
    const existing = loadContract(taskDirectory, canonicalTask.id);
    if (existing.status === "approved") {
      throw new OpenNoriError("contract_locked", `Task ${canonicalTask.id} already has an approved Contract.`, {
        context: { task_id: canonicalTask.id, status: canonicalTask.status },
        recovery: "Start the approved task, or explicitly replan it before replacing the Contract."
      });
    }
  }

  const contract: NoriContract = {
    schema_version: "opennori/contract-v1",
    task_id: canonicalTask.id,
    goal: input.goal.trim(),
    status: "draft",
    outcomes: input.outcomes.map((outcome) => ({
      ...outcome,
      statement: outcome.statement.trim(),
      verification: outcome.verification.trim()
    })),
    assumptions: (input.assumptions ?? []).map((assumption) => assumption.trim()),
    approval: null,
    updated_at: nowIso()
  };
  assertContract(contract, canonicalTask.id);
  writeContractFiles(taskDirectory, contract);
  return contract;
}

/** Record a confirmed human approval and bind it to the canonical Contract content. */
export function approveContract(
  taskDirectory: string,
  task: TaskRecord,
  input: ContractApprovalInput
): NoriContract {
  return withTaskDirectoryLock(taskDirectory, () => approveContractUnlocked(taskDirectory, task, input));
}

function approveContractUnlocked(
  taskDirectory: string,
  task: TaskRecord,
  input: ContractApprovalInput
): NoriContract {
  const canonicalTask = loadCanonicalTask(taskDirectory, task.id);
  if (canonicalTask.status !== "planning") {
    throw new OpenNoriError(
      "contract_approval_closed",
      `Task ${canonicalTask.id} is ${canonicalTask.status}; contract approval is only valid in planning.`
    );
  }
  const contract = loadContract(taskDirectory, canonicalTask.id);
  if (contract.status === "approved") {
    writeContractFiles(taskDirectory, contract);
    return contract;
  }
  if (contract.outcomes.length === 0 || !contract.outcomes.some((outcome) => outcome.required)) {
    throw new OpenNoriError("contract_not_ready", "A Contract needs at least one required Outcome before approval.", {
      context: { task_id: canonicalTask.id },
      recovery: "Add a required, independently verifiable Outcome and review the draft again."
    });
  }

  const approver = input.approver.trim();
  const hostConfirmationRef = input.host_confirmation_ref?.trim();
  const note = input.note?.trim();
  if (
    !approver ||
    (input.host_confirmation_ref !== undefined && !hostConfirmationRef) ||
    (input.note !== undefined && !note)
  ) {
    throw new OpenNoriError("contract_approval_invalid", "Contract approval needs a non-empty approver and non-blank optional values.", {
      recovery: "Record the person who explicitly approved the reviewed Contract; include a host confirmation reference when available."
    });
  }

  const approvedAt = nowIso();
  const approved: NoriContract = {
    ...contract,
    status: "approved",
    approval: {
      approver,
      approved_at: approvedAt,
      content_hash: contractContentHash(contract),
      ...(hostConfirmationRef ? { host_confirmation_ref: hostConfirmationRef } : {}),
      ...(note ? { note } : {})
    },
    updated_at: approvedAt
  };
  assertContract(approved, canonicalTask.id);
  writeContractFiles(taskDirectory, approved);
  return approved;
}

export function renderContractMarkdown(contract: NoriContract): string {
  const lines = [
    `# ${contract.goal}`,
    "",
    `Status: ${contract.status}`,
    `Task: ${contract.task_id}`,
    ""
  ];
  if (contract.approval) {
    lines.push("## Approval", "");
    lines.push(`Approver: ${contract.approval.approver}`);
    lines.push(`Approved at: ${contract.approval.approved_at}`);
    lines.push(`Content hash: ${contract.approval.content_hash}`);
    if (contract.approval.host_confirmation_ref) {
      lines.push(`Host confirmation: ${contract.approval.host_confirmation_ref}`);
    }
    if (contract.approval.note) lines.push(`Note: ${contract.approval.note}`);
    lines.push("");
  }
  lines.push("## Outcomes", "");
  for (const outcome of contract.outcomes) {
    lines.push(`### ${outcome.id}${outcome.required ? " (required)" : " (optional)"}`);
    lines.push("");
    lines.push(outcome.statement);
    lines.push("");
    lines.push(`Verification: ${outcome.verification}`);
    lines.push("");
  }
  if (contract.assumptions.length > 0) {
    lines.push("## Assumptions", "", ...contract.assumptions.map((assumption) => `- ${assumption}`), "");
  }
  lines.push(
    "---",
    "",
    "This file is generated from contract.json for review. OpenNori never parses it as lifecycle state.",
    ""
  );
  return lines.join("\n");
}

/** Hash only the semantic definition that the user reviews and approves. */
export function contractContentHash(contract: NoriContract): string {
  return contentHash(
    JSON.stringify({
      schema_version: contract.schema_version,
      task_id: contract.task_id,
      goal: contract.goal,
      outcomes: contract.outcomes.map((outcome) => ({
        id: outcome.id,
        statement: outcome.statement,
        verification: outcome.verification,
        required: outcome.required
      })),
      assumptions: contract.assumptions
    })
  );
}

export function regenerateContractMarkdown(taskDirectory: string): string {
  return withTaskDirectoryLock(taskDirectory, () => regenerateContractMarkdownUnlocked(taskDirectory));
}

function regenerateContractMarkdownUnlocked(taskDirectory: string): string {
  const task = loadCanonicalTask(taskDirectory);
  if (task.status === "completed") {
    throw new OpenNoriError("task_completed", `Task ${task.id} is completed and its Contract is read-only.`);
  }
  const contract = loadContract(taskDirectory, task.id);
  const markdown = renderContractMarkdown(contract);
  writeTextAtomic(contractReviewPath(taskDirectory), markdown);
  return markdown;
}

function writeContractFiles(taskDirectory: string, contract: NoriContract): void {
  const writes = [
    { filePath: contractPath(taskDirectory), content: Buffer.from(`${JSON.stringify(contract, null, 2)}\n`, "utf8") },
    { filePath: contractReviewPath(taskDirectory), content: Buffer.from(renderContractMarkdown(contract), "utf8") }
  ];
  const snapshots = writes.map(({ filePath, content }) => {
    if (!fs.existsSync(filePath)) return { filePath, content: null };
    if (!fs.statSync(filePath).isFile()) {
      throw new OpenNoriError("contract_write_blocked", `Contract target is not a regular file: ${filePath}`, {
        recovery: "Move the conflicting path aside, then retry the Contract operation."
      });
    }
    return { filePath, content: fs.readFileSync(filePath), mode: fs.statSync(filePath).mode, written: content };
  });
  try {
    writeJsonAtomic(writes[0]?.filePath as string, contract);
    writeTextAtomic(writes[1]?.filePath as string, renderContractMarkdown(contract));
  } catch (error) {
    try {
      for (const snapshot of [...snapshots].reverse()) {
        const written = writes.find((entry) => entry.filePath === snapshot.filePath)?.content;
        if (!fs.existsSync(snapshot.filePath)) {
          if (snapshot.content !== null) {
            throw new OpenNoriError("contract_rollback_conflict", `Contract path was removed during rollback: ${snapshot.filePath}`);
          }
          continue;
        }
        const stat = fs.lstatSync(snapshot.filePath);
        if (!stat.isFile() || stat.isSymbolicLink()) {
          throw new OpenNoriError("contract_rollback_conflict", `Contract path is no longer a regular file: ${snapshot.filePath}`);
        }
        const current = fs.readFileSync(snapshot.filePath);
        if (snapshot.content === null) {
          if (!written || !current.equals(written)) {
            throw new OpenNoriError("contract_rollback_conflict", `Contract path changed outside this operation: ${snapshot.filePath}`);
          }
          fs.rmSync(snapshot.filePath);
          continue;
        }
        if (current.equals(snapshot.content)) continue;
        if (!written || !current.equals(written)) {
          throw new OpenNoriError("contract_rollback_conflict", `Contract path changed outside this operation: ${snapshot.filePath}`);
        }
        writeBufferAtomic(snapshot.filePath, snapshot.content, "mode" in snapshot ? snapshot.mode : undefined);
      }
    } catch (rollbackError) {
      throw new OpenNoriError("contract_rollback_failed", "Contract write failed and its review files could not be fully restored.", {
        context: {
          write_error: error instanceof Error ? error.message : String(error),
          rollback_error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
        },
        recovery: "Restore contract.json and contract.md from version control or a reviewed backup before continuing."
      });
    }
    throw error;
  }
}

function loadCanonicalTask(taskDirectory: string, expectedTaskId?: string): TaskRecord {
  const filePath = path.join(taskDirectory, "task.json");
  if (!fs.existsSync(filePath)) {
    throw new OpenNoriError("task_state_missing", `Missing task.json at ${filePath}.`);
  }
  const task = readJson<TaskRecord>(filePath);
  assertSchema<TaskRecord>("task", task);
  if (expectedTaskId && task.id !== expectedTaskId) {
    throw new OpenNoriError("task_state_mismatch", `Canonical task is ${task.id}, not ${expectedTaskId}.`, {
      context: { expected_task_id: expectedTaskId, actual_task_id: task.id }
    });
  }
  if (task.id !== path.basename(taskDirectory)) {
    throw new OpenNoriError("task_directory_mismatch", `Task ${task.id} is stored under ${path.basename(taskDirectory)}.`);
  }
  return task;
}

function assertContract(contract: NoriContract, expectedTaskId?: string): void {
  assertSchema<NoriContract>("contract", contract);
  if (expectedTaskId && contract.task_id !== expectedTaskId) {
    throw new OpenNoriError("contract_task_mismatch", `Contract belongs to ${contract.task_id}, not ${expectedTaskId}.`, {
      context: { expected_task_id: expectedTaskId, actual_task_id: contract.task_id }
    });
  }
  const ids = new Set<string>();
  for (const outcome of contract.outcomes) {
    if (ids.has(outcome.id)) {
      throw new OpenNoriError("duplicate_outcome", `Contract contains duplicate Outcome ${outcome.id}.`);
    }
    ids.add(outcome.id);
    if (!outcome.statement.trim() || !outcome.verification.trim()) {
      throw new OpenNoriError("outcome_empty", `Outcome ${outcome.id} needs both a statement and verification.`);
    }
  }
  if (!contract.goal.trim() || contract.assumptions.some((assumption) => !assumption.trim())) {
    throw new OpenNoriError("contract_empty_text", "Contract text fields cannot be blank.");
  }
  if (contract.approval) {
    if (
      !contract.approval.approver.trim() ||
      (contract.approval.host_confirmation_ref !== undefined && !contract.approval.host_confirmation_ref.trim()) ||
      (contract.approval.note !== undefined && !contract.approval.note.trim())
    ) {
      throw new OpenNoriError("contract_approval_invalid", "Contract approval provenance contains blank text.");
    }
    const expectedHash = contractContentHash(contract);
    if (contract.approval.content_hash !== expectedHash) {
      throw new OpenNoriError("contract_approval_mismatch", `Approved Contract ${contract.task_id} no longer matches its recorded content hash.`, {
        context: {
          task_id: contract.task_id,
          recorded_hash: contract.approval.content_hash,
          actual_hash: expectedHash
        },
        recovery: "Restore the approved Contract content or return to Plan and obtain approval for a new Contract."
      });
    }
  }
}
