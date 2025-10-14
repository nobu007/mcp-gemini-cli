/**
 * Response Formatter
 * Provides consistent response formatting across all API endpoints
 */

import type { ApiResponse, McpToolResponse, SseMessage } from "../core/types";

/**
 * Formats API responses with consistent structure across all endpoints
 *
 * @remarks
 * This utility class provides static methods for creating standardized response formats
 * for different communication protocols (HTTP API, MCP Tools, Server-Sent Events).
 * All responses include ISO 8601 timestamps for auditability.
 *
 * @example
 * ```typescript
 * // Success response
 * const response = ResponseFormatter.success({ result: "completed" });
 * // { success: true, data: { result: "completed" }, timestamp: "2025-10-14T13:20:00.000Z" }
 *
 * // Error response
 * const errorResponse = ResponseFormatter.error(new Error("Failed"));
 * // { success: false, error: "Failed", timestamp: "2025-10-14T13:20:00.000Z" }
 * ```
 */
export class ResponseFormatter {
  /**
   * Creates a successful API response with consistent structure
   *
   * @template T - The type of the response data
   * @param data - The data to include in the response
   * @returns A standardized success response object
   *
   * @example
   * ```typescript
   * const response = ResponseFormatter.success({ count: 42, items: [...] });
   * // { success: true, data: { count: 42, items: [...] }, timestamp: "..." }
   * ```
   */
  static success<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Creates an error API response with consistent structure
   *
   * @param error - The error to format (Error object, string, or unknown)
   * @returns A standardized error response object
   *
   * @example
   * ```typescript
   * const response = ResponseFormatter.error(new Error("Database connection failed"));
   * // { success: false, error: "Database connection failed", timestamp: "..." }
   * ```
   */
  static error(error: unknown): ApiResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Formats a response for MCP tool protocol
   *
   * @param result - The result string to include in the MCP response
   * @returns An MCP-compliant tool response object
   *
   * @remarks
   * MCP tools expect a specific response format with a `content` array
   * containing text entries. This method ensures compliance with the protocol.
   *
   * @example
   * ```typescript
   * const mcpResponse = ResponseFormatter.mcpTool("Search completed successfully");
   * // { content: [{ type: "text", text: "Search completed successfully" }] }
   * ```
   */
  static mcpTool(result: string): McpToolResponse {
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  }

  /**
   * Formats a Server-Sent Events (SSE) message
   *
   * @param message - The SSE message object to format
   * @returns A properly formatted SSE message string ready for streaming
   *
   * @remarks
   * SSE format requires `data:` prefix and double newline terminator.
   * The message is JSON-serialized to preserve structure.
   *
   * @example
   * ```typescript
   * const sseMessage = ResponseFormatter.sse({ type: "progress", content: "50%" });
   * // "data: {\"type\":\"progress\",\"content\":\"50%\"}\n\n"
   * ```
   */
  static sse(message: SseMessage): string {
    return `data: ${JSON.stringify(message)}\n\n`;
  }
}
