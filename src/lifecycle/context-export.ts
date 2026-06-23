import type { ContextExport, ContextExportPair } from "../types/context-export.ts";
import { buildContextExportPayload } from "./context-export-payload.ts";
import { collectContextExportState } from "./context-export-state.ts";

export function buildContextExport(root: string, pair: ContextExportPair): ContextExport {
  return buildContextExportPayload(collectContextExportState(root, pair));
}
