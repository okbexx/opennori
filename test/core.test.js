import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "vitest";
import { buildContractFromBrief, buildEvidenceLedger, renderAcceptanceMarkdown, validateContract } from "../src/core.ts";
import { validateSchema } from "../src/validation.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const CLI = path.join(ROOT, "bin", "opennori.js");
const CLI_MODULE = pathToFileURL(path.join(ROOT, "dist", "src", "cli.js")).href;
const PACKAGE_VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;

function run(args, options = {}) {
  const result = spawnSync(process.execPath, [options.cli || CLI, ...args], {
    cwd: options.cwd || ROOT,
    encoding: "utf8"
  });
  if (result.status !== (options.status ?? 0)) {
    throw new Error(result.stderr || result.stdout);
  }
  return JSON.parse(result.stdout);
}

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "nori-test-"));
}

function skillBrief(goal, options = {}) {
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

function writeBriefFile(root, goal, options = {}) {
  const dir = path.join(root, ".opennori-test-briefs");
  fs.mkdirSync(dir, { recursive: true });
  const brief = skillBrief(goal, options);
  const filename = `${brief.goal_id || goal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brief"}.json`;
  const briefPath = path.join(dir, filename);
  fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));
  return briefPath;
}

function draftArgsFromGoal(root, goal, options = {}) {
  const briefPath = writeBriefFile(root, goal, options);
  const args = ["--brief", briefPath, "--root", root];
  if (options.language) args.push("--language", options.language);
  args.push("--json");
  return args;
}

function argValue(args, name) {
  const flag = name.startsWith("--") ? name : `--${name}`;
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

function draftAndApprove(args, options = {}) {
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

function recordArchitectureRequirement(root, goalId, status, reason, extra = []) {
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

function runInteractiveSetup(root, answer) {
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

function spawnJson(args, options = {}) {
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

test("command help is side-effect free", () => {
  const root = tempRoot();
  const payload = run(["install", "--help", "--root", root]);

  assert.equal(payload.ok, true);
  assert.equal(payload.data.side_effect, "none");
  assert.match(payload.data.usage, /opennori install/);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);
});

test("published package uses built dist bin while local source bin remains available", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.equal(packageJson.bin.opennori, "bin/opennori.js");
  assert.equal(packageJson.files.includes(".agents/plugins/"), true);
  assert.equal(packageJson.files.includes(".codex-plugin/"), false);
  assert.equal(packageJson.files.includes("skills/"), false);
  assert.equal(packageJson.files.includes("plugins/opennori/"), true);
  assert.equal(packageJson.files.includes("dashboard/"), true);
  assert.equal(packageJson.files.includes("bin/opennori.js"), true);
  assert.equal(packageJson.files.includes("bin/"), false);
  assert.equal(fs.existsSync(path.join(ROOT, "bin", "opennori.js")), true);
  assert.equal(fs.existsSync(path.join(ROOT, "bin", "opennori.ts")), true);
  assert.equal(fs.readFileSync(path.join(ROOT, "bin", "opennori.js"), "utf8").includes("process.features?.typescript"), true);
  assert.equal(fs.readFileSync(path.join(ROOT, "bin", "opennori.ts"), "utf8").includes("../src/cli.ts"), true);
});

test("contract integrity validation stays structural and does not hard-fail subjective process wording", () => {
  const contract = buildContractFromBrief(skillBrief("Ship a contract boundary check"));
  const ledger = buildEvidenceLedger(contract);
  contract.plan = "Agent-private planning is not a Product AC.";
  contract.steps = ["Use a Skill to judge whether this is appropriate."];

  const issues = validateContract(contract, ledger);

  assert.equal(issues.some((issue) => issue.path === "plan"), false);
  assert.equal(issues.some((issue) => issue.path === "steps"), false);
});

test("CLI entrypoint delegates command dispatch to the citty command tree", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const cliSource = fs.readFileSync(path.join(ROOT, "src", "cli.ts"), "utf8");
  const commandTree = fs.readFileSync(path.join(ROOT, "src", "cli", "command-tree.ts"), "utf8");

  assert.equal(packageJson.dependencies.citty.startsWith("^"), true);
  assert.equal(fs.existsSync(path.join(ROOT, "src", "cli", "routes.ts")), false);
  assert.match(cliSource, /from "\.\/cli\/command-tree\.ts"/);
  assert.match(cliSource, /runCliCommand\(resolved\)/);
  assert.match(commandTree, /defineCommand/);
  assert.match(commandTree, /runCommand/);
  assert.match(commandTree, /subCommands/);
});

test("built dist bin can report package-root Plugin Skill assets", () => {
  const build = spawnSync("npm", ["run", "build"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(build.status, 0, build.stderr || build.stdout);

  const root = tempRoot();
  const payload = run(["install", "--root", root, "--json"], {
    cli: path.join(ROOT, "dist", "bin", "opennori.js")
  });
  assert.equal(payload.data.manifest.plugin.schema_version, "opennori/plugin-v1");
  assert.equal(payload.data.manifest.plugin.name, "opennori");
  assert.equal(payload.data.manifest.plugin.packaged, true);
  assert.equal(payload.data.manifest.plugin.marketplace_packaged, true);
  assert.equal(payload.data.manifest.plugin.marketplace_path, ".agents/plugins/marketplace.json");
  assert.equal(payload.data.manifest.plugin.marketplace_name, "opennori");
  assert.equal(payload.data.manifest.plugin.marketplace_plugin_path, "./plugins/opennori");
  assert.equal(payload.data.manifest.plugin.manifest_path, "plugins/opennori/.codex-plugin/plugin.json");
  assert.equal(payload.data.manifest.plugin.skills_path, "plugins/opennori/skills");
  assert.equal(payload.data.manifest.plugin.skill_count, 11);
  assert.equal(payload.data.manifest.plugin.skills.some((skill) => skill.name === "nori"), true);
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
});

test("built dist bin runs when invoked through a package-manager symlink", () => {
  const build = spawnSync("npm", ["run", "build"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(build.status, 0, build.stderr || build.stdout);

  const root = tempRoot();
  const binDir = path.join(root, "node_modules", ".bin");
  fs.mkdirSync(binDir, { recursive: true });
  const linkedBin = path.join(binDir, "opennori");
  fs.symlinkSync(path.join(ROOT, "dist", "bin", "opennori.js"), linkedBin);

  const result = spawnSync(process.execPath, [linkedBin, "--help"], {
    cwd: root,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.match(payload.data.usage, /opennori/);
});

test("opennori quickstart previews setup without requiring install flags", () => {
  const root = tempRoot();
  const preview = run([], { cwd: root });

  assert.equal(preview.ok, true);
  assert.equal(preview.data.status, "needs_confirm");
  assert.equal(preview.data.setup_plan.schema_version, "opennori/setup-plan-v1");
  assert.equal(preview.data.setup_plan.dry_run, true);
  assert.equal("requested_skill" in preview.data.setup_plan, false);
  assert.equal(preview.data.setup_plan.summary.would_write > 0, true);
  assert.equal(preview.data.setup_plan.summary.will_write, 0);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);

  const confirmed = run(["init", "--root", root, "--confirm", "--json"]);
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.data.status, "installed");
  assert.equal(confirmed.data.install_plan.dry_run, false);
  assert.equal(confirmed.data.install_plan.summary.will_write > 0, true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), true);
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
  assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), false);

  const ready = run([], { cwd: root });
  assert.equal(ready.data.status, "needs_confirm");
  assert.equal(ready.data.setup_plan.actions.some((action) => action.id === "project_state" && action.command_display === "opennori init"), true);
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
});

test("opennori quickstart accepts top-level json for agents", () => {
  const root = tempRoot();
  const preview = run(["--json"], { cwd: root });

  assert.equal(preview.ok, true);
  assert.equal(preview.data.status, "needs_confirm");
  assert.equal(preview.data.setup_plan.schema_version, "opennori/setup-plan-v1");
  assert.equal(preview.data.setup_plan.summary.will_write, 0);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);
});

test("autogoal brief drafts a standard Nori Contract with assumptions and open questions", () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  const briefPath = path.join(root, "autogoal-brief.json");
  fs.writeFileSync(briefPath, JSON.stringify({
    goal_id: "autogoal-delivery-completion",
    goal: "让用户能判断一次 agent 交付是否真的完成，而不是只看到过程总结。",
    presentation: { language: "zh-CN" },
    acceptance_basis: {
      status: "draft",
      summary: "Draft generated by OpenNori autogoal from a rough idea. User approval is still required.",
      source: "autogoal",
      assumptions: [
        "用户希望最终批准的是标准 Nori Contract，而不是 autogoal 专用产物。",
        "目标完整闭环不能被降级成 MVP、第一版或任务列表。"
      ],
      open_questions: [
        "完成报告是否必须覆盖人工确认和工具观察两种证据来源？"
      ]
    },
    criteria: [
      {
        id: "AC-1",
        user_story: "作为用户，我能查看标准 Nori Contract Draft 并判断目标是否表达完整完成闭环。",
        measurement: "用户阅读 draft 的 Goal、验收标准、假设和开放问题。",
        threshold: "draft 是普通 Nori Contract，且没有 Autogoal Contract、MVP、第一版、阶段或任务列表字段。",
        risk: "high"
      }
    ]
  }, null, 2));

  const draft = run(["draft", "--root", root, "--brief", briefPath, "--json"]);
  assert.equal(draft.data.goal_id, "autogoal-delivery-completion");
  assert.equal(draft.data.state, "draft");
  assert.equal(draft.data.acceptance_basis.source, "autogoal");
  assert.equal(draft.data.criteria[0].id, "AC-1");
  assert.match(draft.next_actions.join("\n"), /one-AC-at-a-time AC Review Loop/);
  const acceptance = fs.readFileSync(draft.data.acceptance_path, "utf8");
  assert.match(acceptance, /# autogoal-delivery-completion 验收契约/);
  assert.match(acceptance, /假设:/);
  assert.match(acceptance, /用户希望最终批准的是标准 Nori Contract/);
  assert.match(acceptance, /开放问题:/);
  assert.match(acceptance, /完成报告是否必须覆盖人工确认/);
  assert.doesNotMatch(acceptance, /Implementation Plan|Task List/);
});

test("enhanced autogoal brief exposes reviewable discovery basis without new artifacts", () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  const briefPath = path.join(root, "enhanced-autogoal-brief.json");
  fs.writeFileSync(briefPath, JSON.stringify({
    goal_id: "enhanced-todolist",
    goal: "交付一个完整 todolist，让用户能管理待办并判断它是否可靠。",
    presentation: { language: "zh-CN" },
    acceptance_basis: {
      status: "draft",
      summary: "Draft generated by OpenNori enhanced autogoal from a rough idea.",
      source: "autogoal",
      mode: "enhanced",
      coverage_summary: [
        "任务创建、列表可见性、编辑、完成/取消完成、筛选、空态和错误状态。",
        "非法输入、删除/恢复、刷新持久化、UX 反馈和复查方式。"
      ],
      assumptions: [
        "待办数据至少要在刷新后保持。"
      ],
      open_questions: [
        "due date、tag、priority 是否属于本轮完成定义？"
      ],
      out_of_scope: [
        "多人协作和跨设备同步默认不在范围内，除非用户确认需要。"
      ]
    },
    criteria: [
      {
        id: "AC-1",
        user_story: "作为用户，我能创建一条待办并在列表中看到它。",
        measurement: "打开 todolist，输入标题并提交，再查看列表。",
        threshold: "新待办显示标题、未完成状态和可继续操作入口。",
        risk: "medium"
      }
    ]
  }, null, 2));

  const draft = run(["draft", "--root", root, "--brief", briefPath, "--json"]);
  assert.equal(draft.data.acceptance_basis.source, "autogoal");
  assert.equal(draft.data.acceptance_basis.mode, "enhanced");
  assert.equal(draft.data.acceptance_basis.coverage_summary.length, 2);
  assert.match(draft.next_actions.join("\n"), /Enhanced Discovery checked/);
  assert.match(draft.next_actions.join("\n"), /do not ask the user to approve/);

  const acceptance = fs.readFileSync(draft.data.acceptance_path, "utf8");
  assert.match(acceptance, /来源: autogoal/);
  assert.match(acceptance, /模式: enhanced/);
  assert.match(acceptance, /发现覆盖面:/);
  assert.match(acceptance, /任务创建、列表可见性/);
  assert.match(acceptance, /范围外:/);
  assert.doesNotMatch(acceptance, /Autogoal Contract|Implementation Plan|Task List/);

  const status = run(["status", "--root", root, "--from-draft", "--goal", "enhanced-todolist", "--json"]);
  assert.equal(status.data.acceptance_basis.source, "autogoal");
  assert.equal(status.data.acceptance_basis.mode, "enhanced");
  assert.match(status.data.acceptance_basis.coverage_summary.join("\n"), /刷新持久化/);

  const report = run(["report", "--root", root, "--from-draft", "--goal", "enhanced-todolist", "--json"]);
  const reportText = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(reportText, /Source: autogoal/);
  assert.match(reportText, /Mode: enhanced/);
  assert.match(reportText, /Discovery coverage:/);
  assert.match(reportText, /Out of scope:/);
});

test("conversation adoption brief stays a draft Nori Contract awaiting user approval", () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  const briefPath = path.join(root, "conversation-brief.json");
  fs.writeFileSync(briefPath, JSON.stringify({
    goal_id: "settings-discussion-adoption",
    goal: "交付个人设置页面，让用户能修改资料并判断保存是否可靠。",
    presentation: { language: "zh-CN" },
    acceptance_basis: {
      status: "draft",
      summary: "Draft adopted from an in-progress AC discussion. User approval is still required.",
      source: "conversation",
      assumptions: [
        "用户和 agent 已经讨论过可编辑字段、保存反馈和失败恢复。",
        "当前目标是整理可批准的验收契约，不开始实现。"
      ],
      open_questions: [
        "头像上传失败时是否需要保留本地预览？"
      ]
    },
    criteria: [
      {
        id: "AC-1",
        user_story: "作为用户，我能打开个人设置页并编辑昵称、头像和简介。",
        measurement: "用户在设置页修改昵称、头像和简介后点击保存。",
        threshold: "保存成功后页面显示成功反馈，刷新后仍能看到更新后的值。",
        risk: "medium"
      },
      {
        id: "AC-2",
        user_story: "作为用户，我在保存失败时能理解发生了什么并继续处理自己的输入。",
        measurement: "用户触发保存失败或超时场景。",
        threshold: "页面显示可理解的失败提示，保留用户输入，并提供重试或返回路径。",
        risk: "high"
      }
    ]
  }, null, 2));

  const draft = run(["draft", "--root", root, "--brief", briefPath, "--json"]);
  assert.equal(draft.data.goal_id, "settings-discussion-adoption");
  assert.equal(draft.data.state, "draft");
  assert.equal(draft.data.acceptance_basis.status, "draft");
  assert.equal(draft.data.acceptance_basis.source, "conversation");
  assert.equal(draft.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.match(draft.next_actions.join("\n"), /one-AC-at-a-time AC Review Loop/);
  assert.match(draft.data.acceptance_path, /\.opennori\/drafts\/settings-discussion-adoption\.acceptance\.md$/);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "current", "settings-discussion-adoption.acceptance.md")), false);

  const acceptance = fs.readFileSync(draft.data.acceptance_path, "utf8");
  assert.match(acceptance, /# settings-discussion-adoption 验收契约/);
  assert.match(acceptance, /状态: draft/);
  assert.match(acceptance, /假设:/);
  assert.match(acceptance, /已经讨论过可编辑字段/);
  assert.match(acceptance, /开放问题:/);
  assert.match(acceptance, /头像上传失败/);
  assert.match(acceptance, /保存失败时能理解发生了什么/);
  assert.doesNotMatch(acceptance, /Implementation Plan|Task List|Autogoal Contract/);

  const list = run(["list", "--root", root, "--json"]);
  assert.equal(list.data.current_goals.length, 0);
  assert.equal(list.data.draft_goals.some((goal) => goal.goal_id === "settings-discussion-adoption"), true);
});

test("opennori quickstart is interactive for human terminals", () => {
  const declinedRoot = tempRoot();
  const declined = runInteractiveSetup(declinedRoot, "n");

  assert.equal(declined.status, 0);
  assert.match(declined.stdout, /OpenNori setup/);
  assert.match(declined.stdout, /No project files or user-level Codex\/npm settings have been changed yet/);
  assert.match(declined.stdout, /Install OpenNori capability bundle\? \[y\/N\]/);
  assert.match(declined.stdout, /No changes made/);
  assert.equal(fs.existsSync(path.join(declinedRoot, ".opennori")), false);
});

test("init creates markdown contract and evidence record", () => {
  const root = tempRoot();
  const payload = run(["draft", "--brief", "examples/opennori-self.json", "--root", root, "--json"]);

  assert.equal(payload.ok, true);
  assert.equal(payload.data.goal_id, "opennori-self");
  assert.equal(payload.data.current_gap.id, "AC-P-1");
  assert.equal(fs.existsSync(payload.data.acceptance_path), true);
  assert.equal(fs.existsSync(payload.data.evidence_path), true);

  const acceptance = fs.readFileSync(payload.data.acceptance_path, "utf8");
  assert.equal(payload.data.presentation.language, "zh-CN");
  assert.match(acceptance, /用户验收标准/);
  assert.match(acceptance, /语言: zh-CN/);
  assert.match(acceptance, /\| ID \| Layer \|/);
  assert.match(acceptance, /Codex 对话/);
  assert.doesNotMatch(acceptance, /Step 1/);
});

