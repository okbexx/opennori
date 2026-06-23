import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MCP_RESOURCE_DESCRIPTORS, buildMcpResource, mcpResourceText } from "./resources.ts";

export type OpenNoriMcpServerOptions = {
  root: string;
  version: string;
  goalId?: string;
};

export function createOpenNoriMcpServer(options: OpenNoriMcpServerOptions): McpServer {
  const server = new McpServer({
    name: "opennori",
    version: options.version
  });

  for (const resource of MCP_RESOURCE_DESCRIPTORS) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        title: resource.title,
        description: resource.description,
        mimeType: resource.mimeType
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: resource.mimeType,
            text: mcpResourceText(buildMcpResource(resource.name, options.root, { goalId: options.goalId }))
          }
        ]
      })
    );
  }

  return server;
}

export async function serveOpenNoriMcpStdio(options: OpenNoriMcpServerOptions): Promise<void> {
  const server = createOpenNoriMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
