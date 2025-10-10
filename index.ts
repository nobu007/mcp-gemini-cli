import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { mcpServer } from "./lib/mcp-server.js";
import { decideGeminiCliCommand } from "./lib/tools.js";

/**
 * The main function of the MCP server.
 * It initializes the McpServer, registers the `googleSearch` and `geminiChat` tools,
 * and connects the server to a StdioServerTransport.
 */
async function main() {
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

  // Connect the server to stdio transport
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

// Only run main if this file is being executed directly
if (import.meta.main) {
  main().catch(console.error);
}
