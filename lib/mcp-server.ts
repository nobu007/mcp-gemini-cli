import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL_DEFINITIONS } from "@/lib/core/schemas";
import { executeGeminiChat, executeGoogleSearch } from "@/lib/tools";

// Allow Npx should be configured somewhere, for now, it's true
const allowNpx = true;

export const mcpServer = new McpServer({
  name: "mcp-gemini-cli",
  version: "0.2.0",
});

// Register googleSearch tool using centralized definitions
mcpServer.tool(
  TOOL_DEFINITIONS.googleSearch.name,
  TOOL_DEFINITIONS.googleSearch.description,
  TOOL_DEFINITIONS.googleSearch.schema,
  async (args) => {
    const result = await executeGoogleSearch(args, allowNpx);
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

// Register geminiChat tool using centralized definitions
mcpServer.tool(
  TOOL_DEFINITIONS.geminiChat.name,
  TOOL_DEFINITIONS.geminiChat.description,
  TOOL_DEFINITIONS.geminiChat.schema,
  async (args) => {
    const result = await executeGeminiChat(args, allowNpx);
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

console.log("[mcp-server] Tools registered successfully");
