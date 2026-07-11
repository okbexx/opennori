# Public API

`opennori` is an ESM package for Node.js 20 or newer. Its root export preserves
the complete validated kernel used by the CLI. Stable subpath exports let
integrations depend on one domain without treating CLI and lifecycle internals
as their API.

```js
import {
  OPENNORI_API_VERSION,
  doctorProject,
  loadTaskView,
  planTaskDelivery,
  planUpdate,
  updateProject
} from "opennori";
```

## Entrypoints

| Import | Responsibility |
| --- | --- |
| `opennori` | Backward-compatible aggregate API plus host setup |
| `opennori/task` | Task, Contract, Context, Evidence, delivery, reports, and completion projections |
| `opennori/project` | Project initialization, managed lifecycle, state migration, and Doctor |
| `opennori/memory` | Bounded, project-scoped, read-only Codex session memory |
| `opennori/testing` | Schema-checked records, recording host runners, and temporary Git projects |

Prefer a domain subpath for new integrations:

```js
import { createTask, loadTaskView, planTaskDelivery } from "opennori/task";
import { doctorProject, planUpdate } from "opennori/project";
import { codexSessionMemoryAdapter } from "opennori/memory";
```

Verify integrations can execute command Evidence without a shell and load only
selected curated context files:

```js
import { loadContextBundle, runCommandEvidence } from "opennori/task";

const context = loadContextBundle(root, task.id, "check", {
  file: "test/workflow.test.mjs"
});
const evidence = runCommandEvidence(root, taskDirectory, task, contract, {
  outcome_id: "outcome-workflow",
  summary: "The workflow checks passed",
  command: "npm",
  args: ["test"]
});
```

`runCommandEvidence` derives `proven` from exit 0 and `failed` from another
numeric exit code. It records exact argv, project-relative cwd, stdout, and
stderr. The optional injected `HostCommandRunner` remains available for
integration tests.

The test kit is intended for integration and adapter tests. Its builders run
the packaged JSON Schemas, and its Git helper calls the official `git` CLI:

```js
import {
  buildContract,
  buildTaskRecord,
  createRecordingHostCommandRunner,
  createTemporaryGitProject
} from "opennori/testing";

const task = buildTaskRecord({ creator: "Adapter Test" });
const contract = buildContract({ task_id: task.id });
const commands = createRecordingHostCommandRunner();
const project = createTemporaryGitProject();

try {
  // Exercise the integration with project.root, contract, and commands.runner.
} finally {
  project.cleanup();
}
```

## Stability

- `OPENNORI_API_VERSION` changes when an existing exported contract has an
  intentional breaking change.
- Package versions follow Semantic Versioning. Before `1.0.0`, minor releases
  may advance the API version and must document the migration in the changelog.
- Root and documented subpath exports, JSON Schema ids, error codes, and
  `--json` payloads are public integration contracts unless explicitly
  documented as diagnostic context.
- Files under `dist/src/` are implementation output. Import only from
  `opennori` or a documented subpath; undeclared subpath imports are
  unsupported.
- Every entrypoint exports the same `OPENNORI_API_VERSION`. Adding an
  entrypoint or export is backward-compatible; removing or changing one
  requires an API version change.

## Boundaries

Public functions retain the same filesystem safety, schema validation, task and
project locks, confirmation requirements, and completion gates as CLI commands.
Callers provide explicit project roots and host session ids where required.

Lifecycle planning functions are read-only. Apply functions require explicit
confirmation. Git delivery functions call the official `git` and `gh` CLIs and
validate their results; they do not expose a custom Git transport.

Do not write canonical JSON or JSONL directly. Markdown reports and Contract
views are output surfaces and are never accepted as state input.

## Package Boundary

The public domains remain in one npm package while the CLI and integrations
share a release cycle. Node package exports and the existing TypeScript build
provide the required encapsulation without another workspace, bundler, or
dependency. A physical core package is justified only when a real downstream
package needs an independent installation or version lifecycle.