test("contract language is inferred for new briefs but not silently changed for legacy contracts", () => {
  const zhContract = buildContractFromBrief({
    goal_id: "legacy-language-boundary",
    goal: "交付设置页",
    criteria: [
      {
        id: "AC-1",
        user_story: "作为用户，我能保存设置。",
        measurement: "打开设置页并保存有效字段。",
        threshold: "刷新后仍能看到保存后的值。"
      }
    ]
  });
  assert.equal(zhContract.presentation.language, "zh-CN");
  assert.match(renderAcceptanceMarkdown(zhContract, buildEvidenceLedger(zhContract)), /## 表达偏好/);

  const legacyContract = {
    ...zhContract,
    presentation: undefined
  };
  const legacyMarkdown = renderAcceptanceMarkdown(legacyContract, buildEvidenceLedger(legacyContract));
  assert.match(legacyMarkdown, /## Presentation/);
  assert.match(legacyMarkdown, /Language: en/);
  assert.doesNotMatch(legacyMarkdown, /## 表达偏好/);
});

test("existing contract language changes only through explicit current approval", () => {
  const root = tempRoot();
  run([
    "draft",
    "--brief", writeBriefFile(root, "交付设置页", { goalId: "legacy-current-language", language: "zh-CN" }),
    "--language", "zh-CN",
    "--root", root,
    "--json"
  ]);
  run(["approve", "--root", root, "--summary", "User approved Chinese contract.", "--json"]);

  const evidencePath = path.join(root, ".opennori", "current", "legacy-current-language.evidence.json");
  const acceptancePath = path.join(root, ".opennori", "current", "legacy-current-language.acceptance.md");
  const payload = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  delete payload.contract.presentation;
  fs.writeFileSync(evidencePath, JSON.stringify(payload, null, 2));

  run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--summary", "Evidence writes must not silently translate legacy contracts.",
    "--result", "passing",
    "--confidence", "verified",
    "--basis", "tool-observation",
    "--source-command", "opennori evidence add",
    "--json"
  ]);
  const afterEvidence = fs.readFileSync(acceptancePath, "utf8");
  assert.match(afterEvidence, /## Presentation/);
  assert.match(afterEvidence, /Language: en/);
  assert.doesNotMatch(afterEvidence, /语言: zh-CN/);

  const approvedLanguage = run([
    "approve",
    "--root", root,
    "--no-from-draft",
    "--language", "zh-CN",
    "--summary", "User explicitly approved Chinese presentation.",
    "--json"
  ]);
  assert.equal(approvedLanguage.data.presentation.language, "zh-CN");
  assert.match(fs.readFileSync(acceptancePath, "utf8"), /语言: zh-CN/);
  assert.equal(fs.existsSync(acceptancePath), true);
});

test("next returns the current acceptance gap, not a process step", () => {
  const root = tempRoot();
  const init = run(["draft", "--brief", "examples/opennori-self.json", "--root", root, "--json"]);
  const payload = run([
    "next",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--json"
  ]);

  assert.equal(payload.ok, true);
  assert.equal(payload.data.current_gap.id, "AC-P-1");
  assert.match(payload.data.current_gap.reason, /no user-understandable evidence/);
});

test("resume and status recover the current goal from repository files", () => {
  const root = tempRoot();
  const init = draftAndApprove(["--brief", "examples/opennori-self.json", "--root", root, "--json"]);

  const resume = run(["resume", "--root", root, "--json"]);
  assert.equal(resume.ok, true);
  assert.equal(resume.data.goal_id, "opennori-self");
  assert.equal(resume.data.current_gap.id, "AC-P-1");
  assert.equal(resume.data.completion.complete, false);
  assert.equal(resume.data.next_recommendation.status, "architecture-requirement-required");
  assert.equal(resume.data.agent_next.state, "architecture_requirement_needs_decision");
  assert.equal(resume.data.agent_next.recommended_skill, "nori-architecture-brainstorm");
  assert.equal(resume.data.next_recommendation.focus, "AC-P-1");
  assert.equal(resume.next_actions.some((action) => /required, not_required, or waived/.test(action)), true);

  const requirement = recordArchitectureRequirement(
    root,
    "opennori-self",
    "required",
    "The self goal changes OpenNori protocol, state, and routing behavior."
  );
  assert.equal(requirement.data.agent_next.state, "architecture_needs_review");

  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "OpenNori accepts goals as contracts and reports completion through reviewable evidence.",
    "--goal-id", "opennori-self",
    "--confirm",
    "--json"
  ]);

  const afterBaseline = run(["resume", "--root", root, "--json"]);
  assert.equal(afterBaseline.data.next_recommendation.status, "work-on-current-gap");
  assert.equal(afterBaseline.data.agent_next.state, "work_on_current_gap");
  assert.equal(afterBaseline.data.agent_next.recommended_skill, "nori-architecture-apply");
  assert.match(afterBaseline.data.agent_next.instruction, /Architecture Baseline/);
  assert.equal(afterBaseline.next_actions.some((action) => /AC-P-1/.test(action)), true);

  run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-P-1",
    "--kind", "test-summary",
    "--summary", "Draft acceptance criteria are visible.",
    "--result", "passing",
    "--json"
  ]);

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.current_gap.id, "AC-P-2");
  assert.equal(status.data.intervention.required, false);

  const acceptance = fs.readFileSync(init.data.acceptance_path, "utf8");
  assert.match(acceptance, /AC-P-1 .* passing/);
});

test("draft requires user approval before completion evidence can finish the workflow", () => {
  const root = tempRoot();
  const draft = run(["draft", ...draftArgsFromGoal(root, "Ship an OpenNori-backed task")]);
  assert.equal(draft.data.acceptance_basis.status, "draft");
  assert.equal(draft.data.current_gap.id, "ACCEPTANCE-BASIS");

  const acceptance = fs.readFileSync(draft.data.acceptance_path, "utf8");
  assert.match(acceptance, /## Acceptance Basis/);
  assert.match(acceptance, /Status: draft/);

  const ledger = JSON.parse(fs.readFileSync(draft.data.evidence_path, "utf8"));
  assert.equal(ledger.ledger.status, "draft");
  for (const criterion of Object.keys(ledger.ledger.criteria)) {
    run([
      "evidence", "add",
      "--acceptance", draft.data.acceptance_path,
      "--evidence", draft.data.evidence_path,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} has evidence.`,
      "--result", "passing",
      "--source-command", "opennori status --root . --json",
      "--source-path", ".opennori/reports/draft.report.md",
      "--reviewability", "Run status and inspect the report artifact.",
      "--limitations", "This is a test fixture for approval gating.",
      "--json"
    ]);
  }

  const beforeApprove = run([
    "evaluate",
    "--acceptance", draft.data.acceptance_path,
    "--evidence", draft.data.evidence_path,
    "--json"
  ]);
  assert.equal(beforeApprove.data.workflow_status, "draft");
  assert.equal(beforeApprove.data.current_gap.id, "ACCEPTANCE-BASIS");

  const approved = run(["approve", "--root", root, "--summary", "User approved criteria.", "--json"]);
  assert.equal(approved.data.acceptance_basis.status, "approved");
  assert.equal(approved.data.workflow_status, "complete");
});

test("brainstorm creates selectable acceptance directions, not a process plan", () => {
  const root = tempRoot();
  const candidates = JSON.stringify({
    candidates: [
      {
        id: "A",
        title: "头脑风暴验收入口",
        user_value: "用户能从粗略想法看到可选择的验收方向。",
        suggested_goal_template: "让 OpenNori 支持头脑风暴入口。",
        acceptance_directions: ["作为用户，我能看到候选方向并选择或改写。"],
        risks: ["候选方向仍需转成 NoriBrief 后才能 draft。"]
      }
    ]
  });
  const brainstorm = run([
    "brainstorm",
    "--idea", "我想让 OpenNori 支持头脑风暴",
    "--candidates", candidates,
    "--root", root,
    "--json"
  ]);

  assert.equal(brainstorm.data.status, "draft-source");
  assert.equal(brainstorm.data.is_acceptance_contract, false);
  assert.equal(brainstorm.data.candidates.length, 1);
  assert.equal(brainstorm.data.presentation.language, "zh-CN");
  assert.equal(fs.existsSync(brainstorm.data.brainstorm_path), true);
  assert.equal(fs.existsSync(brainstorm.data.markdown_path), true);

  const text = fs.readFileSync(brainstorm.data.markdown_path, "utf8");
  assert.match(text, /验收方向/);
  assert.match(text, /不是计划、Nori Contract 或完成证据/);
  assert.doesNotMatch(text, /Implementation plan/);
  assert.doesNotMatch(text, /Step 1/);

  const draft = run(["draft", ...draftArgsFromGoal(root, "让 OpenNori 支持头脑风暴入口", {
    language: "zh-CN",
    goalId: "brainstorm-contract"
  })]);
  assert.equal(draft.data.acceptance_basis.status, "draft");
  assert.equal(draft.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(draft.data.criteria.every((criterion) => criterion.user_story.startsWith("作为用户")), true);
});

test("discover writes a non-contract question source before draft", () => {
  const root = tempRoot();
  const questions = JSON.stringify({
    gaps: [
      {
        id: "field-scope",
        question: "哪些字段可以修改，哪些字段只读？",
        why: "用户需要知道设置页的可编辑范围。"
      },
      {
        id: "failure-case",
        question: "保存失败时用户应该看到什么？",
        why: "失败反馈会影响用户判断功能是否完成。"
      }
    ]
  });
  const discovery = run([
    "discover",
    "--goal", "做一个设置页，用户可以修改个人资料，保存后刷新仍然生效，失败时有提示。",
    "--questions", questions,
    "--root", root,
    "--json"
  ]);

  assert.equal(discovery.data.status, "needs-user-answers");
  assert.equal(discovery.data.presentation.language, "zh-CN");
  assert.equal(discovery.data.is_acceptance_contract, false);
  assert.equal(fs.existsSync(discovery.data.discovery_path), true);
  assert.equal(fs.existsSync(discovery.data.markdown_path), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "active")), false);

  assert.equal(discovery.data.gaps.length > 0, true);
  assert.equal(discovery.data.gaps.every((gap) => typeof gap.question === "string" && gap.question.length > 0), true);
  assert.equal(discovery.data.gaps.every((gap) => ["must-answer", "can-default"].includes(gap.priority)), true);

  const text = fs.readFileSync(discovery.data.markdown_path, "utf8");
  assert.match(text, /验收发现/);
  assert.match(text, /不是 Nori Contract、过程计划或完成证据/);
  assert.doesNotMatch(text, /Implementation plan/);
});

test("draft preserves explicit contract language preference for human-readable goal and AC", () => {
  const root = tempRoot();
  const zhDraft = run([
    "draft",
    "--brief", writeBriefFile(root, "Ship a settings page", { language: "zh-CN" }),
    "--language", "zh-CN",
    "--root", root,
    "--json"
  ]);
  assert.equal(zhDraft.data.presentation.language, "zh-CN");
  assert.equal(zhDraft.data.criteria.every((criterion) => criterion.user_story.startsWith("作为用户")), true);
  const zhMarkdown = fs.readFileSync(zhDraft.data.acceptance_path, "utf8");
  assert.match(zhMarkdown, /## 表达偏好/);
  assert.match(zhMarkdown, /语言: zh-CN/);

  const enDraft = run([
    "draft",
    "--brief", writeBriefFile(root, "交付设置页", { language: "en", goalId: "settings-page-en" }),
    "--language", "en",
    "--root", root,
    "--json"
  ]);
  assert.equal(enDraft.data.presentation.language, "en");
  assert.equal(enDraft.data.criteria.every((criterion) => criterion.user_story.startsWith("As a user")), true);
  const enMarkdown = fs.readFileSync(enDraft.data.acceptance_path, "utf8");
  assert.match(enMarkdown, /## Presentation/);
  assert.match(enMarkdown, /Language: en/);
});

test("Skill-prepared brief drafts specific user-facing acceptance criteria", () => {
  const root = tempRoot();
  const briefPath = writeBriefFile(root, "Ship a settings page where users edit profile details", {
    language: "zh-CN",
    goalId: "settings-profile",
    criteria: [
      {
        id: "AC-1",
        layer: "operator",
        user_story: "作为用户，我能从顶部导航打开 Account Settings 并进入 Profile 标签页。",
        measurement: "打开 Account Settings，再进入 Profile 标签页查看资料表单。",
        threshold: "Profile 标签页显示昵称、头像和简介字段，邮箱、手机号和密码显示为只读或不在本轮编辑范围。"
      },
      {
        id: "AC-2",
        layer: "operator",
        user_story: "作为用户，我能按规则编辑昵称、头像和简介。",
        measurement: "输入 2-30 个字符的昵称、最多 160 个字符的简介，并选择不超过 2MB 的 PNG/JPEG 头像。",
        threshold: "合法输入可以提交；不合法昵称、过长简介或错误头像格式会显示可理解的校验提示。"
      },
      {
        id: "AC-3",
        layer: "operator",
        user_story: "作为用户，我保存成功后能立即确认资料已更新。",
        measurement: "修改昵称、头像和简介后点击保存。",
        threshold: "页面显示成功提示，并在 Profile 标签页立即看到更新后的昵称、头像和简介。"
      },
      {
        id: "AC-4",
        layer: "operator",
        user_story: "作为用户，我刷新或重新打开页面后仍能看到保存后的资料。",
        measurement: "保存后刷新页面，或关闭后重新打开 Account Settings 的 Profile 标签页。",
        threshold: "昵称、头像和简介仍然保持保存后的值。"
      },
      {
        id: "AC-5",
        layer: "operator",
        user_story: "作为用户，我在网络失败时能看到失败提示且输入不丢失。",
        measurement: "模拟保存请求失败后点击保存。",
        threshold: "页面显示网络错误提示，保留表单中的用户输入，不覆盖旧资料。"
      },
      {
        id: "AC-6",
        layer: "protocol",
        user_story: "作为评审者，我能用浏览器证据复查设置页是否完成。",
        measurement: "执行成功保存、刷新持久化和网络失败场景，并保存截图或报告。",
        threshold: "证据能说明入口、字段范围、规则、成功反馈、持久化、失败恢复和未覆盖范围。"
      }
    ]
  });

  const draft = run([
    "draft",
    "--brief", briefPath,
    "--root", root,
    "--language", "zh-CN",
    "--json"
  ]);

  assert.equal(draft.data.acceptance_basis.status, "draft");
  assert.equal(draft.data.presentation.language, "zh-CN");
  assert.match(draft.data.acceptance_basis.summary, /Skill-prepared acceptance brief/);
  assert.equal(draft.data.criteria.length, 6);
  const joined = draft.data.criteria.map((criterion) => `${criterion.user_story}\n${criterion.measurement}\n${criterion.threshold}`).join("\n");
  assert.match(joined, /Account Settings/);
  assert.match(joined, /Profile/);
  assert.match(joined, /昵称、头像和简介/);
  assert.match(joined, /邮箱、手机号和密码显示为只读或不在本轮编辑范围/);
  assert.match(joined, /2-30 个字符/);
  assert.match(joined, /PNG\/JPEG/);
  assert.match(joined, /刷新页面/);
  assert.match(joined, /网络失败/);
  assert.match(joined, /保留表单中的用户输入/);
});

test("Nori Profile records required skills and blocks completion until satisfied", () => {
  const root = tempRoot();
  const init = draftAndApprove([
    "--goal", "Build a frontend page",
    "--root", root,
    "--json"
  ], { summary: "User approved frontend acceptance criteria." });
  const ledger = JSON.parse(fs.readFileSync(init.data.evidence_path, "utf8"));

  for (const criterion of Object.keys(ledger.ledger.criteria)) {
    run([
      "evidence", "add",
      "--root", root,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} is satisfied.`,
      "--result", "passing",
      "--json"
    ]);
  }

  const must = run([
    "profile", "add",
    "--root", root,
    "--type", "skill",
    "--name", "design-taste-frontend",
    "--strength", "must",
    "--purpose", "Generate design read and global theme tokens before implementation.",
    "--scope", "landing pages, portfolios, and redesigns",
    "--install-policy", "existing_only",
    "--json"
  ]);
  assert.equal(must.data.workflow_status, "blocked");
  assert.equal(must.data.current_gap.id, "PROFILE-skill-design-taste-frontend");

  const prefer = run([
    "profile", "add",
    "--root", root,
    "--type", "stack",
    "--name", "radix-ui",
    "--strength", "prefer",
    "--purpose", "Use accessible primitives for custom components.",
    "--install-policy", "ask_before_install",
    "--json"
  ]);
  assert.equal(prefer.data.compliance.statuses.some((item) => item.name === "radix-ui" && item.strength === "prefer"), true);

  const afterEvidence = run([
    "profile", "evidence",
    "--root", root,
    "--item", "skill-design-taste-frontend",
    "--result", "satisfied",
    "--summary", "Agent used design-taste-frontend for the design read and theme token pass.",
    "--path", "/Users/jarl/.agents/skills/design-taste-frontend/SKILL.md",
    "--json"
  ]);
  assert.equal(afterEvidence.data.workflow_status, "complete");

  const report = run(["report", "--root", root, "--json"]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(text, /Nori Profile/);
  assert.match(text, /design-taste-frontend/);
  assert.match(text, /radix-ui/);
});

test("preferred profile items create review risk without blocking objective completion", () => {
  const root = tempRoot();
  const init = draftAndApprove([
    "--goal", "Build a frontend page",
    "--root", root,
    "--json"
  ], { summary: "User approved frontend acceptance criteria." });
  const payload = JSON.parse(fs.readFileSync(init.data.evidence_path, "utf8"));

  for (const criterion of Object.keys(payload.ledger.criteria)) {
    run([
      "evidence", "add",
      "--root", root,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} is satisfied.`,
      "--result", "passing",
      "--source-command", "npm test",
      "--reviewability", "Run npm test and inspect the completed UI.",
      "--limitations", "Profile preference still needs review.",
      "--json"
    ]);
  }

  const preferred = run([
    "profile", "add",
    "--root", root,
    "--type", "stack",
    "--name", "radix-ui",
    "--strength", "prefer",
    "--purpose", "Use accessible primitives for custom components.",
    "--install-policy", "ask_before_install",
    "--json"
  ]);
  assert.equal(preferred.data.workflow_status, "complete");
  assert.equal(preferred.data.current_gap, null);
  assert.equal(preferred.data.compliance.review.some((item) => item.name === "radix-ui" && item.status === "unknown"), true);

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.completion.objective_complete, true);
  assert.equal(status.data.completion.confidence, "review-risk");
  assert.equal(status.data.completion.review_risks.includes("profile_review"), true);
  assert.equal(status.data.next_recommendation.status, "completion-review-required");

  const check = run(["check", "--root", root, "--json"]);
  assert.equal(check.ok, true);
  assert.equal(check.data.capability_compliance.review.some((item) => item.name === "radix-ui"), true);
  assert.equal(check.warnings.some((warning) => warning.type === "profile_review" && warning.item_id === "stack-radix-ui"), true);

  const report = run(["report", "--root", root, "--json"]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(text, /Review risks: profile_review/);
  assert.match(text, /Profile review risks:/);
  assert.match(text, /radix-ui is unknown \(prefer\)/);
});

test("evidence can drive the workflow to complete and render a human report", () => {
  const root = tempRoot();
  const init = draftAndApprove(["--brief", "examples/opennori-self.json", "--root", root, "--json"]);
  run(["install", "--root", root, "--json"]);
  const ledger = JSON.parse(fs.readFileSync(init.data.evidence_path, "utf8"));

  for (const criterion of Object.keys(ledger.ledger.criteria)) {
    run([
      "evidence", "add",
      "--acceptance", init.data.acceptance_path,
      "--evidence", init.data.evidence_path,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} has user-understandable evidence.`,
      "--result", "passing",
      "--source-command", "opennori status --root . --json",
      "--source-path", ".opennori/reports/opennori-self.report.md",
      "--reviewability", "Run status and inspect the report artifact.",
      "--limitations", "This is a test fixture for report rendering.",
      "--json"
    ]);
  }

  const evaluated = run([
    "evaluate",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--json"
  ]);
  assert.equal(evaluated.data.workflow_status, "complete");

  recordArchitectureRequirement(
    root,
    ledger.contract.goal_id,
    "required",
    "This report rendering fixture verifies a confirmed architecture section."
  );
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", ledger.contract.goal,
    "--goal-id", ledger.contract.goal_id,
    "--confirm",
    "--json"
  ]);

  const report = run([
    "report",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--root", root,
    "--json"
  ]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.equal(report.data.workflow_status, "complete");
  assert.equal(report.data.current_gap, null);
  assert.equal(report.data.completion.complete, true);
  assert.equal(report.data.completion.confidence, "confident");
  assert.equal(report.data.completion.review_risks.length, 0);
  assert.equal(report.data.intervention.required, false);
  assert.equal(report.data.evidence_health.status, "clear");
  assert.ok(report.data.architecture);
  assert.equal(report.data.architecture.decision, "valid");
  assert.equal(report.data.agent_next.state, "ready_for_next_loop");
  assert.equal(report.data.agent_next.candidate_goals, undefined);
  assert.match(text, /## Decision Summary/);
  assert.ok(text.indexOf("## Decision Summary") < text.indexOf("## Acceptance Status"));
  assert.match(text, /Completion: Complete: all required acceptance criteria have passing or waived evidence\./);
  assert.match(text, /Current gap: None\. All required acceptance criteria/);
  assert.match(text, /User intervention: No user intervention is currently required\./);
  assert.match(text, /Recommended next action: This OpenNori goal is complete/);
  assert.doesNotMatch(text, /## Candidate Next Goals/);
  assert.doesNotMatch(text, /Draft command: opennori draft --from-next-candidate/);
  assert.match(text, /prepare the next human-facing NoriBrief/);
  assert.match(text, /Current status: complete/);
  assert.match(text, /AC-Z-5/);
  assert.match(text, /None\. All required acceptance criteria/);
  assert.doesNotMatch(text, /Implementation plan/);

  const resume = run([
    "resume",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--json"
  ]);
  assert.equal(resume.data.next_recommendation.status, "ready-for-next-loop");
  assert.equal(resume.data.agent_next.state, "ready_for_next_loop");
  assert.equal(resume.data.agent_next.recommended_skill, "nori-acceptance");
  assert.equal(resume.data.agent_next.candidate_goals, undefined);
  assert.equal(resume.data.next_recommendation.candidate_goals, undefined);
  assert.match(resume.data.agent_next.instruction, /prepare the next human-facing NoriBrief/);
  assert.match(resume.data.next_recommendation.actions.join("\n"), /opennori draft --brief/);
  assert.equal(resume.data.evidence_health.status, "clear");
  assert.equal(resume.next_actions.some((action) => /candidate_goals/.test(action)), false);

  const next = run([
    "next",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--root", root,
    "--json"
  ]);
  assert.equal(next.data.next_recommendation.status, "ready-for-next-loop");
  assert.equal(next.data.next_recommendation.candidate_goals, undefined);

  const exported = run([
    "context", "export",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--root", root,
    "--json"
  ]);
  assert.equal(exported.data.next_recommendation.status, "ready-for-next-loop");
  assert.equal(exported.data.agent_next.state, "ready_for_next_loop");
  assert.equal(exported.data.agent_next.candidate_goals, undefined);
  assert.equal(exported.data.next_recommendation.candidate_goals, undefined);
});

test("blocked criteria produce a concrete intervention answer", () => {
  const root = tempRoot();
  draftAndApprove(["--brief", "examples/opennori-self.json", "--root", root, "--json"]);

  const blocked = run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-O-5",
    "--kind", "human-confirmation",
    "--summary", "Choose whether OpenNori should pause or continue without external credentials.",
    "--result", "blocked",
    "--json"
  ]);
  assert.equal(blocked.data.workflow_status, "blocked");

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.intervention.required, true);
  assert.equal(status.data.intervention.criterion, "AC-O-5");
  assert.match(status.data.intervention.action, /Choose whether OpenNori should pause/);
});

