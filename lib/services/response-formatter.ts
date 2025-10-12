/**
 * Response Formatter
 * Provides consistent response formatting across all API endpoints
 */

import type { ApiResponse, McpToolResponse, SseMessage } from "../core/types";

/**
 * Formats API responses with consistent structure
 */
export class ResponseFormatter {
  /**
   * Creates a successful API response
   */
  static success<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Creates an error API response
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
   * Formats a response for MCP tool
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
   * Formats an SSE message
   */
  static sse(message: SseMessage): string {
    return `data: ${JSON.stringify(message)}\n\n`;
  }
}
