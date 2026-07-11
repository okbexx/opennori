import { defineCommand } from "citty";
import { runCliAction } from "../cli-output.ts";
import { platformSessionMemory } from "../platform.ts";
import { ROOT_ARGS, configuredPlatform, hostSessionKey, readyProjectRoot } from "./common.ts";

const historySearchCommand = defineCommand({
  meta: { name: "search", description: "Find bounded prior host discussions for this project" },
  args: {
    ...ROOT_ARGS,
    query: { type: "string", description: "Topic to find in prior sessions", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const adapter = platformSessionMemory(configuredPlatform(root));
        return adapter.search(root, args.query, { excludeSessionId: hostSessionKey() });
      },
      (result) =>
        result.sessions.length === 0
          ? "No matching prior sessions were found for this project."
          : [
              ...result.sessions.map(
                (session) => `${session.session_id}  ${session.updated_at}  ${session.title}\n  ${session.excerpt}`
              ),
              "Next: Use opennori history show <session-id> to inspect one bounded excerpt."
            ].join("\n")
    );
  }
});

const historyShowCommand = defineCommand({
  meta: { name: "show", description: "Read one bounded prior host session excerpt" },
  args: {
    ...ROOT_ARGS,
    session: { type: "positional", description: "Host session id", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        return platformSessionMemory(configuredPlatform(root)).read(root, args.session);
      },
      (result) =>
        [
          `${result.title}  ${result.updated_at}`,
          ...result.messages.map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.text}`),
          ...(result.truncated ? ["Earlier or oversized history was omitted."] : [])
        ].join("\n\n")
    );
  }
});

export const historyCommand = defineCommand({
  meta: { name: "history", description: "Read bounded project history from the configured agent host" },
  subCommands: { search: historySearchCommand, show: historyShowCommand }
});