test("high-risk agent observation stays objective passing but surfaces review risk", () => {
  const root = tempRoot();
  const init = run(["draft", "--brief", "examples/opennori-self.json", "--root", root, "--json"]);
  recordArchitectureRequirement(
    root,
    init.data.goal_id,
    "not_required",
    "This fixture isolates evidence risk gating and does not evaluate architecture."
  );

  const weak = run([
    "evidence", "add",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--criterion", "AC-P-4",
    "--kind", "agent-summary",
    "--summary", "Agent says recovery works.",
    "--result", "passing",
    "--json"
  ]);

  assert.equal(weak.data.criterion_status, "passing");
  assert.equal(weak.data.confidence, "review-required");
  assert.equal(weak.data.gate, "accepted");
  assert.equal(weak.data.workflow_status, "active");
  assert.notEqual(weak.data.current_gap.id, "AC-P-4");

  const health = run([
    "check",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--root", root,
    "--json"
  ]);
  assert.equal(health.data.evidence_health.status, "review");
  assert.equal(health.warnings.some((warning) => warning.type === "evidence_health" && warning.issue === "high-risk-agent-observation"), true);

  const strong = run([
    "evidence", "add",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--criterion", "AC-P-4",
    "--kind", "review-result",
    "--summary", "Reviewer verified recovery from repository files.",
    "--result", "passing",
    "--confidence", "verified",
    "--json"
  ]);

  assert.equal(strong.data.criterion_status, "passing");
  assert.equal(strong.data.confidence, "verified");
  assert.equal(strong.data.gate, "accepted");

  const flexibleStrong = run([
    "evidence", "add",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--criterion", "AC-P-4",
    "--kind", "dogfood-doctor",
    "--basis", "tool-observation",
    "--summary", "Reviewer can rerun doctor and inspect the report artifact.",
    "--source-command", "opennori doctor --root . --json",
    "--source-path", ".opennori/reports/opennori-self.report.md",
    "--result", "passing",
    "--confidence", "verified",
    "--json"
  ]);

  assert.equal(flexibleStrong.data.criterion_status, "passing");
  assert.equal(flexibleStrong.data.confidence, "verified");
  assert.equal(flexibleStrong.data.gate, "accepted");
});

test("evidence records flexible reviewable sources without fixed adapters", () => {
  const root = tempRoot();
  run(["draft", ...draftArgsFromGoal(root, "Ship a reviewable OpenNori task")]);
  run(["approve", "--root", root, "--summary", "User approved criteria.", "--json"]);

  const added = run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--kind", "agent-observation",
    "--basis", "tool-observation",
    "--summary", "The user-visible workflow can be reviewed from a command and an artifact.",
    "--source", "{\"type\":\"command\",\"label\":\"npm run check\",\"command\":\"npm run check\",\"outcome\":\"passed\"}",
    "--source", "screenshots/reviewable-flow.png",
    "--source-command", "npm run check",
    "--source-path", "src/cli.ts",
    "--source-url", "https://example.com/review",
    "--reviewability", "User can rerun the command or open the artifact.",
    "--limitations", "Browser-specific visual review was not performed.",
    "--confidence", "verified",
    "--result", "passing",
    "--json"
  ]);

  assert.equal(added.data.criterion_status, "passing");
  assert.equal(added.data.latest_evidence.basis, "tool-observation");
  assert.equal(added.data.latest_evidence.sources.length, 4);
  assert.equal(added.data.latest_evidence.reviewability, "User can rerun the command or open the artifact.");
  assert.equal(added.data.latest_evidence.limitations, "Browser-specific visual review was not performed.");

  const status = run(["status", "--root", root, "--json"]);
  const criterion = status.data.criteria.find((row) => row.id === "AC-1");
  assert.equal(criterion.latest_evidence.sources[0].command, "npm run check");
  assert.equal(criterion.latest_evidence.sources[1].label, "screenshots/reviewable-flow.png");
  assert.equal(criterion.latest_evidence.sources[2].type, "command");
  assert.equal(criterion.latest_evidence.sources[2].command, "npm run check");
  assert.equal(criterion.latest_evidence.sources[3].type, "url");
  assert.equal(criterion.latest_evidence.sources[3].url, "https://example.com/review");
  assert.equal(criterion.latest_evidence.sources.some((source) => source.path === "src/cli.ts"), false);

  const report = run(["report", "--root", root, "--json"]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(text, /Basis/);
  assert.match(text, /Sources/);
  assert.match(text, /Reviewability/);
  assert.match(text, /Limitations/);
  assert.match(text, /command=npm run check/);
  assert.match(text, /screenshots\/reviewable-flow\.png/);
  assert.match(text, /Browser-specific visual review was not performed/);
});

test("evidence health accepts custom non-context source shapes as reviewable", () => {
  const root = tempRoot();
  draftAndApprove([
    "--brief", writeBriefFile(root, "Ship with custom review sources", {
      criteria: [
        {
          id: "AC-1",
          user_story: "As a user, I can inspect a screenshot-backed result.",
          measurement: "Open the referenced screenshot review source.",
          threshold: "The evidence health report accepts the screenshot source as reviewable.",
          risk: "medium"
        },
        {
          id: "AC-2",
          user_story: "As a user, I can inspect a diff-backed result.",
          measurement: "Open the referenced diff review source.",
          threshold: "The evidence health report accepts the diff source as reviewable.",
          risk: "medium"
        },
        {
          id: "AC-3",
          user_story: "As a user, I can inspect a log-backed result.",
          measurement: "Open the referenced log review source.",
          threshold: "The evidence health report accepts the log source as reviewable.",
          risk: "medium"
        }
      ]
    }),
    "--root", root,
    "--json"
  ], { summary: "User approved custom source shape test." });

  const customSources = [
    ["AC-1", "{\"type\":\"screenshot\",\"label\":\"settings-failure.png\",\"path\":\"https://example.com/settings-failure.png\"}"],
    ["AC-2", "{\"type\":\"diff\",\"label\":\"git diff -- src/settings.tsx\",\"summary\":\"Review the changed settings UI diff.\"}"],
    ["AC-3", "{\"type\":\"log\",\"label\":\"server error log excerpt\",\"summary\":\"Review the failed-save error log excerpt.\"}"]
  ];
  for (const [criterion, source] of customSources) {
    run([
      "evidence", "add",
      "--root", root,
      "--criterion", criterion,
      "--kind", "review-result",
      "--basis", "artifact-review",
      "--summary", `${criterion} has a custom reviewable source.`,
      "--result", "passing",
      "--confidence", "verified",
      "--source", source,
      "--reviewability", "Inspect the custom evidence source.",
      "--limitations", "This fixture checks source shape handling, not business behavior.",
      "--json"
    ]);
  }

  const check = run(["check", "--root", root, "--json"]);
  assert.equal(check.data.evidence_health.status, "clear");
  assert.equal(check.warnings.some((warning) => warning.type === "evidence_health" && warning.issue === "missing-reviewable-source"), false);
});

test("concurrent evidence writes preserve every reviewable record", async () => {
  const root = tempRoot();
  const current = draftAndApprove(draftArgsFromGoal(root, "Ship concurrent evidence safely"));
  const lockPath = path.join(root, ".opennori", ".locks", "active-goal.write.lock");
  fs.mkdirSync(lockPath, { recursive: true });

  const children = Array.from({ length: 4 }, (_, index) => {
    const id = `concurrent-${index + 1}`;
    return spawnJson([
      "evidence", "add",
      "--root", root,
      "--criterion", "AC-1",
      "--kind", "concurrency-check",
      "--basis", "tool-observation",
      "--summary", `Concurrent evidence ${id}`,
      "--source-command", `verify ${id}`,
      "--reviewability", `Review ${id}`,
      "--result", "passing",
      "--confidence", "verified",
      "--json"
    ]);
  });

  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(children.some(({ child }) => child.exitCode !== null), false);
  fs.rmSync(lockPath, { recursive: true, force: true });
  await Promise.all(children.map(({ done }) => done));

  const payload = JSON.parse(fs.readFileSync(current.data.evidence_path, "utf8"));
  const evidence = payload.ledger.criteria["AC-1"].evidence;
  assert.equal(evidence.length, 4);
  assert.deepEqual(
    evidence.map((item) => item.summary).sort(),
    [
      "Concurrent evidence concurrent-1",
      "Concurrent evidence concurrent-2",
      "Concurrent evidence concurrent-3",
      "Concurrent evidence concurrent-4"
    ]
  );
});

