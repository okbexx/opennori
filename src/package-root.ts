import fs from "node:fs";
import path from "node:path";

export function packageRoot(fromDir = import.meta.dirname): string {
  let current = fromDir;
  while (true) {
    if (fs.existsSync(path.join(current, "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(fromDir, "..");
    current = parent;
  }
}

export function packagePath(...segments: string[]): string {
  return path.join(packageRoot(), ...segments);
}
