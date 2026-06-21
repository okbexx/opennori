import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const CLI = path.join(ROOT, "bin", "opennori.js");
export const CLI_MODULE = pathToFileURL(path.join(ROOT, "dist", "src", "cli.js")).href;
export const PACKAGE_VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;

export function run(args, options = {}) {
  const result = spawnSync(process.execPath, [options.cli || CLI, ...args], {
    cwd: options.cwd || ROOT,
    encoding: "utf8"
  });
  if (result.status !== (options.status ?? 0)) {
    throw new Error(result.stderr || result.stdout);
  }
  return JSON.parse(result.stdout);
}

export function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "nori-test-"));
}

export function skillBrief(goal, options = {}) {
  const goalId = options.goalId;
  const language = options.language || (/[\u3400-\u9fff]/.test(goal) ? "zh-CN" : "en");
  const zh = language === "zh-CN";
  return {
    goal_id: goalId,
    goal,
    presentation: { language },
    acceptance_basis: {
      status: "draft",
      summary: "Skill-prepared acceptance brief for test."
    },
    criteria: options.criteria || (zh
      ? [
          {
            id: "AC-1",
            layer: "protocol",
            user_story: "作为用户，我能从正常入口打开结果并看到当前交付状态。",
            measurement: "打开用户入口并查看结果状态。",
            threshold: "页面或报告明确显示目标结果、当前状态和是否可接受。"
          },
          {
            id: "AC-2",
            layer: "operator",
            user_story: "作为用户，我能执行核心操作并看到成功反馈。",
            measurement: "按目标路径执行一次核心操作。",
            threshold: "操作完成后显示成功反馈，并且结果与用户预期一致。"
          },
          {
            id: "AC-3",
            layer: "operator",
            user_story: "作为用户，我能在失败或边界场景看到可理解的提示。",
            measurement: "触发一个失败或边界场景。",
            threshold: "系统显示可理解的失败原因或恢复方式，不要求用户阅读实现日志。"
          }
        ]
      : [
          {
            id: "AC-1",
            layer: "protocol",
            user_story: "As a user, I can open the result from the normal entrypoint and see the current delivery status.",
            measurement: "Open the user-facing entrypoint and review the result status.",
            threshold: "The page or report shows the target result, current state, and whether it is acceptable."
          },
          {
            id: "AC-2",
            layer: "operator",
            user_story: "As a user, I can perform the core operation and see success feedback.",
            measurement: "Run the core operation through the intended user path.",
            threshold: "The operation completes with success feedback and a result that matches the user expectation."
          },
          {
            id: "AC-3",
            layer: "operator",
            user_story: "As a user, I can understand failure or boundary feedback.",
            measurement: "Trigger one failure or boundary scenario.",
            threshold: "The system shows an understandable reason or recovery path without requiring implementation logs."
          }
        ])
  };
}

export function writeBriefFile(root, goal, options = {}) {
  const dir = path.join(root, ".opennori-test-briefs");
  fs.mkdirSync(dir, { recursive: true });
  const brief = skillBrief(goal, options);
  const filename = `${brief.goal_id || goal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brief"}.json`;
  const briefPath = path.join(dir, filename);
  fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));
  return briefPath;
}

export function draftArgsFromGoal(root, goal, options = {}) {
  const briefPath = writeBriefFile(root, goal, options);
  const args = ["--brief", briefPath, "--root", root];
  if (options.language) args.push("--language", options.language);
  args.push("--json");
  return args;
}

export function argValue(args, name) {
  const flag = name.startsWith("--") ? name : `--${name}`;
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

export function readGoalPayloadFromPaths(acceptancePath, evidencePath) {
  const goalDir = path.dirname(acceptancePath);
  return {
    contract: JSON.parse(fs.readFileSync(path.join(goalDir, "contract.json"), "utf8")),
    ledger: JSON.parse(fs.readFileSync(evidencePath, "utf8"))
  };
}

export function draftAndApprove(args, options = {}) {
  const rootFromArgs = options.root || argValue(args, "root");
  const goal = argValue(args, "goal");
  const goalId = argValue(args, "goal-id");
  const language = argValue(args, "language");
  if (goal) {
    if (!rootFromArgs) {
      throw new Error("draftAndApprove requires --root when using --goal");
    }
    args = draftArgsFromGoal(rootFromArgs, goal, { goalId, language });
  }
  const draft = run(["draft", ...args]);
  const root = options.root || argValue(args, "root");
  if (!root) {
    throw new Error("draftAndApprove requires --root or options.root");
  }
  const approved = run([
    "approve",
    "--root", root,
    "--goal", draft.data.goal_id,
    "--summary", options.summary || "User approved criteria.",
    "--json"
  ]);
  return {
    ...approved,
    draft,
    data: {
      ...draft.data,
      ...approved.data,
      criteria: draft.data.criteria
    }
  };
}

export function recordArchitectureRequirement(root, goalId, status, reason, extra = []) {
  return run([
    "architecture", "requirement",
    "--root", root,
    "--goal-id", goalId,
    "--status", status,
    "--reason", reason,
    ...extra,
    "--json"
  ]);
}

export function runInteractiveSetup(root, answer) {
  const script = `
import { main } from ${JSON.stringify(CLI_MODULE)};
Object.defineProperty(process.stdin, "isTTY", { value: true });
Object.defineProperty(process.stdout, "isTTY", { value: true });
queueMicrotask(() => process.stdin.emit("data", ${JSON.stringify(`${answer}\n`)}));
await main(["setup", "--root", ${JSON.stringify(root)}]);
`;
  return spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: ROOT,
    encoding: "utf8"
  });
}

export function spawnJson(args, options = {}) {
  const child = spawn(process.execPath, [options.cli || CLI, ...args], {
    cwd: options.cwd || ROOT,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += String(chunk);
  });
  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });
  return {
    child,
    done: new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("close", (code) => {
        if (code !== (options.status ?? 0)) {
          reject(new Error(stderr || stdout || `Process exited with ${code}`));
          return;
        }
        resolve(JSON.parse(stdout));
      });
    })
  };
}