test("check surfaces high-risk agent-observation evidence health without forcing adapter taxonomy", () => {
  const weakRoot = tempRoot();
  draftAndApprove([
    "--brief", writeBriefFile(weakRoot, "Ship with weak evidence", {
      criteria: [
        {
          id: "AC-1",
          layer: "operator",
          user_story: "As a user, I can review a high-risk completion claim.",
          measurement: "Open the report and inspect the evidence for the high-risk result.",
          threshold: "The report exposes review risks when the claim is only an agent observation.",
          risk: "high"
        },
        {
          id: "AC-2",
          layer: "operator",
          user_story: "As a user, I can review a supporting command result.",
          measurement: "Run status and inspect the output.",
          threshold: "The output shows reviewable evidence."
        },
        {
          id: "AC-3",
          layer: "operator",
          user_story: "As a user, I can review a supporting report artifact.",
          measurement: "Open the report artifact.",
          threshold: "The artifact explains what was verified."
        }
      ]
    }),
    "--root", weakRoot,
    "--json"
  ], { summary: "User approved evidence health test." });
  run([
    "evidence", "add",
    "--root", weakRoot,
    "--criterion", "AC-1",
    "--kind", "agent-observation",
    "--basis", "agent-observation",
    "--summary", "Agent says AC-1 is complete.",
    "--result", "passing",
    "--json"
  ]);
  for (const criterion of ["AC-2", "AC-3"]) {
    run([
      "evidence", "add",
      "--root", weakRoot,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} has reviewable evidence.`,
      "--result", "passing",
      "--confidence", "verified",
      "--source-command", "opennori status --root . --json",
      "--reviewability", "Run status and inspect the result.",
      "--limitations", "This fixture focuses on evidence health semantics.",
      "--json"
    ]);
  }

  const weakCheck = run(["check", "--root", weakRoot, "--json"]);
  assert.equal(weakCheck.data.evidence_health.status, "review");
  assert.equal(weakCheck.warnings.some((warning) => warning.type === "evidence_health" && warning.issue === "high-risk-agent-observation"), true);
  assert.equal(weakCheck.warnings.some((warning) => warning.type === "evidence_health" && warning.issue === "missing-reviewable-source"), true);
  assert.equal(weakCheck.next_actions.some((action) => /evidence_health/.test(action)), true);

  const report = run(["report", "--root", weakRoot, "--json"]);
  assert.equal(report.data.completion.complete, true);
  assert.equal(report.data.completion.objective_complete, true);
  assert.equal(report.data.completion.confidence, "review-risk");
  assert.equal(report.data.completion.review_risks.includes("evidence_health"), true);
  assert.equal(report.data.evidence_health.status, "review");
  assert.match(fs.readFileSync(report.data.report_path, "utf8"), /## Evidence Health/);

  const strongRoot = tempRoot();
  draftAndApprove([
    "--goal", "Ship with reviewable evidence",
    "--root", strongRoot,
    "--json"
  ], { summary: "User approved evidence health test." });
  run([
    "evidence", "add",
    "--root", strongRoot,
    "--criterion", "AC-1",
    "--kind", "test-summary",
    "--summary", "User-visible status command shows completion and current gap.",
    "--result", "passing",
    "--confidence", "verified",
    "--source-command", "opennori status --root . --json",
    "--source-path", ".opennori/reports/example.report.md",
    "--reviewability", "Run the command and inspect the report artifact.",
    "--limitations", "This does not prove public website deployment.",
    "--json"
  ]);

  const strongCheck = run(["check", "--root", strongRoot, "--json"]);
  assert.equal(strongCheck.data.evidence_health.status, "clear");
  assert.equal(strongCheck.warnings.some((warning) => warning.type === "evidence_health"), false);
});

test("missing local artifact evidence is pruned and does not occupy report or context export", () => {
  const root = tempRoot();
  const current = draftAndApprove(draftArgsFromGoal(root, "Ship without stale evidence"));

  const stalePath = "docs/removed-proof.md";
  const added = run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--kind", "artifact",
    "--summary", "The user-visible operation was proven by an artifact that was later removed.",
    "--source-path", stalePath,
    "--reviewability", "Open the artifact.",
    "--limitations", "Only proves the local artifact existed.",
    "--confidence", "verified",
    "--result", "passing",
    "--json"
  ]);
  assert.equal(added.data.criterion_status, "unknown");
  assert.equal(added.data.latest_evidence, null);

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.workflow_status, "active");
  assert.equal(status.data.current_gap.id, "AC-1");
  const criterion = status.data.criteria.find((row) => row.id === "AC-1");
  assert.equal(criterion.status, "unknown");
  assert.equal(criterion.latest_evidence, null);

  const evidencePath = current.data.evidence_path;
  const payload = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  assert.equal(payload.ledger.criteria["AC-1"].evidence.length, 0);
  assert.equal(payload.ledger.criteria["AC-1"].status, "unknown");

  const exported = run(["context", "export", "--root", root, "--json"]);
  assert.equal(exported.data.criteria.find((row) => row.id === "AC-1").latest_evidence, null);
  assert.equal(JSON.stringify(exported.data).includes(stalePath), false);

  const report = run(["report", "--root", root, "--json"]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.doesNotMatch(text, /docs\/removed-proof\.md/);
  assert.match(text, /AC-1/);
});

test("agent can explicitly prune obsolete evidence before recording fresh proof", () => {
  const root = tempRoot();
  draftAndApprove(draftArgsFromGoal(root, "Refresh obsolete evidence"));

  run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--kind", "review-result",
    "--basis", "tool-observation",
    "--summary", "Old product behavior passed before the acceptance target changed.",
    "--source-command", "npm test",
    "--reviewability", "Rerun the old command.",
    "--limitations", "This evidence is obsolete after the product changed.",
    "--confidence", "verified",
    "--result", "passing",
    "--json"
  ]);

  const pruned = run([
    "evidence", "prune",
    "--root", root,
    "--criterion", "AC-1",
    "--reason", "Old product behavior no longer proves the current AC.",
    "--json"
  ]);
  assert.equal(pruned.data.evidence_prune.removed_records, 1);
  assert.equal(pruned.data.criterion_status, "unknown");
  assert.equal(pruned.data.current_gap.id, "AC-1");

  const report = run(["report", "--root", root, "--json"]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.doesNotMatch(text, /Old product behavior/);

  const exported = run(["context", "export", "--root", root, "--json"]);
  assert.equal(JSON.stringify(exported.data).includes("Old product behavior"), false);
});

test("protocol v1 example contains concrete user tool operations", () => {
  const brief = JSON.parse(fs.readFileSync(path.join(ROOT, "examples", "opennori-self.json"), "utf8"));
  assert.equal(brief.criteria.length, 54);
  assert.deepEqual(new Set(brief.criteria.map((criterion) => criterion.layer)), new Set(["protocol", "operator", "productization", "architecture"]));
  assert.equal(brief.criteria.filter((criterion) => criterion.id.startsWith("AC-P-")).length, 13);
  assert.equal(brief.criteria.filter((criterion) => criterion.id.startsWith("AC-O-")).length, 13);
  assert.equal(brief.criteria.filter((criterion) => criterion.id.startsWith("AC-Z-")).length, 18);
  assert.equal(brief.criteria.filter((criterion) => criterion.id.startsWith("AC-A-")).length, 10);
  const interfaceAcceptanceCriterion = brief.criteria.find((criterion) => criterion.id === "AC-O-11");
  assert.equal(interfaceAcceptanceCriterion?.layer, "operator");
  assert.match(interfaceAcceptanceCriterion?.user_story ?? "", /UI\/UX|可见交互界面/);
  assert.match(interfaceAcceptanceCriterion?.threshold ?? "", /Skill|agent|CLI hard validator/);
  const completeProductCriterion = brief.criteria.find((criterion) => criterion.id === "AC-O-12");
  assert.equal(completeProductCriterion?.layer, "operator");
  assert.match(completeProductCriterion?.user_story ?? "", /完整产品|完整功能闭环|完整 Dashboard/);
  assert.match(completeProductCriterion?.threshold ?? "", /完整验收面|MVP|CLI hard validator/);
  const completeProductCoverageCriterion = brief.criteria.find((criterion) => criterion.id === "AC-O-13");
  assert.equal(completeProductCoverageCriterion?.layer, "operator");
  assert.match(completeProductCoverageCriterion?.user_story ?? "", /覆盖自检|独立 AC/);
  assert.match(completeProductCoverageCriterion?.threshold ?? "", /coverage self-check|拆分|CLI hard validator/);
  const enhancedAutogoalCriterion = brief.criteria.find((criterion) => criterion.id === "AC-O-15");
  assert.equal(enhancedAutogoalCriterion?.layer, "operator");
  assert.match(enhancedAutogoalCriterion?.user_story ?? "", /增强模式|grill/);
  assert.match(enhancedAutogoalCriterion?.threshold ?? "", /Enhanced Discovery|新 CLI|标准 Nori Contract Draft/);
  const acceptanceSurfaceCriterion = brief.criteria.find((criterion) => criterion.id === "AC-O-18");
  assert.equal(acceptanceSurfaceCriterion?.layer, "operator");
  assert.match(acceptanceSurfaceCriterion?.user_story ?? "", /CRUD|可见产品目标/);
  assert.match(acceptanceSurfaceCriterion?.threshold ?? "", /Acceptance Surface Modeling|visible trigger|destructive boundary|CLI hard validator/);

  const expectedTools = [
    "Codex 对话",
    "编辑器或文件浏览器",
    "新的 Codex 会话",
    "Nori Profile",
    ".opennori",
    "OpenNori 报告",
    "Git 或 PR diff",
    "opennori install",
    "opennori uninstall",
    "opennori doctor",
    "Architecture Baseline",
    "build-vs-buy",
    "opennori list",
    "OpenNori Plugin",
    "证据来源",
    "复查",
    "UI/UX",
    "完整验收面",
    "coverage self-check",
    "Enhanced Discovery",
    "Acceptance Surface Modeling",
    "visible trigger",
    "destructive boundary"
  ];

  const joined = JSON.stringify(brief, null, 2);
  for (const tool of expectedTools) {
    assert.match(joined, new RegExp(tool));
  }
});

test("Codex Plugin manifest exposes OpenNori Skills for agent discovery", () => {
  const pluginRoot = path.join(ROOT, "plugins", "opennori");
  const plugin = JSON.parse(fs.readFileSync(path.join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"));
  const marketplace = JSON.parse(fs.readFileSync(path.join(ROOT, ".agents", "plugins", "marketplace.json"), "utf8"));
  assert.equal(plugin.name, "opennori");
  assert.equal(plugin.skills, "./skills/");
  assert.equal(plugin.interface.displayName, "OpenNori");
  assert.equal(plugin.interface.defaultPrompt.length >= 5, true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /Set up OpenNori/.test(prompt)), true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /autogoal/i.test(prompt)), true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /enhanced mode.*self-grill/i.test(prompt)), true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /complete product.*not an MVP/i.test(prompt)), true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /operation paths.*project CRUD/i.test(prompt)), true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /AC we just discussed/i.test(prompt)), true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /acceptance criteria/.test(prompt)), true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /dashboard.*live agent activity/i.test(prompt)), true);
  assert.equal(marketplace.name, "opennori");
  assert.equal(marketplace.interface.displayName, "OpenNori");
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].name, "opennori");
  assert.equal(marketplace.plugins[0].source.source, "local");
  assert.equal(marketplace.plugins[0].source.path, "./plugins/opennori");
  assert.equal(marketplace.plugins[0].policy.installation, "AVAILABLE");
  assert.equal(marketplace.plugins[0].policy.authentication, "ON_INSTALL");

  const names = fs.readdirSync(path.join(pluginRoot, "skills"))
    .filter((name) => fs.existsSync(path.join(pluginRoot, "skills", name, "SKILL.md")))
    .sort();
  assert.deepEqual(names.sort(), [
    "nori",
    "nori-acceptance",
    "nori-architecture-apply",
    "nori-architecture-brainstorm",
    "nori-architecture-challenge",
    "nori-autogoal",
    "nori-build-vs-buy",
    "nori-capability-profile",
    "nori-evidence",
    "nori-project-health",
    "nori-reporting"
  ].sort());

  const noriAsset = fs.readFileSync(path.join(pluginRoot, "skills", "nori", "SKILL.md"), "utf8");
  assert.match(noriAsset, /^---\nname: nori\n/m);
  assert.match(noriAsset, /nori-autogoal/);
  assert.match(noriAsset, /nori-acceptance/);
  assert.match(noriAsset, /nori-evidence/);
  assert.match(noriAsset, /nori-capability-profile/);
  assert.match(noriAsset, /nori-architecture-brainstorm/);
  assert.match(noriAsset, /nori-architecture-apply/);
  assert.match(noriAsset, /nori-build-vs-buy/);
  assert.match(noriAsset, /opennori resume/);
  assert.match(noriAsset, /opennori status/);
  assert.match(noriAsset, /already stated goal/);
  assert.match(noriAsset, /AC we just discussed/);
  assert.match(noriAsset, /acceptance_basis\.source: "conversation"/);
  assert.match(noriAsset, /complete product/);
  assert.match(noriAsset, /full acceptance surface/);
  assert.match(noriAsset, /coverage map|coverage review/);
  assert.match(noriAsset, /UI\/UX|visible interface/i);
  assert.match(noriAsset, /one-AC-at-a-time AC Review Loop/);
  assert.match(noriAsset, /Enhanced Discovery/);
  assert.match(noriAsset, /self-expands scenarios/);
  assert.match(noriAsset, /Acceptance Surface Modeling/);
  assert.match(noriAsset, /visible trigger/);
  assert.match(noriAsset, /destructive boundary/);
  assert.match(noriAsset, /measurement and threshold/);
  assert.match(noriAsset, /coverage notes mention\s+Acceptance Surface Modeling/);
  assert.match(noriAsset, /project CRUD works|settings are editable/);
  assert.match(noriAsset, /add AC-14/);
  assert.match(noriAsset, /criterion add --from-draft/);
  assert.match(noriAsset, /Do not patch draft acceptance\/evidence files manually/);
  assert.match(noriAsset, /blind approval/);
  assert.match(noriAsset, /actual page, route, command, object, field, state/);
  assert.match(noriAsset, /concrete objects, fields, states, boundaries/);
  assert.match(noriAsset, /every AC has been confirmed one by one/);
  assert.doesNotMatch(noriAsset, /skill export/);
  assert.doesNotMatch(noriAsset, /process steps/);

  const acceptanceAsset = fs.readFileSync(path.join(pluginRoot, "skills", "nori-acceptance", "SKILL.md"), "utf8");
  assert.match(acceptanceAsset, /nori-autogoal/);
  assert.match(acceptanceAsset, /already stated a goal/);
  assert.match(acceptanceAsset, /ask for the goal only when it is missing/);
  assert.match(acceptanceAsset, /ACCEPTANCE-BASIS/);
  assert.match(acceptanceAsset, /AC quality is a Skill responsibility/);
  assert.match(acceptanceAsset, /scratch question source/);
  assert.match(acceptanceAsset, /do not treat its gap ids or wording as\s+authoritative/);
  assert.match(acceptanceAsset, /source: "conversation"/);
  assert.match(acceptanceAsset, /opennori draft --brief/);
  assert.match(acceptanceAsset, /Do not route an already discussed AC set through autogoal/);
  assert.match(acceptanceAsset, /compact 3-5 item AC set/);
  assert.match(acceptanceAsset, /full acceptance surface/);
  assert.match(acceptanceAsset, /coverage map|coverage review/);
  assert.match(acceptanceAsset, /bundles unrelated surfaces/);
  assert.match(acceptanceAsset, /Visible interface experience/);
  assert.match(acceptanceAsset, /Acceptance Surface Model/);
  assert.match(acceptanceAsset, /visible trigger/);
  assert.match(acceptanceAsset, /interaction surface/);
  assert.match(acceptanceAsset, /persistence/);
  assert.match(acceptanceAsset, /destructive boundary/);
  assert.match(acceptanceAsset, /user_story.*measurement.*threshold/s);
  assert.match(acceptanceAsset, /The model must land in the draft criteria/);
  assert.match(acceptanceAsset, /operation path is missing from the criterion text/);
  assert.match(acceptanceAsset, /more specific than the criterion text/);
  assert.match(acceptanceAsset, /project CRUD/);
  assert.match(acceptanceAsset, /AC Review Loop/);
  assert.match(acceptanceAsset, /confirm AC-1/);
  assert.match(acceptanceAsset, /revise AC-1/);
  assert.match(acceptanceAsset, /add AC-14/);
  assert.match(acceptanceAsset, /criterion add --from-draft/);
  assert.match(acceptanceAsset, /not `apply_patch` or manual JSON\/Markdown edits/);
  assert.match(acceptanceAsset, /User enters|用户入口/);
  assert.match(acceptanceAsset, /Evidence I would use|我会使用的证据类型/);
  assert.match(acceptanceAsset, /Do not ask for blind approval/);
  assert.match(acceptanceAsset, /Do not use `apply_patch` to add a missing AC to a draft/);
  assert.match(acceptanceAsset, /If the explanation could be copied unchanged\s+to another AC/);
  assert.match(acceptanceAsset, /Do not dump all AC interpretations/);
  assert.match(acceptanceAsset, /actual page/);
  assert.match(acceptanceAsset, /object\/field\/state\/message\/failure\/evidence/);
  assert.match(acceptanceAsset, /exact screen, route, menu, command, or object list/);
  assert.match(acceptanceAsset, /description: .*Acceptance Surface Modeling.*operation paths/i);

  const evidenceAsset = fs.readFileSync(path.join(pluginRoot, "skills", "nori-evidence", "SKILL.md"), "utf8");
  assert.match(evidenceAsset, /Do not force evidence into a fixed adapter taxonomy/);
  assert.match(evidenceAsset, /basis, sources, reviewability, confidence, and limitations/);
  assert.match(evidenceAsset, /Acceptance Surface Model|modeled user\s+operation path/);
  assert.match(evidenceAsset, /visible trigger/);
  assert.match(evidenceAsset, /persistence/);
  assert.match(evidenceAsset, /destructive boundary/);
  assert.match(evidenceAsset, /criterion's `measurement` and\s+`threshold`/);
  assert.match(evidenceAsset, /coverage-summary prose/);
  assert.match(evidenceAsset, /nori-acceptance/);
  assert.match(evidenceAsset, /description: .*modeled user operation path/i);

  const autogoalAsset = fs.readFileSync(path.join(pluginRoot, "skills", "nori-autogoal", "SKILL.md"), "utf8");
  assert.match(autogoalAsset, /^---\nname: nori-autogoal\n/m);
  assert.match(autogoalAsset, /description: .*enhanced autogoal.*self-grill/i);
  assert.match(autogoalAsset, /description: .*operation paths/i);
  assert.match(autogoalAsset, /standard Nori Contract Draft/);
  assert.match(autogoalAsset, /opennori draft --brief/);
  assert.match(autogoalAsset, /Do not create a new "Autogoal Contract" format/);
  assert.match(autogoalAsset, /MVP, first version, prototype/);
  assert.match(autogoalAsset, /conversation adoption/);
  assert.match(autogoalAsset, /nori-acceptance/);
  assert.match(autogoalAsset, /small\s+starter contract/);
  assert.match(autogoalAsset, /full acceptance surface/);
  assert.match(autogoalAsset, /coverage self-check/);
  assert.match(autogoalAsset, /Enhanced Discovery/);
  assert.match(autogoalAsset, /Acceptance Surface Model/);
  assert.match(autogoalAsset, /visible trigger/);
  assert.match(autogoalAsset, /interaction surface/);
  assert.match(autogoalAsset, /destructive boundary/);
  assert.match(autogoalAsset, /The Acceptance Surface Model must shape the draft AC text itself/);
  assert.match(autogoalAsset, /`user_story`.*`measurement`.*`threshold`/s);
  assert.match(autogoalAsset, /leave the missing\s+operation path only in private reasoning/);
  assert.match(autogoalAsset, /project CRUD/);
  assert.match(autogoalAsset, /self-grill/);
  assert.match(autogoalAsset, /todolist/);
  assert.match(autogoalAsset, /standard Nori Contract Draft/);
  assert.match(autogoalAsset, /new CLI command/);
  assert.match(autogoalAsset, /independent user judgment/);
  assert.match(autogoalAsset, /visible interface goals/);
  assert.match(autogoalAsset, /AC Review Loop/);
  assert.match(autogoalAsset, /confirm AC-1/);
  assert.match(autogoalAsset, /blind approval/);
  assert.match(autogoalAsset, /If the same text\s+could be copied to another AC/);
  assert.match(autogoalAsset, /actual page, route, command, object, field/);

  const reportingAsset = fs.readFileSync(path.join(pluginRoot, "skills", "nori-reporting", "SKILL.md"), "utf8");
  assert.match(reportingAsset, /description: .*operation paths/i);
  assert.match(reportingAsset, /Acceptance Surface Model/);
  assert.match(reportingAsset, /objectively evidenced, not confidently acceptable yet/);
  assert.match(reportingAsset, /visible trigger/);
  assert.match(reportingAsset, /persistence/);
  assert.match(reportingAsset, /destructive boundary/);
  assert.match(reportingAsset, /Coverage notes alone are not enough/);
  assert.match(reportingAsset, /criterion's\s+measurement and threshold/);

  const healthAsset = fs.readFileSync(path.join(pluginRoot, "skills", "nori-project-health", "SKILL.md"), "utf8");
  assert.match(healthAsset, /description: .*healthy state.*acceptance review/i);
  assert.match(healthAsset, /safe_next_command/);
  assert.match(healthAsset, /Do not paste raw doctor\/setup\/init JSON to the user/);
  assert.match(healthAsset, /Confirm initialization/);
  assert.match(healthAsset, /Acceptance Surface Modeling/);
  assert.match(healthAsset, /ready state as bundle health only|Ready means the bundle\/state is usable/);
  assert.match(healthAsset, /nori-acceptance/);

  const architectureBrainstormAsset = fs.readFileSync(path.join(pluginRoot, "skills", "nori-architecture-brainstorm", "SKILL.md"), "utf8");
  assert.match(architectureBrainstormAsset, /description: .*architecture.*UI\/CRUD\/dashboard.*operation paths/i);
  assert.match(architectureBrainstormAsset, /Acceptance Surface Model/);
  assert.match(architectureBrainstormAsset, /before\s+previewing or confirming an Architecture Baseline/);
  assert.match(architectureBrainstormAsset, /button\/icon\/menu\/modal\/field\/delete semantics|button vs icon/);
  assert.match(architectureBrainstormAsset, /nori-acceptance/);

  const architectureApplyAsset = fs.readFileSync(path.join(pluginRoot, "skills", "nori-architecture-apply", "SKILL.md"), "utf8");
  assert.match(architectureApplyAsset, /description: .*UI\/CRUD\/dashboard.*operation paths/i);
  assert.match(architectureApplyAsset, /Acceptance Surface Modeling/);
  assert.match(architectureApplyAsset, /before implementing or recording architecture apply/);
  assert.match(architectureApplyAsset, /visible trigger/);
  assert.match(architectureApplyAsset, /destructive boundary/);
  assert.match(architectureApplyAsset, /nori-acceptance/);

  const architectureChallengeAsset = fs.readFileSync(path.join(pluginRoot, "skills", "nori-architecture-challenge", "SKILL.md"), "utf8");
  assert.match(architectureChallengeAsset, /description: .*architecture drift.*operation-path detail/i);
  assert.match(architectureChallengeAsset, /missing Product AC|missing AC detail/);
  assert.match(architectureChallengeAsset, /button vs icon|directory picker/);
  assert.match(architectureChallengeAsset, /nori-acceptance/);

  const buildVsBuyAsset = fs.readFileSync(path.join(pluginRoot, "skills", "nori-build-vs-buy", "SKILL.md"), "utf8");
  assert.match(buildVsBuyAsset, /description: .*UI\/CRUD\/dashboard.*operation paths/i);
  assert.match(buildVsBuyAsset, /Build-vs-buy cannot define what the user accepts/);
  assert.match(buildVsBuyAsset, /library choice/);
  assert.match(buildVsBuyAsset, /destructive boundaries|destructive boundary/);
  assert.match(buildVsBuyAsset, /nori-acceptance/);

  const capabilityProfileAsset = fs.readFileSync(path.join(pluginRoot, "skills", "nori-capability-profile", "SKILL.md"), "utf8");
  assert.match(capabilityProfileAsset, /description: .*stack preferences.*Product AC operation paths/i);
  assert.match(capabilityProfileAsset, /Profile items also cannot replace Acceptance Surface Modeling/);
  assert.match(capabilityProfileAsset, /Stack preference is not enough/);
  assert.match(capabilityProfileAsset, /visible trigger/);
  assert.match(capabilityProfileAsset, /destructive boundary/);
  assert.match(capabilityProfileAsset, /nori-acceptance/);

  const behaviorProtocolSections = [
    "## Mission",
    "## Start Here",
    "## Natural-Language Mapping",
    "## State Writes",
    "## Handoffs",
    "## User Reply Shape",
    "## Misuse Guards"
  ];
  for (const name of names) {
    const asset = fs.readFileSync(path.join(pluginRoot, "skills", name, "SKILL.md"), "utf8");
    assert.match(asset, /^---\nname: /);
    assert.match(asset, /\ndescription: /);
    for (const section of behaviorProtocolSections) {
      assert.match(asset, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.match(asset, /natural-language|Natural-Language|natural language/);
    assert.match(asset, /state/i);
    assert.match(asset, /handoff|hand off/i);
    assert.doesNotMatch(asset, /install --skill/);
    assert.doesNotMatch(asset, /refresh-skill/);
    assert.doesNotMatch(asset, /skill export/);
  }
});

test("public product surfaces present OpenNori as one capability bundle", () => {
  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
  const plugin = JSON.parse(fs.readFileSync(path.join(ROOT, "plugins", "opennori", ".codex-plugin", "plugin.json"), "utf8"));
  const nori = fs.readFileSync(path.join(ROOT, "plugins", "opennori", "skills", "nori", "SKILL.md"), "utf8");
  const health = fs.readFileSync(path.join(ROOT, "plugins", "opennori", "skills", "nori-project-health", "SKILL.md"), "utf8");
  const protocol = fs.readFileSync(path.join(ROOT, ".opennori", "protocol.md"), "utf8");

  for (const text of [readme, plugin.interface.longDescription, nori, health, protocol]) {
    assert.match(text, /capability bundle/);
  }
  assert.match(readme, /deterministic state layer/);
  assert.match(readme, /not a separate product\s+path/);
  assert.match(readme, /npx opennori setup/);
  assert.match(readme, /opennori init/);
  assert.match(plugin.interface.longDescription, /npx opennori setup installs/);
  assert.match(plugin.interface.longDescription, /Do not treat Plugin, Skills, and CLI as separate user paths/);
  assert.match(nori, /Do not split OpenNori into separate Plugin, Skill, and CLI user paths/);
  assert.match(nori, /npx opennori setup/);
  assert.match(health, /half-installed/);
  assert.match(health, /opennori init/);
  assert.match(protocol, /Direct CLI use\s+is an advanced, automation, or debugging route/);
  assert.match(readme, /AC Review Loop/);
  assert.match(readme, /criterion add --root <repo> --from-draft --goal <goal-id>/);
  assert.match(readme, /Agents should not\s+patch `.acceptance\.md`, `.evidence\.json`, or manifest files by hand/);
  assert.match(readme, /agent 不应手工 patch `.acceptance\.md`、`.evidence\.json` 或 manifest/);
  assert.match(readme, /Enhanced Discovery/);
  assert.match(readme, /todolist/);
  assert.match(readme, /measurement and threshold should expose/);
  assert.match(readme, /The model must also be visible in the Nori Contract itself/);
  assert.match(readme, /not ready for\s+approval/);
  assert.match(readme, /AC 逐条确认循环/);
  assert.match(readme, /模型也必须进入 Nori Contract 本身/);
  assert.match(readme, /AC 的衡量方式和通过条件应暴露真实用户入口/);
  assert.match(protocol, /AC-O-14/);
  assert.match(protocol, /one AC at a time/);
  assert.match(protocol, /confirmed one by one/);
  assert.match(protocol, /The model is only useful when it changes the draft criteria/);
  assert.match(protocol, /`measurement`: entry, visible trigger/);
  assert.match(protocol, /revise the draft criterion first/);
  assert.match(protocol, /criterion add --root <repo> --from-draft --goal <goal-id>/);
  assert.match(protocol, /Do not patch the draft files manually/);

  for (const text of [readme, protocol]) {
    assert.doesNotMatch(text, /Choose one path/);
    assert.doesNotMatch(text, /Try the CLI once/);
    assert.doesNotMatch(text, /Pin the CLI to a project/);
    assert.doesNotMatch(text, /npm install -D opennori/);
  }
});

test("public JSON Schemas validate persisted OpenNori state and separate structure from semantics", () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  const current = draftAndApprove(draftArgsFromGoal(root, "Ship schema-backed OpenNori state"));
  recordArchitectureRequirement(
    root,
    current.data.goal_id,
    "required",
    "Schema-backed OpenNori state touches protocol, manifest, and architecture evidence files."
  );
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship schema-backed OpenNori state",
    "--goal-id", "ship-schema-backed-opennori-state",
    "--confirm",
    "--json"
  ]);
  run([
    "architecture", "build-vs-buy",
    "--root", root,
    "--id", "schema-validation",
    "--area", "schema-validation",
    "--need", "Validate persisted OpenNori state",
    "--recommendation", "reuse",
    "--summary", "Use JSON Schema and Ajv for structural validation.",
    "--current-project", "OpenNori writes JSON state files under .opennori.",
    "--standard-library", "JSON.parse only validates syntax.",
    "--official-sdk", "No official SDK applies.",
    "--open-source", "Ajv is the selected JSON Schema validator.",
    "--json"
  ]);
  run([
    "architecture", "apply",
    "--root", root,
    "--goal", "ship-schema-backed-opennori-state",
    "--criterion", "AC-1",
    "--summary", "AC-1 follows the confirmed schema-backed architecture.",
    "--fit", "The architecture apply record uses public schema-backed state.",
    "--implementation-focus", "Keep schema validation as structural protocol validation.",
    "--evidence", "Reviewed baseline and schema files.",
    "--json"
  ]);

  const manifest = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "manifest.json"), "utf8"));
  const evidence = JSON.parse(fs.readFileSync(current.data.evidence_path, "utf8"));
  const requirement = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "architecture", "requirements", "ship-schema-backed-opennori-state.json"), "utf8"));
  const baseline = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "architecture", "baseline.json"), "utf8"));
  const decision = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "architecture", "decisions", "schema-validation.json"), "utf8"));
  const applyRecord = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "architecture", "evidence", "ship-schema-backed-opennori-state-ac-1-aligned.json"), "utf8"));

  assert.equal(validateSchema("manifest", manifest).valid, true);
  assert.equal(validateSchema("evidence-payload", evidence).valid, true);
  assert.equal(validateSchema("architecture-requirement", requirement).valid, true);
  assert.equal(validateSchema("architecture-baseline", baseline).valid, true);
  assert.equal(validateSchema("build-vs-buy", decision).valid, true);
  assert.equal(validateSchema("architecture-apply", applyRecord).valid, true);

  const invalidShape = validateSchema("evidence-payload", { contract: { goal: "missing required fields" }, ledger: {} });
  assert.equal(invalidShape.valid, false);
  assert.equal(invalidShape.errors.some((error) => error.path.includes("/contract")), true);

  evidence.contract.criteria[0].user_story = "Implementation detail only";
  assert.equal(validateSchema("evidence-payload", evidence).valid, true);
  assert.equal(validateContract(evidence.contract, evidence.ledger).some((issue) => issue.path === "criteria[0].user_story"), false);
});

test("install creates project assets and skips existing user content by default", () => {
  const root = tempRoot();
  const protocolPath = path.join(root, ".opennori", "protocol.md");
  fs.mkdirSync(path.dirname(protocolPath), { recursive: true });
  fs.writeFileSync(protocolPath, "custom protocol\n");

  const dryRun = run(["install", "--root", root, "--dry-run", "--json"]);
  assert.equal(dryRun.data.dry_run, true);
  assert.equal(dryRun.data.actions.find((action) => action.path === ".opennori/manifest.json").action, "create");
  assert.equal(dryRun.data.install_plan.schema_version, "opennori/install-plan-v1");
  assert.equal(dryRun.data.install_plan.summary.would_write > 0, true);
  assert.equal(dryRun.data.install_plan.summary.will_write, 0);
  assert.equal(dryRun.data.install_plan.actions.find((action) => action.path === ".opennori/protocol.md").kind, "protocol");
  assert.equal(dryRun.data.install_plan.actions.find((action) => action.path === ".opennori/protocol.md").will_write, false);
  assert.equal(dryRun.data.install_plan.actions.find((action) => action.path === ".opennori/protocol.md").would_write, false);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), false);

  const payload = run(["install", "--root", root, "--json"]);
  assert.equal(payload.data.actions.find((action) => action.path === ".opennori/protocol.md").action, "skip");
  assert.equal(payload.data.actions.find((action) => action.path === ".opennori/manifest.json").action, "create");
  assert.equal(payload.data.install_plan.summary.will_write > 0, true);
  assert.equal(payload.data.actions.find((action) => action.path === ".opennori/manifest.json").kind, "manifest");
  assert.equal(payload.data.actions.find((action) => action.path === ".opennori/manifest.json").managed, true);
  assert.equal(payload.data.actions.find((action) => action.path === ".opennori/manifest.json").will_write, true);
  assert.equal(fs.readFileSync(protocolPath, "utf8"), "custom protocol\n");
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "current")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "drafts")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "brainstorms")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture", "profiles")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture", "challenges")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture", "decisions")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "agent-guide.md")), true);
  const agentGuide = fs.readFileSync(path.join(root, ".opennori", "agent-guide.md"), "utf8");
  assert.match(agentGuide, /Empty state directories are normal immediately after `opennori init`/);
  assert.match(agentGuide, /If `.opennori\/current\/\*\.acceptance\.md` is missing, do not implement yet/);
  assert.match(agentGuide, /take over an AC discussion that already happened in chat/);
  assert.match(agentGuide, /Read `.opennori\/architecture\/baseline\.md` and `.opennori\/architecture\/baseline\.json` only when they exist/);
  assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), false);
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), false);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), true);
  assert.equal(fs.existsSync(path.join(root, "process")), false);

  const manifest = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "manifest.json"), "utf8"));
  assert.equal(manifest.schema_version, "opennori/manifest-v1");
  assert.equal(manifest.opennori_version, PACKAGE_VERSION);
  assert.equal(manifest.plugin.schema_version, "opennori/plugin-v1");
  assert.equal(manifest.plugin.name, "opennori");
  assert.equal(manifest.plugin.packaged, true);
  assert.equal(manifest.plugin.marketplace_packaged, true);
  assert.equal(manifest.plugin.marketplace_name, "opennori");
  assert.equal(manifest.plugin.marketplace_plugin_path, "./plugins/opennori");
  assert.equal(manifest.plugin.manifest_path, "plugins/opennori/.codex-plugin/plugin.json");
  assert.equal(manifest.plugin.skills_path, "plugins/opennori/skills");
  assert.equal(manifest.plugin.skill_count, 11);
  assert.equal(manifest.plugin.skills.some((skill) => skill.name === "nori-project-health"), true);
  assert.equal(manifest.managed_files.some((entry) => entry.path === ".opennori/protocol.md" && entry.exists), true);
  assert.equal(manifest.managed_files.some((entry) => entry.path.startsWith(".agents/skills")), false);
  assert.equal(manifest.managed_files.some((entry) => entry.path === ".opennori/architecture" && entry.exists), true);
  assert.equal(manifest.capabilities.includes("doctor"), true);
  assert.equal(manifest.capabilities.includes("codex-plugin"), true);
  assert.equal(manifest.capabilities.includes("opennori-skills"), true);
  assert.equal(manifest.capabilities.includes("architecture-baseline"), true);
  assert.equal(manifest.capabilities.includes("build-vs-buy"), true);
  assert.equal(manifest.architecture.decision, "missing");
  assert.equal(manifest.architecture.agent_surface.guide.installed, true);

  const forced = run(["install", "--root", root, "--force", "--dry-run", "--json"]);
  const protocolAction = forced.data.install_plan.actions.find((action) => action.path === ".opennori/protocol.md");
  assert.equal(protocolAction.action, "overwrite");
  assert.equal(protocolAction.destructive, true);
  assert.equal(forced.data.install_plan.summary.destructive > 0, true);
  assert.equal(forced.data.install_plan.summary.will_write, 0);

  const unconfirmed = spawnSync(process.execPath, [CLI, "install", "--root", root, "--force", "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(unconfirmed.status, 1);
  const unconfirmedPayload = JSON.parse(unconfirmed.stdout);
  assert.equal(unconfirmedPayload.error.type, "confirm_required");
  assert.match(unconfirmedPayload.error.fix, /--dry-run --force/);

  const confirmed = run(["install", "--root", root, "--force", "--confirm", "--json"]);
  assert.equal(confirmed.data.confirmed, true);
  assert.equal(confirmed.data.install_plan.summary.destructive > 0, true);
  assert.equal(confirmed.data.install_plan.summary.will_write > 0, true);
});

test("install can explicitly merge optional project agent routes without installing Skills", () => {
  const root = tempRoot();
  fs.writeFileSync(path.join(root, "AGENTS.md"), "# Existing Project Guide\n\nKeep this project-specific guidance.\n");
  run(["install", "--root", root, "--json"]);

  const dryRun = run([
    "install",
    "--root", root,
    "--merge-agent-route",
    "--dry-run",
    "--json"
  ]);
  assert.equal(dryRun.data.install_plan.merge_agent_route, true);
  assert.equal(dryRun.data.install_plan.summary.will_write, 0);
  assert.equal(dryRun.data.actions.find((action) => action.path === "AGENTS.md").action, "merge");
  assert.equal(dryRun.data.actions.some((action) => action.path.startsWith(".agents/skills")), false);

  const unconfirmed = spawnSync(process.execPath, [
    CLI,
    "install",
    "--root", root,
    "--merge-agent-route",
    "--json"
  ], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(unconfirmed.status, 1);
  assert.equal(JSON.parse(unconfirmed.stdout).error.type, "confirm_required");

  const installed = run([
    "install",
    "--root", root,
    "--merge-agent-route",
    "--confirm",
    "--json"
  ]);
  assert.equal(installed.data.confirmed, true);
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agents, /Keep this project-specific guidance/);
  assert.match(agents, /\.opennori\/architecture\/baseline\.md/);
  assert.match(agents, /opennori:agent-route:start/);
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
  const doctor = run(["doctor", "--root", root, "--json"]);
  assert.equal(doctor.data.status, "ready");
  assert.equal(doctor.data.plugin.packaged, true);
  assert.equal(doctor.data.architecture.agent_surface.agents.references_baseline, true);
});

test("doctor reports ready, needs-action, and broken project health", () => {
  const readyRoot = tempRoot();
  run(["install", "--root", readyRoot, "--json"]);
  const ready = run(["doctor", "--root", readyRoot, "--json"]);
  assert.equal(ready.data.status, "ready");
  assert.equal(ready.data.checks.every((check) => check.ok), true);
  assert.equal(ready.data.plugin.packaged, true);
  assert.equal(ready.data.plugin.marketplace_packaged, true);
  assert.equal(ready.data.plugin.skill_count, 11);
  assert.equal(ready.data.checks.find((check) => check.name === "plugin_manifest").ok, true);
  assert.equal(ready.data.checks.find((check) => check.name === "plugin_marketplace").ok, true);
  assert.equal(ready.data.checks.find((check) => check.name === "plugin_skills").ok, true);
  assert.equal(ready.data.architecture.decision, "missing");
  assert.equal(ready.data.checks.find((check) => check.name === "architecture_baseline").ok, true);

  const nonTrivial = draftAndApprove(draftArgsFromGoal(readyRoot, "Ship a non-trivial architecture-aware goal"));
  const unknownRequirement = run(["doctor", "--root", readyRoot, "--json"]);
  assert.equal(unknownRequirement.data.checks.find((check) => check.name === "architecture_baseline").ok, true);
  assert.equal(unknownRequirement.data.architecture.requirement.status, "unknown");
  recordArchitectureRequirement(
    readyRoot,
    nonTrivial.data.goal_id,
    "required",
    "This fixture marks the goal as non-trivial after agent review."
  );
  const needsBaseline = run(["doctor", "--root", readyRoot, "--json"]);
  assert.equal(needsBaseline.data.status, "needs-action");
  assert.equal(needsBaseline.data.checks.find((check) => check.name === "architecture_baseline").ok, false);
  assert.match(needsBaseline.data.checks.find((check) => check.name === "architecture_baseline").recovery, /opennori architecture baseline/);

  run([
    "architecture", "baseline",
    "--root", readyRoot,
    "--goal", "Ship a non-trivial architecture-aware goal",
    "--goal-id", "ship-a-non-trivial-architecture-aware-goal",
    "--confirm",
    "--json"
  ]);
  const readyAgain = run(["doctor", "--root", readyRoot, "--json"]);
  assert.equal(readyAgain.data.status, "ready");
  assert.equal(readyAgain.data.architecture.decision, "valid");

  const missingManifestRoot = tempRoot();
  run(["install", "--root", missingManifestRoot, "--json"]);
  fs.unlinkSync(path.join(missingManifestRoot, ".opennori", "manifest.json"));
  const needsAction = run(["doctor", "--root", missingManifestRoot, "--json"]);
  assert.equal(needsAction.data.status, "needs-action");
  assert.equal(needsAction.data.checks.find((check) => check.name === "manifest_file").ok, false);
  assert.match(needsAction.data.checks.find((check) => check.name === "manifest_file").recovery, /opennori init/);
  assert.equal(needsAction.data.recovery_actions.some((action) => action.check === "manifest_file" && /opennori init/.test(action.action)), true);

  const staleManifestRoot = tempRoot();
  run(["install", "--root", staleManifestRoot, "--json"]);
  const manifestPath = path.join(staleManifestRoot, ".opennori", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.opennori_version = "0.0.0";
  manifest.capabilities = ["acceptance-contract"];
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const stale = run(["doctor", "--root", staleManifestRoot, "--json"]);
  assert.equal(stale.data.status, "needs-action");
  assert.equal(stale.data.checks.find((check) => check.name === "manifest_schema").ok, true);
  assert.equal(stale.data.checks.find((check) => check.name === "manifest_cli_version").ok, false);
  assert.equal(stale.data.checks.find((check) => check.name === "manifest_capabilities").ok, false);
  assert.equal(stale.data.recovery_actions.some((action) => action.check === "manifest_cli_version" && /Refresh the manifest/.test(action.action)), true);
  assert.equal(stale.data.recovery_actions.some((action) => action.check === "manifest_capabilities" && /Refresh the manifest/.test(action.action)), true);

  const invalidManifestRoot = tempRoot();
  run(["install", "--root", invalidManifestRoot, "--json"]);
  const invalidManifestPath = path.join(invalidManifestRoot, ".opennori", "manifest.json");
  const invalidManifest = JSON.parse(fs.readFileSync(invalidManifestPath, "utf8"));
  delete invalidManifest.managed_files;
  fs.writeFileSync(invalidManifestPath, `${JSON.stringify(invalidManifest, null, 2)}\n`);
  const invalidManifestDoctor = run(["doctor", "--root", invalidManifestRoot, "--json"]);
  assert.equal(invalidManifestDoctor.data.status, "broken");
  assert.equal(invalidManifestDoctor.data.checks.find((check) => check.name === "manifest_schema").ok, false);
  assert.equal(invalidManifestDoctor.data.recovery_actions.some((action) => action.check === "manifest_schema"), true);

  const brokenRoot = tempRoot();
  run(["install", "--root", brokenRoot, "--json"]);
  fs.writeFileSync(path.join(brokenRoot, ".opennori", "current", "broken.evidence.json"), "{ bad json");
  const broken = run(["doctor", "--root", brokenRoot, "--json"]);
  assert.equal(broken.data.status, "broken");
  assert.equal(broken.data.checks.find((check) => check.name === "current_goal_recoverable").ok, false);
  assert.equal(broken.data.active_goal_issues.length, 1);
  assert.match(broken.data.checks.find((check) => check.name === "current_goal_recoverable").recovery, /Inspect active_goal_issues/);
  assert.equal(broken.data.recovery_actions.some((action) => action.check === "current_goal_recoverable" && /opennori\/current/.test(action.action)), true);
  assert.equal(broken.data.recovery_actions.some((action) => action.check === "active_goal_issue" && action.goal_id === "broken" && /broken\.evidence\.json/.test(action.action)), true);

  const schemaBrokenRoot = tempRoot();
  const schemaBroken = draftAndApprove(draftArgsFromGoal(schemaBrokenRoot, "Ship schema validation diagnostics"));
  const evidencePath = schemaBroken.data.evidence_path;
  const evidencePayload = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  delete evidencePayload.ledger.criteria;
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidencePayload, null, 2)}\n`);
  const schemaBrokenDoctor = run(["doctor", "--root", schemaBrokenRoot, "--json"]);
  assert.equal(schemaBrokenDoctor.data.status, "broken");
  assert.equal(schemaBrokenDoctor.data.active_goal_issues.some((issue) => issue.path?.startsWith("schema/ledger")), true);
});

test("uninstall previews removals and preserves OpenNori state by default", () => {
  const root = tempRoot();
  const init = draftAndApprove(["--brief", "examples/opennori-self.json", "--root", root, "--json"]);
  run(["install", "--root", root, "--json"]);
  run(["report", "--root", root, "--json"]);

  const dryRun = run(["uninstall", "--root", root, "--dry-run", "--json"]);
  assert.equal(dryRun.data.uninstall_plan.schema_version, "opennori/uninstall-plan-v1");
  assert.equal(dryRun.data.uninstall_plan.summary.will_write, 0);
  assert.equal(dryRun.data.uninstall_plan.actions.filter((action) => action.kind === "skill").length, 0);
  assert.equal(dryRun.data.uninstall_plan.actions.find((action) => action.path === ".opennori/current").action, "preserve");
  assert.equal(dryRun.data.uninstall_plan.actions.find((action) => action.path === ".opennori/architecture").action, "preserve");
  assert.equal(dryRun.data.uninstall_plan.actions.find((action) => action.path === ".opennori/manifest.json").action, "delete");
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), true);

  const unconfirmed = spawnSync(process.execPath, [CLI, "uninstall", "--root", root, "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(unconfirmed.status, 1);
  assert.equal(JSON.parse(unconfirmed.stdout).error.type, "confirm_required");

  const removed = run(["uninstall", "--root", root, "--confirm", "--json"]);
  assert.equal(removed.data.confirmed, true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), false);
  assert.equal(fs.existsSync(init.data.acceptance_path), true);
  assert.equal(fs.existsSync(init.data.evidence_path), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "reports", "opennori-self.report.md")), true);
});

