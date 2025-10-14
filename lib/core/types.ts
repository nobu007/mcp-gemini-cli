/**
 * Core Types
 * Shared TypeScript interfaces and type definitions
 */

/**
 * Standard API response format
 * @template T - The type of the response data (defaults to unknown)
 */
export interface ApiResponse<T = unknown> {
  /** Indicates whether the operation succeeded */
  readonly success: boolean;
  /** The response data (only present on success) */
  readonly data?: T;
  /** Error message (only present on failure) */
  readonly error?: string;
  /** ISO 8601 timestamp of the response */
  readonly timestamp: string;
}

/**
 * SSE (Server-Sent Events) message types
 */
export type SseMessageType = "stdout" | "stderr" | "close" | "error";

/**
 * SSE message structure for streaming responses
 */
export interface SseMessage {
  /** The type of SSE message */
  readonly type: SseMessageType;
  /** The message content */
  readonly content: string;
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
  /** The resolved command path or executable name */
  readonly command: string;
  /** Initial arguments to prepend to the command (e.g., for npx) */
  readonly initialArgs: readonly string[];
}

/**
 * A generic Result type for operations that can either succeed or fail.
 * @template T - The type of the success value
 * @template E - The type of the error (defaults to Error)
 * @example
 * ```typescript
 * const result: Result<string, CustomError> =
 *   condition ? { success: true, value: "data" }
 *            : { success: false, error: new CustomError() };
 * ```
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };
