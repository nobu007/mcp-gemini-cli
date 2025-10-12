/**
 * Core Schemas
 * Centralized Zod schema definitions for all tools
 * Single source of truth to eliminate duplication
 */

import { z } from "zod";

/**
 * Base parameters common to all Gemini CLI operations
 */
const BaseGeminiParametersSchema = z.object({
  sandbox: z.boolean().optional().describe("Run gemini-cli in sandbox mode."),
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
    .describe("Working directory path for gemini-cli execution (optional)."),
  apiKey: z
    .string()
    .optional()
    .describe("Gemini API key for authentication (optional)."),
});

/**
 * Google Search tool parameters
 */
export const GoogleSearchParametersSchema = BaseGeminiParametersSchema.extend({
  query: z.string().describe("The search query."),
  limit: z
    .number()
    .optional()
    .describe("Maximum number of results to return (optional)."),
  raw: z
    .boolean()
    .optional()
    .describe("Return raw search results with URLs and snippets (optional)."),
});

/**
 * Gemini Chat tool parameters
 */
export const GeminiChatParametersSchema = BaseGeminiParametersSchema.extend({
  prompt: z.string().describe("The prompt for the chat conversation."),
});

/**
 * Type exports for TypeScript type checking
 */
export type GoogleSearchParameters = z.infer<
  typeof GoogleSearchParametersSchema
>;
export type GeminiChatParameters = z.infer<typeof GeminiChatParametersSchema>;
export type BaseGeminiParameters = z.infer<typeof BaseGeminiParametersSchema>;

/**
 * Tool schema definitions for MCP server registration
 * These provide the exact format needed by McpServer.tool()
 */
export const GoogleSearchToolSchema = GoogleSearchParametersSchema.shape;
export const GeminiChatToolSchema = GeminiChatParametersSchema.shape;

/**
 * Tool metadata for consistent registration
 */
export const TOOL_DEFINITIONS = {
  googleSearch: {
    name: "googleSearch",
    description:
      "Performs a Google search using gemini-cli and returns structured results.",
    schema: GoogleSearchToolSchema,
  },
  geminiChat: {
    name: "geminiChat",
    description: "Engages in a chat conversation with gemini-cli.",
    schema: GeminiChatToolSchema,
  },
} as const;