test("uninstall include-state requires confirmation before removing OpenNori state", () => {
  const root = tempRoot();
  run(["draft", "--brief", "examples/opennori-self.json", "--root", root, "--json"]);
  run(["install", "--root", root, "--json"]);

  const dryRun = run(["uninstall", "--root", root, "--include-state", "--dry-run", "--json"]);
  const stateAction = dryRun.data.uninstall_plan.actions.find((action) => action.path === ".opennori");
  assert.equal(stateAction.action, "delete-tree");
  assert.equal(stateAction.recursive, true);
  assert.equal(stateAction.destructive, true);
  assert.equal(dryRun.data.uninstall_plan.summary.will_write, 0);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), true);

  const unconfirmed = spawnSync(process.execPath, [CLI, "uninstall", "--root", root, "--include-state", "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(unconfirmed.status, 1);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), true);

  const removed = run(["uninstall", "--root", root, "--include-state", "--confirm", "--json"]);
  assert.equal(removed.data.include_state, true);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);
});

test("upgrade previews and confirms manifest protocol and generated guidance refresh", () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  fs.writeFileSync(path.join(root, ".opennori", "protocol.md"), "old protocol\n");
  const manifestPath = path.join(root, ".opennori", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.opennori_version = "0.0.0";
  manifest.capabilities = ["acceptance-contract"];
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const dryRun = run(["upgrade", "--root", root, "--dry-run", "--json"]);
  assert.equal(dryRun.data.upgrade_plan.schema_version, "opennori/upgrade-plan-v1");
  assert.equal(dryRun.data.upgrade_plan.summary.would_write > 0, true);
  assert.equal(dryRun.data.upgrade_plan.summary.will_write, 0);
  assert.equal(dryRun.data.upgrade_plan.actions.find((action) => action.path === ".opennori/manifest.json").action, "update");
  assert.equal(dryRun.data.upgrade_plan.actions.find((action) => action.path === ".opennori/protocol.md").action, "overwrite");
  assert.equal(dryRun.data.upgrade_plan.actions.some((action) => action.path.startsWith(".agents/skills")), false);
  assert.equal(fs.readFileSync(path.join(root, ".opennori", "protocol.md"), "utf8"), "old protocol\n");

  const unconfirmed = spawnSync(process.execPath, [CLI, "upgrade", "--root", root, "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(unconfirmed.status, 1);
  assert.equal(JSON.parse(unconfirmed.stdout).error.type, "confirm_required");

  const upgraded = run(["upgrade", "--root", root, "--confirm", "--json"]);
  assert.equal(upgraded.data.confirmed, true);
  assert.match(fs.readFileSync(path.join(root, ".opennori", "protocol.md"), "utf8"), /OpenNori Protocol/);
  const refreshedManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(refreshedManifest.opennori_version, PACKAGE_VERSION);
  assert.equal(refreshedManifest.plugin.packaged, true);
  assert.equal(refreshedManifest.capabilities.includes("upgrade"), true);
  assert.equal(refreshedManifest.capabilities.includes("context-export"), true);
  assert.equal(upgraded.next_actions.some((action) => /opennori check/.test(action)), true);
});

test("profile check automatically checks local Skills and package stacks without forcing adapters", () => {
  const root = tempRoot();
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({
    dependencies: {
      "radix-ui": "1.0.0",
      "forbidden-lib": "1.0.0"
    }
  }));
  const init = draftAndApprove([
    "--goal", "Build a frontend page",
    "--root", root,
    "--json"
  ], { summary: "User approved frontend acceptance criteria." });

  run([
    "profile", "add",
    "--root", root,
    "--type", "skill",
    "--name", "design-taste-frontend",
    "--strength", "must",
    "--purpose", "Use the design Skill.",
    "--install-policy", "existing_only",
    "--json"
  ]);
  run([
    "profile", "add",
    "--root", root,
    "--type", "stack",
    "--name", "radix-ui",
    "--strength", "prefer",
    "--purpose", "Use accessible primitives.",
    "--json"
  ]);
  run([
    "profile", "add",
    "--root", root,
    "--type", "stack",
    "--name", "forbidden-lib",
    "--strength", "avoid",
    "--purpose", "Avoid this library.",
    "--json"
  ]);

  const checked = run(["profile", "check", "--root", root, "--json"]);
  assert.equal(checked.data.recorded, false);
  assert.equal(checked.data.checks.some((item) => item.item_id === "skill-design-taste-frontend" && item.result === "satisfied"), true);
  assert.equal(checked.data.checks.some((item) => item.item_id === "stack-radix-ui" && item.result === "satisfied"), true);
  assert.equal(checked.data.checks.some((item) => item.item_id === "stack-forbidden-lib" && item.result === "violated"), true);
  let payload = JSON.parse(fs.readFileSync(init.data.evidence_path, "utf8"));
  assert.equal(payload.ledger.capability_profile.evidence.length, 0);

  const recorded = run(["profile", "check", "--root", root, "--record", "--json"]);
  assert.equal(recorded.data.recorded, true);
  assert.equal(recorded.data.compliance.statuses.some((item) => item.id === "stack-forbidden-lib" && item.status === "violated"), true);
  assert.equal(recorded.data.workflow_status, "blocked");
  payload = JSON.parse(fs.readFileSync(init.data.evidence_path, "utf8"));
  assert.equal(payload.ledger.capability_profile.evidence.length, 3);
});

test("architecture baseline loop is agent-readable sticky and challengeable", () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  const draft = draftAndApprove(draftArgsFromGoal(root, "Refactor OpenNori into a TypeScript agent state CLI product"));

  const requirementCheck = run(["check", "--root", root, "--json"]);
  assert.equal(requirementCheck.data.architecture_check.status, "needs-action");
  assert.equal(requirementCheck.data.architecture_check.architecture.requirement.status, "unknown");
  assert.equal(requirementCheck.warnings.some((warning) => warning.type === "architecture_requirement"), true);
  assert.equal(requirementCheck.data.agent_next.state, "architecture_requirement_needs_decision");

  const requirement = recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This goal changes OpenNori's TypeScript CLI, state layer, architecture routing, and manifest behavior."
  );
  assert.equal(requirement.data.requirement.status, "required");
  assert.equal(requirement.data.agent_next.state, "architecture_needs_review");

  const missingBaselineCheck = run(["check", "--root", root, "--json"]);
  assert.equal(missingBaselineCheck.data.architecture_check.status, "needs-action");
  assert.equal(missingBaselineCheck.data.architecture_check.decision, "missing");
  assert.equal(missingBaselineCheck.warnings.some((warning) => warning.type === "architecture" && /Architecture Baseline/.test(warning.message)), true);
  assert.equal(missingBaselineCheck.next_actions.some((action) => /architecture_check/.test(action)), true);

  const profiles = run(["architecture", "profiles", "--root", root, "--json"]);
  assert.equal(profiles.data.profiles.some((profile) => profile.id === "typescript-agent-state-cli"), true);
  const builtinProfile = profiles.data.profiles.find((profile) => profile.id === "typescript-agent-state-cli");
  assert.match(builtinProfile.summary, /strict TypeScript/);
  assert.equal(builtinProfile.valid, true);
  assert.equal(builtinProfile.review.can_generate_baseline, true);
  assert.equal(builtinProfile.sources.some((source) => source.label === "CodeGraph / GitNexus"), true);
  assert.equal(builtinProfile.principles.includes("build-vs-buy-before-custom-infrastructure"), true);
  assert.equal(builtinProfile.checks.some((check) => check.id === "ARCH-5" && check.audience === "agent"), true);
  assert.equal(builtinProfile.technical_baseline.runtime_topology.some((item) => item.name === "cli-state-layer"), true);
  assert.equal(builtinProfile.technical_baseline.module_boundaries.some((item) => item.name === "src/architecture"), true);
  assert.equal(builtinProfile.technical_baseline.contract_surfaces.some((item) => item.name === "cli-json"), true);
  assert.equal(builtinProfile.technical_baseline.data_flows.some((item) => item.name === "architecture-before-implementation"), true);
  assert.equal(builtinProfile.technical_baseline.dependency_decisions.some((item) => item.name === "citty"), true);
  assert.equal(builtinProfile.technical_baseline.reference_mappings.some((item) => item.name === "ECC"), true);
  assert.equal(builtinProfile.preferred_libraries.some((entry) => entry.area === "cli"), true);
  assert.equal(builtinProfile.avoid.includes("silent architecture replacement"), true);
  assert.equal(builtinProfile.build_vs_buy_policy.require_reason_when_self_building, true);

  const preview = run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Refactor OpenNori into a TypeScript agent state CLI product",
    "--goal-id", "refactor-opennori-into-a-typescript-agent-state-cli-product",
    "--json"
  ]);
  assert.equal(preview.data.confirmed, false);
  assert.equal(preview.data.side_effect, "none");
  assert.equal(preview.data.baseline.status, "draft");
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture", "baseline.json")), false);

  const confirmed = run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Refactor OpenNori into a TypeScript agent state CLI product",
    "--goal-id", "refactor-opennori-into-a-typescript-agent-state-cli-product",
    "--confirm",
    "--json"
  ]);
  assert.equal(confirmed.data.confirmed, true);
  assert.equal(confirmed.data.baseline.status, "active");
  assert.equal(confirmed.data.baseline.sticky, true);
  assert.equal(confirmed.data.baseline.requires_challenge_to_change, true);
  assert.equal(confirmed.data.baseline.principles.includes("build-vs-buy-before-custom-infrastructure"), true);
  assert.equal(confirmed.data.baseline.technical_baseline.runtime_topology.some((item) => item.name === "cli-state-layer"), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture", "baseline.json")), true);
  const baselineMarkdown = fs.readFileSync(path.join(root, ".opennori", "architecture", "baseline.md"), "utf8");
  assert.match(baselineMarkdown, /Architecture Baseline/);
  assert.match(baselineMarkdown, /## Technical Architecture Baseline/);
  assert.match(baselineMarkdown, /### Runtime Topology/);
  assert.match(baselineMarkdown, /### Module Boundaries/);
  assert.match(baselineMarkdown, /### Data Flows/);
  assert.match(fs.readFileSync(path.join(root, ".opennori", "agent-guide.md"), "utf8"), /Architecture Baseline/);

  const decision = run([
    "architecture", "build-vs-buy",
    "--root", root,
    "--area", "cli",
    "--need", "Parse subcommands and flags",
    "--recommendation", "reuse",
    "--summary", "Prefer a mature CLI parser or current project convention before expanding custom parsing.",
    "--current-project", "Current project has handwritten argValue/hasFlag helpers.",
    "--standard-library", "Node has no full subcommand parser.",
    "--official-sdk", "No official SDK.",
    "--open-source", "commander, citty, cac",
    "--json"
  ]);
  assert.equal(decision.data.decision.schema_version, "opennori/build-vs-buy-v1");
  assert.equal(fs.existsSync(decision.data.decision_path), true);

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.architecture.decision, "valid");
  assert.equal(status.data.architecture.baseline.profile, "typescript-agent-state-cli");
  assert.equal(status.data.architecture.baseline.technical_baseline_summary.runtime_topology_count > 0, true);
  assert.equal(status.data.architecture.baseline.technical_baseline_summary.module_boundary_count > 0, true);
  assert.equal(status.data.architecture.build_vs_buy_decisions.length, 1);

  const clearCheck = run(["check", "--root", root, "--json"]);
  assert.equal(clearCheck.data.architecture_check.status, "clear");
  assert.equal(clearCheck.data.architecture_check.decision, "valid");
  assert.equal(clearCheck.warnings.some((warning) => warning.type === "architecture"), false);

  const manifest = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "manifest.json"), "utf8"));
  assert.equal(manifest.architecture.required_for_goal, true);
  assert.equal(manifest.architecture.baseline.goal_id, "refactor-opennori-into-a-typescript-agent-state-cli-product");

  const secondDraft = run([
    "draft",
    "--root", root,
    "--brief", writeBriefFile(root, "Capture follow-up adoption friction", { goalId: "adoption-follow-up" }),
    "--json"
  ]);
  assert.equal(secondDraft.data.goal_id, "adoption-follow-up");
  const multiGoalManifest = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "manifest.json"), "utf8"));
  assert.equal(multiGoalManifest.current_goal.goal_id, "refactor-opennori-into-a-typescript-agent-state-cli-product");
  assert.equal(multiGoalManifest.draft_goals.some((goal) => goal.goal_id === "adoption-follow-up"), true);
  assert.equal(multiGoalManifest.active_goals.length, 1);
  assert.equal(multiGoalManifest.architecture.required_for_goal, true);
  assert.equal(multiGoalManifest.architecture.baseline.goal_id, "refactor-opennori-into-a-typescript-agent-state-cli-product");

  const report = run([
    "report",
    "--root", root,
    "--goal", "refactor-opennori-into-a-typescript-agent-state-cli-product",
    "--json"
  ]);
  const reportText = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(reportText, /## Architecture Baseline/);
  assert.match(reportText, /Architecture decision: valid/);
  assert.match(reportText, /Technical baseline: /);
  assert.match(reportText, /Build-vs-buy: clear \(1 decisions\)/);

  const exported = run([
    "context", "export",
    "--root", root,
    "--goal", "refactor-opennori-into-a-typescript-agent-state-cli-product",
    "--json"
  ]);
  assert.equal(exported.data.architecture.decision, "valid");
  assert.equal(exported.data.architecture.baseline.profile, "typescript-agent-state-cli");

  const challenge = run([
    "architecture", "challenge",
    "--root", root,
    "--summary", "Existing project standardizes on another CLI parser.",
    "--evidence", "package.json already depends on citty and command modules use it.",
    "--recommendation", "Revise CLI parser preference from commander to citty for this project.",
    "--json"
  ]);
  assert.equal(challenge.data.challenge.schema_version, "opennori/architecture-challenge-v1");
  assert.equal(challenge.data.architecture.decision, "challenged");
  assert.equal(challenge.data.architecture.open_challenges.length, 1);
  assert.match(fs.readFileSync(challenge.data.markdown_path, "utf8"), /Do not silently replace/);

  const challengedStatus = run([
    "status",
    "--root", root,
    "--goal", "refactor-opennori-into-a-typescript-agent-state-cli-product",
    "--json"
  ]);
  assert.equal(challengedStatus.data.architecture.decision, "challenged");

  assert.equal(fs.existsSync(draft.data.acceptance_path), true);
});

