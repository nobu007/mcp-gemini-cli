import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TOOL_DEFINITIONS } from "./lib/core/schemas.js";
import {
  decideGeminiCliCommand,
  executeGeminiChat,
  executeGoogleSearch,
} from "./lib/tools.js";

async function startMcpServer() {
  // Check for --allow-npx argument
  const allowNpx = process.argv.includes("--allow-npx");

  // Check if gemini-cli is available at startup
  try {
    await decideGeminiCliCommand(allowNpx);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(
      "Please install gemini-cli globally or use --allow-npx option.",
    );
    process.exit(1);
  }

  const server = new McpServer({
    name: "mcp-gemini-cli",
    version: "0.2.0",
  });

  // Register googleSearch tool using centralized definitions
  server.tool(
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
  server.tool(
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

  // Connect the server to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only run if this file is being executed directly
if (import.meta.main) {
  startMcpServer().catch(console.error);
}
