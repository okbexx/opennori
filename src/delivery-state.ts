import fs from "node:fs";
import path from "node:path";
import { OpenNoriError } from "./errors.ts";
import { readJson, writeJsonAtomic } from "./io.ts";
import type { DeliveryRecord, TaskRecord } from "./types.ts";
import { assertSchema } from "./validation.ts";

const DELIVERY_FILE = "delivery.json";

function deliveryPath(directory: string): string {
  return path.join(directory, DELIVERY_FILE);
}

export function assertDeliveryRecord(record: DeliveryRecord): void {
  assertSchema<DeliveryRecord>("delivery", record);
  const gitFields = [record.base_branch, record.base_commit, record.branch];
  if (record.mode === "waived") {
    if (record.status !== "waived" || !record.waiver || record.implementation_revision === null) {
      throw new OpenNoriError("delivery_state_invalid", "A waived delivery needs current human confirmation provenance.");
    }
    if ([...gitFields, record.commit, record.remote, record.pull_request_url].some((value) => value !== null)) {
      throw new OpenNoriError("delivery_state_invalid", "A waived delivery cannot contain Git or pull request fields.");
    }
    return;
  }
  if (gitFields.some((value) => value === null) || record.waiver !== null) {
    throw new OpenNoriError("delivery_state_invalid", "Git delivery needs a base commit and named task branch without waiver fields.");
  }
  if (record.mode === "commit" && record.remote !== null) {
    throw new OpenNoriError("delivery_state_invalid", "Commit delivery cannot claim a pull request remote.");
  }
  if (record.mode === "pull_request" && !record.remote) {
    throw new OpenNoriError("delivery_state_invalid", "Pull request delivery needs a planned remote.");
  }
  if (record.status === "planned") {
    if (record.commit !== null || record.pull_request_url !== null || record.implementation_revision !== null) {
      throw new OpenNoriError("delivery_state_invalid", "A planned delivery cannot claim a commit, pull request, or implementation revision.");
    }
    return;
  }
  if (record.status !== "recorded" || !record.commit || record.implementation_revision === null) {
    throw new OpenNoriError("delivery_state_invalid", "Recorded Git delivery needs a commit bound to one implementation revision.");
  }
  if (record.mode === "commit" && record.pull_request_url !== null) {
    throw new OpenNoriError("delivery_state_invalid", "Commit delivery cannot claim a remote pull request.");
  }
  if (record.mode === "pull_request" && !record.pull_request_url) {
    throw new OpenNoriError("delivery_state_invalid", "Pull request delivery needs a verified remote and URL.");
  }
}

export function writeDelivery(directory: string, record: DeliveryRecord): DeliveryRecord {
  assertDeliveryRecord(record);
  writeJsonAtomic(deliveryPath(directory), record);
  return record;
}

export function loadDelivery(directory: string, taskId: string): DeliveryRecord | null {
  const filePath = deliveryPath(directory);
  if (!fs.existsSync(filePath)) return null;
  const record = readJson<DeliveryRecord>(filePath);
  assertDeliveryRecord(record);
  if (record.task_id !== taskId) {
    throw new OpenNoriError("delivery_task_mismatch", `Delivery record belongs to ${record.task_id}, not ${taskId}.`);
  }
  return record;
}

export function deliveryReady(task: TaskRecord, record: DeliveryRecord | null): boolean {
  if (!task.delivery_required) return true;
  if (!record || record.implementation_revision !== task.implementation_revision) return false;
  return record.status === "recorded" || record.status === "waived";
}