test("missing architecture baseline is a completion review risk, not a product AC gap", () => {
  const root = tempRoot();
  const draft = draftAndApprove(draftArgsFromGoal(root, "Ship an architecture-aware user outcome"));
  recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This fixture explicitly requires architecture review while omitting the baseline."
  );

  const payload = JSON.parse(fs.readFileSync(draft.data.evidence_path, "utf8"));
  for (const criterion of Object.keys(payload.ledger.criteria)) {
    run([
      "evidence", "add",
      "--root", root,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} has user-reviewable evidence.`,
      "--result", "passing",
      "--source-command", "opennori status --root . --json",
      "--source-path", ".opennori/reports/architecture-aware.report.md",
      "--reviewability", "Run status and inspect the report artifact.",
      "--limitations", "This fixture intentionally omits Architecture Baseline.",
      "--json"
    ]);
  }

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.workflow_status, "complete");
  assert.equal(status.data.current_gap, null);
  assert.equal(status.data.architecture.decision, "missing");
  assert.equal(status.data.completion.objective_complete, true);
  assert.equal(status.data.completion.confidence, "review-risk");
  assert.equal(status.data.completion.review_risks.includes("architecture_review"), true);
  assert.equal(status.data.next_recommendation.status, "completion-review-required");
  assert.equal(status.data.next_recommendation.actions.some((action) => /architecture_check/.test(action)), true);
  assert.equal(status.data.criteria.some((criterion) => /^ARCH-/.test(criterion.id)), false);

  const report = run(["report", "--root", root, "--json"]);
  assert.match(fs.readFileSync(report.data.report_path, "utf8"), /Review risks: architecture_review/);
});

test("architecture apply records do not count as Product AC evidence", () => {
  const root = tempRoot();
  const draft = draftAndApprove(draftArgsFromGoal(root, "Ship an architecture-guided user outcome"));
  recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This fixture verifies architecture apply records under a confirmed required baseline."
  );
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship an architecture-guided user outcome",
    "--goal-id", draft.data.goal_id,
    "--confirm",
    "--json"
  ]);

  const applied = run([
    "architecture", "apply",
    "--root", root,
    "--goal", draft.data.goal_id,
    "--criterion", "AC-1",
    "--summary", "AC-1 will follow the confirmed architecture baseline.",
    "--fit", "The intended change keeps the confirmed command and state boundaries.",
    "--implementation-focus", "Work only on AC-1.",
    "--evidence", "Reviewed baseline and current gap before implementation.",
    "--json"
  ]);
  assert.equal(applied.data.apply_record.schema_version, "opennori/architecture-apply-v1");
  assert.equal(applied.data.architecture.apply_records.length, 1);
  assert.equal(applied.data.agent_next.state, "evidence_ready_for_recording");
  assert.equal(applied.data.agent_next.recommended_skill, "nori-evidence");
  assert.match(applied.data.agent_next.instruction, /Product AC evidence/);

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.architecture.decision, "valid");
  assert.equal(status.data.architecture.apply_records.length, 1);
  assert.equal(status.data.current_gap.id, "AC-1");
  assert.equal(status.data.workflow_status, "active");
  assert.equal(status.data.criteria.find((criterion) => criterion.id === "AC-1").status, "unknown");

  const report = run(["report", "--root", root, "--json"]);
  const reportText = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(reportText, /Architecture apply records: 1/);
  assert.match(reportText, /AC-1: aligned/);
});

test("product evidence can reference architecture apply context without treating it as proof", () => {
  const root = tempRoot();
  const draft = draftAndApprove(draftArgsFromGoal(root, "Ship architecture-context evidence"));
  recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This fixture verifies Product evidence with architecture context under a required baseline."
  );
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship architecture-context evidence",
    "--goal-id", draft.data.goal_id,
    "--confirm",
    "--json"
  ]);
  const applied = run([
    "architecture", "apply",
    "--root", root,
    "--id", "ac-1-context",
    "--goal", draft.data.goal_id,
    "--criterion", "AC-1",
    "--summary", "AC-1 will follow the confirmed baseline.",
    "--fit", "The intended work keeps the confirmed CLI and state boundaries.",
    "--implementation-focus", "Work only on AC-1.",
    "--json"
  ]);

  const contextOnly = run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--kind", "agent-observation",
    "--summary", "Only the architecture alignment context has been attached so far.",
    "--architecture-apply", "ac-1-context",
    "--reviewability", "Open the architecture apply record.",
    "--limitations", "This does not prove the user-visible behavior.",
    "--result", "passing",
    "--json"
  ]);
  assert.equal(contextOnly.data.criterion_status, "failing");
  assert.equal(contextOnly.data.gate, "downgraded_context_only_requires_product_evidence");
  assert.equal(contextOnly.data.latest_evidence.sources[0].type, "architecture-apply");
  assert.equal(contextOnly.data.latest_evidence.sources[0].role, "context");
  assert.equal(contextOnly.data.latest_evidence.sources[0].path, ".opennori/architecture/evidence/ac-1-context.json");

  const verified = run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--kind", "review-result",
    "--basis", "tool-observation",
    "--summary", "The user-visible AC-1 behavior was verified and kept within the architecture baseline.",
    "--architecture-apply", applied.data.apply_record.id,
    "--source-command", "npm run check",
    "--reviewability", "Rerun the command and inspect the architecture apply record for baseline context.",
    "--limitations", "This fixture proves evidence semantics, not a real browser flow.",
    "--result", "passing",
    "--json"
  ]);
  assert.equal(verified.data.criterion_status, "passing");
  assert.equal(verified.data.latest_evidence.sources.some((source) => source.type === "architecture-apply"), true);
  assert.equal(verified.data.latest_evidence.sources.some((source) => source.type === "command"), true);

  const report = run(["report", "--root", root, "--json"]);
  const reportText = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(reportText, /type=architecture-apply/);
  assert.match(reportText, /role=context/);
  assert.match(reportText, /command=npm run check/);
});

test("project architecture profiles can be added and used for baselines", () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  recordArchitectureRequirement(
    root,
    "ship-under-team-architecture",
    "required",
    "The goal explicitly tests a project Architecture Profile baseline."
  );

  const sourcePath = path.join(root, "preferred-architecture.json");
  fs.writeFileSync(sourcePath, `${JSON.stringify({
    id: "team-cli",
    title: "Team CLI",
    summary: "Use the team's preferred CLI parser, shared schema package, and strict build-vs-buy review.",
    applies_to: ["team-maintained CLI tools"],
    sources: [{ label: "Team standard", lesson: "Follow the shared parser and schema packages unless challenged." }],
    principles: ["team-parser-first", "shared-schema-first", "build-vs-buy-before-self-build"],
    checks: [
      {
        id: "TEAM-ARCH-1",
        audience: "maintainer",
        statement: "New command behavior follows the team parser boundary.",
        review: "Inspect command modules and parser wiring."
      }
    ],
    technical_baseline: {
      runtime_topology: [{ name: "team-cli-runtime", decision: "Run through the team CLI package." }],
      source_of_truth: [{ name: "team-schema-package", decision: "Use the shared schema package as the contract source." }],
      module_boundaries: [{ name: "commands", decision: "Command modules delegate to domain modules." }],
      contract_surfaces: [{ name: "json-cli", decision: "Expose stable JSON for agents." }],
      data_flows: [{ name: "command-to-state", steps: ["Parse command.", "Validate schema.", "Write project state."] }],
      dependency_decisions: [{ name: "team-cli-parser", decision: "Prefer the team CLI parser dependency." }],
      reference_mappings: [{ name: "team-standard", decision: "Map team standards into command and schema modules." }],
      verification: ["pnpm test"]
    },
    preferred_libraries: [{ area: "cli", policy: "Prefer the team CLI parser package." }],
    avoid: ["new handwritten parser without challenge"],
    build_vs_buy_policy: {
      order: ["current-project-dependency", "official-sdk", "mature-open-source-library", "small-local-implementation"],
      require_reason_when_self_building: true
    }
  }, null, 2)}\n`);

  const added = run(["architecture", "profile", "--root", root, "--from", sourcePath, "--json"]);
  assert.equal(added.data.profile.id, "team-cli");
  assert.equal(added.data.profile_path, path.join(root, ".opennori", "architecture", "profiles", "team-cli.json"));
  assert.equal(fs.existsSync(added.data.profile_path), true);
  assert.equal(added.data.profiles[0].id, "team-cli");
  assert.equal(added.data.profiles[0].origin, "project");

  const duplicate = spawnSync(process.execPath, [CLI, "architecture", "profile", "--root", root, "--from", sourcePath, "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stderr, /already exists/);

  const profiles = run(["architecture", "profiles", "--root", root, "--json"]);
  const projectProfile = profiles.data.profiles.find((profile) => profile.id === "team-cli" && profile.origin === "project");
  assert.equal(Boolean(projectProfile), true);
  assert.equal(projectProfile.valid, true);
  assert.equal(projectProfile.review.can_generate_baseline, true);
  assert.equal(projectProfile.sources.some((source) => source.label === "Team standard"), true);
  assert.equal(projectProfile.principles.includes("team-parser-first"), true);
  assert.equal(projectProfile.avoid.includes("new handwritten parser without challenge"), true);

  const baseline = run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship under team architecture",
    "--goal-id", "ship-under-team-architecture",
    "--profile", "team-cli",
    "--confirm",
    "--json"
  ]);
  assert.equal(baseline.data.baseline.profile, "team-cli");
  assert.equal(baseline.data.baseline.profile_origin, "project");
  assert.equal(baseline.data.baseline.principles.includes("team-parser-first"), true);
  assert.match(fs.readFileSync(path.join(root, ".opennori", "architecture", "baseline.md"), "utf8"), /team-parser-first/);
});

test("architecture evidence directory rejects misplaced profile source files", () => {
  const root = tempRoot();
  const draft = draftAndApprove(draftArgsFromGoal(root, "Ship under clean architecture evidence"));
  recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This fixture verifies architecture evidence directory health."
  );
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship under clean architecture evidence",
    "--goal-id", draft.data.goal_id,
    "--confirm",
    "--json"
  ]);

  const misplacedProfilePath = path.join(root, ".opennori", "architecture", "evidence", "team-cli.profile.json");
  fs.mkdirSync(path.dirname(misplacedProfilePath), { recursive: true });
  fs.writeFileSync(misplacedProfilePath, `${JSON.stringify({
    id: "team-cli",
    title: "Team CLI",
    summary: "This is a profile source, not an architecture apply record.",
    principles: ["team-parser-first"],
    checks: [
      {
        id: "TEAM-1",
        audience: "maintainer",
        statement: "Commands follow team architecture.",
        review: "Inspect command modules."
      }
    ],
    technical_baseline: {
      runtime_topology: [{ name: "runtime", decision: "Use the team runtime." }],
      source_of_truth: [{ name: "state", decision: "Use project state." }],
      module_boundaries: [{ name: "modules", decision: "Use team modules." }],
      contract_surfaces: [{ name: "json", decision: "Expose JSON." }],
      data_flows: [{ name: "flow", steps: ["Read input.", "Write state."] }],
      dependency_decisions: [{ name: "parser", decision: "Use team parser." }],
      reference_mappings: [{ name: "standard", decision: "Map team standard." }],
      verification: ["npm test"]
    },
    build_vs_buy_policy: {
      order: ["current-project-dependency", "mature-open-source-library", "small-local-implementation"],
      require_reason_when_self_building: true
    }
  }, null, 2)}\n`);

  const check = run(["check", "--root", root, "--json"]);
  assert.equal(check.data.architecture_check.status, "needs-action");
  assert.equal(check.data.architecture_check.architecture.evidence_health.status, "broken");
  assert.equal(check.warnings.some((warning) => warning.type === "architecture_evidence" && warning.path === ".opennori/architecture/evidence/team-cli.profile.json"), true);
  assert.equal(check.next_actions.some((action) => /architecture evidence/.test(action)), true);

  const payload = JSON.parse(fs.readFileSync(draft.data.evidence_path, "utf8"));
  for (const criterion of Object.keys(payload.ledger.criteria)) {
    run([
      "evidence", "add",
      "--root", root,
      "--criterion", criterion,
      "--kind", "verification",
      "--summary", `${criterion} has user-visible evidence.`,
      "--result", "passing",
      "--confidence", "high",
      "--basis", "tool-observation",
      "--source-command", "npm test",
      "--reviewability", "Rerun npm test and inspect the output.",
      "--limitations", "This fixture focuses on architecture evidence directory health.",
      "--json"
    ]);
  }

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.completion.review_risks.includes("architecture_evidence"), true);
  assert.equal(status.data.next_recommendation.status, "completion-review-required");
  assert.equal(status.data.next_recommendation.recommended_skill, "nori-project-health");

  const doctorPayload = run(["doctor", "--root", root, "--json"]);
  const architectureEvidenceCheck = doctorPayload.data.checks.find((item) => item.name === "architecture_evidence");
  assert.equal(architectureEvidenceCheck.ok, false);
  assert.equal(architectureEvidenceCheck.severity, "broken");
  assert.equal(doctorPayload.data.recovery_actions.some((action) => action.check === "architecture_evidence"), true);

  const report = run(["report", "--root", root, "--json"]);
  const reportText = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(reportText, /Review risks: .*architecture_evidence/);
  assert.match(reportText, /Architecture evidence health: broken/);
  assert.match(reportText, /team-cli\.profile\.json/);
});

test("project architecture profiles without technical verification are not usable for baselines", () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);

  const profilesDir = path.join(root, ".opennori", "architecture", "profiles");
  fs.mkdirSync(profilesDir, { recursive: true });
  fs.writeFileSync(path.join(profilesDir, "missing-verification.json"), `${JSON.stringify({
    id: "missing-verification",
    title: "Missing Verification Profile",
    summary: "This profile has concrete sections but no verification commands or review checks.",
    principles: ["use-concrete-architecture"],
    checks: [
      {
        id: "TEAM-1",
        audience: "maintainer",
        statement: "Architecture has concrete boundaries.",
        review: "Inspect the baseline."
      }
    ],
    technical_baseline: {
      runtime_topology: [{ name: "runtime", decision: "Use the project runtime." }],
      source_of_truth: [{ name: "state", decision: "Use project-local JSON state." }],
      module_boundaries: [{ name: "modules", decision: "Keep command and domain modules separate." }],
      contract_surfaces: [{ name: "json", decision: "Expose stable JSON." }],
      data_flows: [{ name: "flow", steps: ["Read input.", "Write state."] }],
      dependency_decisions: [{ name: "parser", decision: "Use the existing parser." }],
      reference_mappings: [{ name: "standard", decision: "Map the team standard into modules." }]
    },
    build_vs_buy_policy: {
      order: ["current-project-dependency", "mature-open-source-library", "small-local-implementation"],
      require_reason_when_self_building: true
    }
  }, null, 2)}\n`);

  const profiles = run(["architecture", "profiles", "--root", root, "--json"]);
  const projectProfile = profiles.data.profiles.find((profile) => profile.id === "missing-verification");
  assert.equal(Boolean(projectProfile), true);
  assert.equal(projectProfile.valid, false);
  assert.equal(projectProfile.review.can_generate_baseline, false);
  assert.equal(projectProfile.validation_issues.some((issue) => issue.path === "technical_baseline" && /verification/.test(issue.message)), true);
});

test("build-vs-buy health surfaces missing reuse review before self-build", () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  const draft = draftAndApprove(draftArgsFromGoal(root, "Ship a reusable infrastructure choice"));
  recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This fixture verifies build-vs-buy health under a required architecture baseline."
  );
  const payload = JSON.parse(fs.readFileSync(draft.data.evidence_path, "utf8"));
  for (const criterion of Object.keys(payload.ledger.criteria)) {
    run([
      "evidence", "add",
      "--root", root,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} has user-reviewable evidence.`,
      "--result", "passing",
      "--source-command", "opennori status --root . --json",
      "--source-path", ".opennori/reports/build-vs-buy.report.md",
      "--reviewability", "Run status and inspect the report artifact.",
      "--limitations", "This fixture focuses on build-vs-buy health.",
      "--json"
    ]);
  }
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship a reusable infrastructure choice",
    "--goal-id", draft.data.goal_id,
    "--confirm",
    "--json"
  ]);

  run([
    "architecture", "build-vs-buy",
    "--root", root,
    "--id", "schema-validation",
    "--area", "schema-validation",
    "--need", "Validate OpenNori project state",
    "--recommendation", "reuse",
    "--summary", "Use a schema validation library when state contracts grow.",
    "--current-project", "No existing runtime schema dependency.",
    "--standard-library", "Node has JSON.parse but no schema validation.",
    "--official-sdk", "No official OpenNori SDK applies.",
    "--open-source", "Ajv, Zod, Valibot, TypeBox were reviewed.",
    "--json"
  ]);

  const healthy = run(["check", "--root", root, "--json"]);
  assert.equal(healthy.data.architecture_check.architecture.build_vs_buy.status, "clear");
  assert.equal(healthy.warnings.some((warning) => warning.type === "build_vs_buy"), false);
  assert.equal(healthy.data.architecture_check.architecture.build_vs_buy_decisions[0].open_source.includes("Ajv"), true);
  const ready = run(["doctor", "--root", root, "--json"]);
  assert.equal(ready.data.checks.find((check) => check.name === "build_vs_buy_health").ok, true);

  run([
    "architecture", "build-vs-buy",
    "--root", root,
    "--id", "custom-markdown-parser",
    "--area", "markdown",
    "--need", "Parse editable OpenNori markdown",
    "--recommendation", "self-build",
    "--summary", "Keep parsing local for now.",
    "--current-project", "Current parser uses a local regex helper.",
    "--standard-library", "Node has no markdown parser.",
    "--official-sdk", "No official SDK applies.",
    "--json"
  ]);

  const unhealthy = run(["check", "--root", root, "--json"]);
  assert.equal(unhealthy.data.architecture_check.architecture.build_vs_buy.status, "needs-action");
  assert.equal(unhealthy.warnings.some((warning) => warning.type === "build_vs_buy" && warning.issue === "missing-open-source"), true);
  assert.equal(unhealthy.warnings.some((warning) => warning.type === "build_vs_buy" && warning.issue === "missing-self-build-reason"), true);
  assert.equal(unhealthy.next_actions.some((action) => /build_vs_buy/.test(action)), true);

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.current_gap, null);
  assert.equal(status.data.completion.objective_complete, true);
  assert.equal(status.data.completion.confidence, "review-risk");
  assert.equal(status.data.completion.review_risks.includes("build_vs_buy"), true);
  assert.equal(status.data.next_recommendation.status, "completion-review-required");
  assert.equal(status.data.next_recommendation.actions.some((action) => /build_vs_buy/.test(action)), true);
  assert.equal(status.data.criteria.some((criterion) => /^ARCH-/.test(criterion.id)), false);

  const report = run(["report", "--root", root, "--json"]);
  assert.equal(report.data.completion.confidence, "review-risk");
  assert.equal(report.data.completion.review_risks.includes("build_vs_buy"), true);
  assert.match(fs.readFileSync(report.data.report_path, "utf8"), /Review risks: build_vs_buy/);

  const doctorPayload = run(["doctor", "--root", root, "--json"]);
  const buildVsBuyCheck = doctorPayload.data.checks.find((check) => check.name === "build_vs_buy_health");
  assert.equal(buildVsBuyCheck.ok, false);
  assert.match(buildVsBuyCheck.summary, /build-vs-buy issue/);

  const decisionPath = path.join(root, ".opennori", "architecture", "decisions", "custom-markdown-parser.json");
  const invalidDecision = JSON.parse(fs.readFileSync(decisionPath, "utf8"));
  invalidDecision.recommendation = "maybe";
  fs.writeFileSync(decisionPath, `${JSON.stringify(invalidDecision, null, 2)}\n`);
  const schemaBroken = run(["check", "--root", root, "--json"]);
  assert.equal(schemaBroken.data.architecture_check.architecture.build_vs_buy.status, "broken");
  assert.equal(schemaBroken.warnings.some((warning) => warning.type === "build_vs_buy" && warning.issue === "schema-invalid-decision"), true);
});

