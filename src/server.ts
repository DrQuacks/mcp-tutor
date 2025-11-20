import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

async function main() {
  const server = new McpServer({
    name: "mcp-tutor",
    version: "0.0.1",
  });

  server.registerTool(
    "tutor_echo",
    {
      description:
        "Echo back a message from the user (for testing the MCP server connection).",
      inputSchema: z.object({
        message: z
          .string()
          .describe(
            "Any message you want the tutor server to echo back."
          ),
      }),
    },
    async ({ message }) => ({
      content: [
        {
          type: "text",
          text: `Tutor server received: "${message}". This proves the MCP plumbing works.`,
        },
      ],
    })
  );

  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("[mcp-tutor] MCP server started on stdio");
}

main().catch((err) => {
  console.error("[mcp-tutor] Fatal error:", err);
  process.exit(1);
});