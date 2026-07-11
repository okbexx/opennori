import { withExclusiveLock } from "../../dist/src/exclusive-lock.js";

const [lockTarget, duration] = process.argv.slice(2);
if (!lockTarget || !duration) throw new Error("Usage: hold-lock.mjs <target> <duration-ms>");

withExclusiveLock(lockTarget, "integration test lock", () => {
  process.stdout.write("locked\n");
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Number(duration));
});