test("superseded build-vs-buy decisions stay reviewable without blocking current health", () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  run([
    "architecture", "build-vs-buy",
    "--root", root,
    "--id", "old-config-choice",
    "--area", "config",
    "--need", "Choose an earlier local configuration format",
    "--recommendation", "self-build",
    "--status", "superseded",
    "--superseded-by", "protocol-state-validation-ajv-runtime-public-json-schema",
    "--superseded-reason", "The confirmed Architecture Baseline now uses public JSON Schema for protocol state.",
    "--summary", "Old local config decision retained for history.",
    "--current-project", "Previous implementation used small local shape checks.",
    "--standard-library", "JSON.parse was available for syntax checks.",
    "--official-sdk", "No official SDK applies.",
    "--json"
  ]);

  const status = run(["architecture", "show", "--root", root, "--json"]);
  assert.equal(status.data.architecture.build_vs_buy_decisions.length, 1);
  assert.equal(status.data.architecture.build_vs_buy_decisions[0].status, "superseded");
  assert.equal(status.data.architecture.build_vs_buy.status, "clear");
  assert.equal(status.data.architecture.build_vs_buy.decision_count, 0);
  assert.equal(status.data.architecture.build_vs_buy.superseded_decision_count, 1);
});

test("context export exposes goal AC profile evidence and report paths for review tools", () => {
  const root = tempRoot();
  const draft = draftAndApprove(draftArgsFromGoal(root, "Ship a reviewable workflow"));
  recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This fixture verifies context export with a confirmed architecture baseline."
  );
  run([
    "profile", "add",
    "--root", root,
    "--type", "constraint",
    "--name", "profile-stays-out-of-acs",
    "--strength", "prefer",
    "--purpose", "Keep implementation preferences outside user ACs.",
    "--json"
  ]);
  run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--kind", "test-summary",
    "--summary", "The user-visible operation is satisfied.",
    "--result", "passing",
    "--json"
  ]);
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship a reviewable workflow",
    "--goal-id", "ship-a-reviewable-workflow",
    "--confirm",
    "--json"
  ]);
  run(["report", "--root", root, "--json"]);

  const exported = run(["context", "export", "--root", root, "--json"]);
  assert.equal(exported.data.schema_version, "opennori/context-export-v1");
  assert.equal(exported.data.goal_id, "ship-a-reviewable-workflow");
  assert.equal(exported.data.criteria.some((criterion) => criterion.id === "AC-1" && criterion.latest_evidence.summary === "The user-visible operation is satisfied."), true);
  assert.equal(exported.data.capability_profile.items.some((item) => item.name === "profile-stays-out-of-acs"), true);
  assert.equal(exported.data.architecture.decision, "valid");
  assert.equal(exported.data.architecture.baseline.profile, "typescript-agent-state-cli");
  assert.equal(exported.data.agent_next.schema_version, "opennori/agent-next-v1");
  assert.equal(exported.data.agent_next.goal_id, "ship-a-reviewable-workflow");
  assert.equal(exported.data.paths.acceptance, ".opennori/current/ship-a-reviewable-workflow.acceptance.md");
  assert.equal(exported.data.paths.report_exists, true);
  assert.equal(exported.data.manifest.capabilities.includes("context-export"), true);

  const output = path.join(root, ".opennori", "reports", "context.json");
  const written = run(["context", "export", "--root", root, "--output", output, "--json"]);
  assert.equal(written.data.output_path, output);
  assert.equal(fs.existsSync(output), true);
  assert.equal(JSON.parse(fs.readFileSync(output, "utf8")).schema_version, "opennori/context-export-v1");
});

