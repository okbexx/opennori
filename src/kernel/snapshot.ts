import fs from "node:fs";
import path from "node:path";
import { writeJson } from "../core/shared.ts";
import type { NoriSnapshot } from "../types/kernel.ts";
import { buildSnapshot } from "./snapshot-builder.ts";
import { snapshotPath } from "./snapshot-paths.ts";

export { buildSnapshot, SNAPSHOT_SCHEMA_VERSION } from "./snapshot-builder.ts";
export { snapshotPath } from "./snapshot-paths.ts";

export function refreshSnapshot(root: string, options: { goalId?: string } = {}): NoriSnapshot {
  const snapshot = buildSnapshot(root, options);
  fs.mkdirSync(path.dirname(snapshotPath(root)), { recursive: true });
  writeJson(snapshotPath(root), snapshot);
  return snapshot;
}
