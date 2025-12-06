/**
 * Simple echo tool for testing MCP server connection
 */

import type { ToolResponse } from "../shared/types.js";

export async function tutorEcho({ message }: { message: string }): Promise<ToolResponse> {
  return {
    content: [
      {
        type: "text",
        text: `Tutor server received: "${message}". This proves the MCP plumbing works.`,
      },
    ],
  };
}
