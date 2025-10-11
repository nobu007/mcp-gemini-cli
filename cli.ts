#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  decideGeminiCliCommand,
  executeGoogleSearch,
  executeGeminiChat,
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

  // Register googleSearch tool
  server.tool(
    "googleSearch",
    "Performs a Google search using gemini-cli and returns structured results.",
    {
      query: z.string().describe("The search query."),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of results to return (optional)."),
      raw: z
        .boolean()
        .optional()
        .describe(
          "Return raw search results with URLs and snippets (optional).",
        ),
      sandbox: z
        .boolean()
        .optional()
        .describe("Run gemini-cli in sandbox mode."),
      yolo: z
        .boolean()
        .optional()
        .describe("Automatically accept all actions (aka YOLO mode)."),
      model: z
        .string()
        .optional()
        .describe(
          'The Gemini model to use. Recommended: "gemini-1.5-pro" (default) or "gemini-1.5-flash". Both models are confirmed to work with Google login.',
        ),
      workingDirectory: z
        .string()
        .optional()
        .describe(
          "Working directory path for gemini-cli execution (optional).",
        ),
      apiKey: z
        .string()
        .optional()
        .describe("Gemini API key for authentication (optional)."),
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
  server.tool(
    "geminiChat",
    "Engages in a chat conversation with gemini-cli.",
    {
      prompt: z.string().describe("The prompt for the chat conversation."),
      sandbox: z
        .boolean()
        .optional()
        .describe("Run gemini-cli in sandbox mode."),
      yolo: z
        .boolean()
        .optional()
        .describe("Automatically accept all actions (aka YOLO mode)."),
      model: z
        .string()
        .optional()
        .describe(
          'The Gemini model to use. Recommended: "gemini-1.5-pro" (default) or "gemini-1.5-flash". Both models are confirmed to work with Google login.',
        ),
      workingDirectory: z
        .string()
        .optional()
        .describe(
          "Working directory path for gemini-cli execution (optional).",
        ),
      apiKey: z
        .string()
        .optional()
        .describe("Gemini API key for authentication (optional)."),
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

  // Connect the server to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only run if this file is being executed directly
if (import.meta.main) {
  startMcpServer().catch(console.error);
}
