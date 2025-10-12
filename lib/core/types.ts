/**
 * Core Types
 * Shared TypeScript interfaces and type definitions
 */

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * SSE (Server-Sent Events) message types
 */
export type SseMessageType = "stdout" | "stderr" | "close" | "error";

export interface SseMessage {
  type: SseMessageType;
  content: string;
}

/**
 * MCP tool response format
 */
export interface McpToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
}

/**
 * Gemini CLI command resolution result
 */
export interface GeminiCliCommand {
  command: string;
  initialArgs: string[];
}
