/**
 * MCP Server Configuration
 *
 * This module configures and exports the Model Context Protocol (MCP) server
 * for integrating Gemini CLI tools with Claude Desktop and other MCP clients.
 *
 * @module mcp-server
 * @see {@link https://modelcontextprotocol.io/} for MCP specification
 *
 * @remarks
 * Architecture Layer: Presentation (MCP Adapter)
 * - Registers Gemini CLI tools with MCP server
 * - Provides standardized tool interfaces for MCP clients
 * - Delegates to service layer via {@link executeGoogleSearch} and {@link executeGeminiChat}
 *
 * Tool Registration:
 * - Uses centralized {@link TOOL_DEFINITIONS} from core/schemas.ts
 * - Single source of truth for tool names, descriptions, and schemas
 * - Automatic schema validation via Zod
 *
 * @example Using this MCP server with Claude Desktop
 * ```json
 * // claude_desktop_config.json
 * {
 *   "mcpServers": {
 *     "gemini-cli": {
 *       "command": "node",
 *       "args": ["path/to/build/index.js"]
 *     }
 *   }
 * }
 * ```
 *
 * @example Available Tools
 * - **googleSearch**: Search Google using Gemini AI with query understanding
 * - **geminiChat**: Chat with Gemini AI for general-purpose conversations
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL_DEFINITIONS } from "@/lib/core/schemas";
import { executeGeminiChat, executeGoogleSearch } from "@/lib/tools";

/**
 * Configuration flag to allow npx fallback for Gemini CLI.
 * When true, falls back to 'npx gemini-cli' if 'gemini' is not in PATH.
 *
 * @remarks
 * TODO: Should be configurable via environment variable (e.g., ALLOW_NPX=true)
 */
const allowNpx = true;

/**
 * MCP Server instance for Gemini CLI tools.
 *
 * Configured with:
 * - Name: "mcp-gemini-cli"
 * - Version: "0.2.0"
 * - Tools: googleSearch, geminiChat
 *
 * @public
 */
export const mcpServer = new McpServer({
  name: "mcp-gemini-cli",
  version: "0.2.0",
});

/**
 * Register googleSearch tool with MCP server.
 *
 * Provides Google search capability powered by Gemini AI for query understanding
 * and result processing.
 *
 * @remarks
 * - Uses centralized definition from {@link TOOL_DEFINITIONS.googleSearch}
 * - Automatically validates input parameters via Zod schema
 * - Returns results in MCP-compatible format (text content)
 *
 * Tool Parameters:
 * - query (required): Search query string
 * - limit (optional): Maximum number of results
 * - model (optional): Gemini model to use
 * - Additional options: raw, sandbox, yolo, workingDirectory, apiKey
 *
 * @see {@link executeGoogleSearch} for implementation details
 */
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

/**
 * Register geminiChat tool with MCP server.
 *
 * Provides conversational AI capability powered by Gemini for general-purpose
 * question answering, code generation, and reasoning tasks.
 *
 * @remarks
 * - Uses centralized definition from {@link TOOL_DEFINITIONS.geminiChat}
 * - Automatically validates input parameters via Zod schema
 * - Returns results in MCP-compatible format (text content)
 * - This is the **non-streaming** version (waits for complete response)
 *
 * Tool Parameters:
 * - prompt (required): Chat prompt/message string
 * - model (optional): Gemini model to use
 * - Additional options: sandbox, yolo, workingDirectory, apiKey
 *
 * @see {@link executeGeminiChat} for implementation details
 */
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

/**
 * Log successful tool registration.
 * This console.log is intentional for server initialization feedback.
 */
console.log("[mcp-server] Tools registered successfully");
