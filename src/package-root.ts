import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const START_DIR = path.dirname(fileURLToPath(import.meta.url));

function findPackageRoot(start: string): string {
  let current = start;
  while (true) {
    const packagePath = path.join(current, "package.json");
    if (fs.existsSync(packagePath)) {
      try {
        const payload = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { name?: string };
        if (payload.name === "opennori") return current;
      } catch {
        // Keep walking; a parent package may own the compiled file.
      }
    }
    const parent = path.dirname(current);
    if (parent === current) throw new Error("Unable to locate the OpenNori package root.");
    current = parent;
  }
}

export const PACKAGE_ROOT = findPackageRoot(START_DIR);

export function packagePath(...segments: string[]): string {
  return path.join(PACKAGE_ROOT, ...segments);
}
