import { writeJson } from "../core.ts";
import type { ContextExport } from "../types/lifecycle.ts";

export function writeContextExportArtifact(outputPath: string, context: ContextExport): string {
  writeJson(outputPath, context);
  return outputPath;
}