test("changes groups acceptance artifacts separately from implementation files", () => {
  const root = tempRoot();
  spawnSync("git", ["init"], { cwd: root, encoding: "utf8" });
  fs.mkdirSync(path.join(root, ".opennori", "current"), { recursive: true });
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, ".opennori", "current", "demo.acceptance.md"), "acceptance\n");
  fs.writeFileSync(path.join(root, "src", "index.js"), "console.log('demo')\n");

  const payload = run(["changes", "--root", root, "--json"]);
  assert.equal(payload.data.changed_files.available, true);
  assert.equal(payload.data.changed_files.acceptance.some((item) => item.path === ".opennori/current/demo.acceptance.md"), true);
  assert.equal(payload.data.changed_files.implementation.some((item) => item.path === "src/index.js"), true);
});

test("list separates drafts from the single current goal", () => {
  const root = tempRoot();
  const firstBrief = path.join(root, "first.json");
  const secondBrief = path.join(root, "second.json");
  const makeBrief = (goalId, goal) => ({
    goal_id: goalId,
    goal,
    criteria: [
      {
        id: "AC-P-1",
        user_story: `作为用户，我能查看 ${goalId} 的验收状态。`,
        measurement: "运行 opennori list 或 opennori resume。",
        threshold: "输出包含目标状态和当前缺口。"
      }
    ]
  });
  fs.writeFileSync(firstBrief, JSON.stringify(makeBrief("first-goal", "First goal")));
  fs.writeFileSync(secondBrief, JSON.stringify(makeBrief("second-goal", "Second goal")));

  draftAndApprove(["--brief", firstBrief, "--root", root, "--json"]);
  run(["draft", "--brief", secondBrief, "--root", root, "--json"]);

  const list = run(["list", "--root", root, "--json"]);
  assert.deepEqual(list.data.current_goals.map((goal) => goal.goal_id), ["first-goal"]);
  assert.deepEqual(list.data.draft_goals.map((goal) => goal.goal_id), ["second-goal"]);

  const resume = run(["resume", "--root", root, "--json"]);
  assert.equal(resume.data.goal_id, "first-goal");
  assert.equal(resume.data.current_gap.id, "AC-P-1");

  const draftResume = spawnSync(process.execPath, [CLI, "resume", "--root", root, "--goal", "second-goal", "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(draftResume.status, 1);
  const draftResumePayload = JSON.parse(draftResume.stdout);
  assert.equal(draftResumePayload.ok, false);
  assert.equal(draftResumePayload.error.type, "no_current_goal");
  assert.match(draftResumePayload.error.message, /No current OpenNori goal found/);
});

test("archive moves complete goals out of current and preserves report", () => {
  const root = tempRoot();
  const init = draftAndApprove(["--brief", "examples/opennori-self.json", "--root", root, "--json"]);
  const ledger = JSON.parse(fs.readFileSync(init.data.evidence_path, "utf8"));

  for (const criterion of Object.keys(ledger.ledger.criteria)) {
    run([
      "evidence", "add",
      "--acceptance", init.data.acceptance_path,
      "--evidence", init.data.evidence_path,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} has user-understandable evidence.`,
      "--result", "passing",
      "--json"
    ]);
  }

  const archived = run(["archive", "--root", root, "--goal", "opennori-self", "--json"]);
  assert.equal(archived.data.archived_as, "completed");
  assert.equal(fs.existsSync(init.data.acceptance_path), false);
  assert.equal(fs.existsSync(init.data.evidence_path), false);
  assert.equal(fs.existsSync(archived.data.acceptance_path), true);
  assert.equal(fs.existsSync(archived.data.evidence_path), true);
  assert.equal(fs.existsSync(archived.data.report_path), true);

  const list = run(["list", "--root", root, "--json"]);
  assert.equal(list.data.current_goals.length, 0);
});

test("archive can preserve blocked goals outside current work", () => {
  const root = tempRoot();
  const init = draftAndApprove(["--brief", "examples/opennori-self.json", "--root", root, "--json"]);

  run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-O-5",
    "--kind", "human-confirmation",
    "--summary", "User must choose whether to pause or continue.",
    "--result", "blocked",
    "--json"
  ]);

  const archived = run(["archive", "--root", root, "--goal", "opennori-self", "--json"]);
  assert.equal(archived.data.archived_as, "blocked");
  assert.equal(fs.existsSync(init.data.acceptance_path), false);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "blocked", "opennori-self.acceptance.md")), true);

  const report = fs.readFileSync(archived.data.report_path, "utf8");
  assert.ok(report.indexOf("## Decision Summary") < report.indexOf("## Acceptance Status"));
  assert.match(report, /Completion: Not complete: AC-O-5 is blocked/);
  assert.match(report, /User intervention: AC-O-5 - User must choose whether to pause or continue/);
  assert.match(report, /Current status: blocked/);
  assert.match(report, /User must choose whether to pause or continue/);
});

test("criterion update preserves the revised acceptance basis and clears stale evidence", () => {
  const root = tempRoot();
  const init = draftAndApprove(["--brief", "examples/opennori-self.json", "--root", root, "--json"]);

  run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-P-1",
    "--kind", "test-summary",
    "--summary", "Old criterion had evidence.",
    "--result", "passing",
    "--json"
  ]);

  const updated = run([
    "criterion", "update",
    "--root", root,
    "--criterion", "AC-P-1",
    "--user-story", "作为用户，我打开 current Nori Contract 后，能在 30 秒内判断当前缺口。",
    "--measurement", "打开 current Nori Contract 并阅读当前状态。",
    "--threshold", "30 秒内能判断当前缺口。",
    "--summary", "User tightened AC-P-1 threshold.",
    "--json"
  ]);

  assert.equal(updated.data.acceptance_basis.status, "approved");
  assert.equal(updated.data.current_gap.id, "AC-P-1");
  assert.equal(updated.data.current_gap.user_story, "作为用户，我打开 current Nori Contract 后，能在 30 秒内判断当前缺口。");

  const payload = JSON.parse(fs.readFileSync(init.data.evidence_path, "utf8"));
  assert.equal(payload.ledger.criteria["AC-P-1"].status, "unknown");
  assert.equal(payload.ledger.criteria["AC-P-1"].evidence.length, 0);
});

test("criterion update on a draft keeps the contract awaiting AC review", () => {
  const root = tempRoot();
  const briefPath = writeBriefFile(root, "交付 AW 项目登记和选择能力", {
    goalId: "aw-project-registry",
    language: "zh-CN",
    criteria: [
      {
        id: "AC-1",
        layer: "operator",
        user_story: "作为用户，我能在 AW 项目列表选择一个项目。",
        measurement: "打开 AW 项目列表并选择项目。",
        threshold: "被选项目显示为当前项目。"
      }
    ]
  });
  const draft = run(["draft", "--brief", briefPath, "--root", root, "--json"]);

  run([
    "profile", "add",
    "--root", root,
    "--from-draft",
    "--goal", "aw-project-registry",
    "--id", "ui-component-library-first",
    "--type", "constraint",
    "--name", "优先使用项目现有组件库",
    "--strength", "must",
    "--purpose", "UI 实现应先复用现有组件库。",
    "--scope", "AW UI work",
    "--json"
  ]);

  const updated = run([
    "criterion", "update",
    "--root", root,
    "--from-draft",
    "--goal", "aw-project-registry",
    "--criterion", "AC-1",
    "--user-story", "作为用户，我能在 AW 项目登记层新增、查看、修改、解绑并选择项目。",
    "--measurement", "打开 AW 项目登记入口，新增或修改项目登记信息，查看可见项目列表，解绑一个登记项，并选择一个项目。",
    "--threshold", "增删改查只影响 AW 登记信息和可见项目列表；解绑不会删除本地项目目录；选中的项目状态清楚可见。",
    "--summary", "用户在 AC Review Loop 中修订 AC-1。",
    "--json"
  ]);

  assert.equal(updated.data.acceptance_basis.status, "draft");
  assert.equal(updated.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(updated.data.workflow_status, "draft");
  const status = run(["status", "--root", root, "--from-draft", "--goal", "aw-project-registry", "--json"]);
  assert.equal(status.data.acceptance_basis.status, "draft");
  assert.equal(status.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(status.data.workflow_status, "draft");
  const payload = JSON.parse(fs.readFileSync(draft.data.evidence_path, "utf8"));
  assert.equal(payload.contract.acceptance_basis.status, "draft");
  assert.equal(payload.contract.acceptance_basis.approved_at, undefined);
  assert.equal(payload.ledger.status, "draft");
});

test("criterion add on a draft keeps the contract awaiting AC review", () => {
  const root = tempRoot();
  const briefPath = writeBriefFile(root, "交付 AW 项目设置能力", {
    goalId: "aw-project-settings",
    language: "zh-CN",
    criteria: [
      {
        id: "AC-1",
        layer: "operator",
        user_story: "作为用户，我能在 AW 项目详情页查看项目名称。",
        measurement: "打开 AW 项目详情页并查看项目名称展示。",
        threshold: "当前项目名称可见，并与项目登记状态一致。"
      }
    ]
  });
  const draft = run(["draft", "--brief", briefPath, "--root", root, "--json"]);

  const added = run([
    "criterion", "add",
    "--root", root,
    "--from-draft",
    "--goal", "aw-project-settings",
    "--id", "AC-14",
    "--user-story", "作为用户，我能从 AW 项目详情页打开设置入口并修改项目分类。",
    "--measurement", "打开项目详情页，点击设置入口，在设置表单中修改项目分类并保存。",
    "--threshold", "保存成功后详情页显示新的分类；刷新后分类仍然存在；保存失败时显示可理解的错误和重试入口。",
    "--summary", "AC Review Loop discovered the missing settings acceptance boundary.",
    "--json"
  ]);

  assert.equal(added.data.criterion.id, "AC-14");
  assert.equal(added.data.acceptance_basis.status, "draft");
  assert.equal(added.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(added.data.workflow_status, "draft");

  const status = run(["status", "--root", root, "--from-draft", "--goal", "aw-project-settings", "--json"]);
  assert.equal(status.data.acceptance_basis.status, "draft");
  assert.equal(status.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(status.data.workflow_status, "draft");

  const payload = JSON.parse(fs.readFileSync(draft.data.evidence_path, "utf8"));
  assert.equal(payload.contract.criteria.some((criterion) => criterion.id === "AC-14"), true);
  assert.equal(payload.contract.acceptance_basis.status, "draft");
  assert.equal(payload.contract.acceptance_basis.approved_at, undefined);
  assert.equal(payload.ledger.status, "draft");
  assert.equal(payload.ledger.criteria["AC-14"].status, "unknown");
  assert.match(fs.readFileSync(draft.data.acceptance_path, "utf8"), /AC-14/);

  const manifest = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "manifest.json"), "utf8"));
  assert.equal(manifest.draft_goals.some((goal) => goal.goal_id === "aw-project-settings"), true);
});

test("criterion add preserves contract and ledger consistency", () => {
  const root = tempRoot();
  const init = draftAndApprove(["--brief", "examples/opennori-self.json", "--root", root, "--json"]);

  const added = run([
    "criterion", "add",
    "--root", root,
    "--id", "AC-Z-99",
    "--user-story", "作为用户，我能确认 OpenNori 是一个不可拆开的 agent capability bundle。",
    "--measurement", "阅读 README、Plugin 说明、Skill 边界和官网 Start 区域。",
    "--threshold", "主路径表达为安装和使用 OpenNori capability bundle，CLI 只作为 Skills 使用的 deterministic state layer 和高级/CI 入口。",
    "--summary", "User added the capability bundle boundary AC.",
    "--json"
  ]);

  assert.equal(added.data.criterion.id, "AC-Z-99");
  assert.equal(added.data.workflow_status, "active");

  const payload = JSON.parse(fs.readFileSync(init.data.evidence_path, "utf8"));
  assert.equal(payload.contract.criteria.some((criterion) => criterion.id === "AC-Z-99"), true);
  assert.equal(payload.ledger.criteria["AC-Z-99"].status, "unknown");

  const duplicate = spawnSync(process.execPath, [
    CLI,
    "criterion",
    "add",
    "--root", root,
    "--id", "AC-Z-99",
    "--user-story", "作为用户，我不会看到重复 AC。",
    "--measurement", "再次添加同一 id。",
    "--threshold", "命令失败。",
    "--json"
  ], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(duplicate.status, 1);
  const duplicatePayload = JSON.parse(duplicate.stdout || duplicate.stderr);
  assert.equal(duplicatePayload.ok, false);
  assert.equal(duplicatePayload.error.type, "unexpected_error");
  assert.match(duplicatePayload.error.message, /Criterion already exists/);
});

test("drafted generic goals stay blocked on acceptance approval", () => {
  const root = tempRoot();
  const draft = run(["draft", ...draftArgsFromGoal(root, "Ship a settings page where users edit profile details")]);
  assert.equal(draft.ok, true);
  assert.match(draft.data.acceptance_basis.summary, /Skill-prepared acceptance brief/);
  assert.equal(draft.data.acceptance_basis.status, "draft");
  assert.equal(draft.data.current_gap.id, "ACCEPTANCE-BASIS");
});

test("check does not rewrite existing contracts while reporting objective state", () => {
  const root = tempRoot();
  const brief = path.join(root, "existing-contract.json");
  fs.writeFileSync(brief, JSON.stringify({
    goal_id: "existing-contract",
    goal: "Settings page",
    acceptance_basis: { status: "approved", summary: "Existing project contract." },
    criteria: [
      {
        id: "AC-1",
        user_story: "作为用户，我打开设置页后，能修改个人资料并保存，失败时看到提示。",
        measurement: "打开设置页，修改个人资料，点击保存。",
        threshold: "刷新后仍然生效；失败时有提示。"
      }
    ]
  }));

  const init = run(["draft", "--brief", brief, "--root", root, "--json"]);
  const before = fs.readFileSync(init.data.evidence_path, "utf8");
  const check = run(["check", "--acceptance", init.data.acceptance_path, "--evidence", init.data.evidence_path, "--json"]);
  const after = fs.readFileSync(init.data.evidence_path, "utf8");

  assert.equal(check.ok, true);
  assert.equal(check.data.acceptance_review.status, "clear");
  assert.equal(check.warnings.some((warning) => warning.type === "acceptance_review"), false);
  assert.equal(check.data.architecture_check.status, "needs-action");
  assert.equal(after, before);
});
