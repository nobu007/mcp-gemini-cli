import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  GoogleSearchParametersSchema,
  GeminiChatParametersSchema,
  executeGoogleSearch,
  executeGeminiChat,
} from "@/lib/tools";

// Allow Npx should be configured somewhere, for now, it's true
const allowNpx = true;

export const mcpServer = new McpServer({
  name: "mcp-gemini-cli",
  version: "0.2.0",
});

// Register googleSearch tool
mcpServer.registerTool(
  "googleSearch",
  {
    description:
      "Performs a Google search using gemini-cli and returns structured results.",
    inputSchema: GoogleSearchParametersSchema.shape,
  },
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

// Register geminiChat tool
mcpServer.registerTool(
  "geminiChat",
  {
    description: "Engages in a chat conversation with gemini-cli.",
    inputSchema: GeminiChatParametersSchema.shape,
  },
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
