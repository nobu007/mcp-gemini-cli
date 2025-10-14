/**
 * Gemini API Module
 *
 * Provides HTTP API handlers for integrating Gemini CLI operations into web applications.
 * This module serves as the presentation layer, delegating to the service layer for
 * actual business logic execution.
 *
 * @module gemini-api
 * @see {@link geminiService} for underlying service implementation
 * @see {@link ResponseFormatter} for response formatting standards
 *
 * @remarks
 * Architecture Layer: Presentation (API Handler)
 * - Validates HTTP request parameters
 * - Delegates to service layer (geminiService)
 * - Formats responses using ResponseFormatter
 * - Handles streaming via Server-Sent Events (SSE)
 *
 * @example Basic Usage in Next.js API Route
 * ```typescript
 * // app/api/search/route.ts
 * import { handleGoogleSearch } from '@/lib/gemini-api';
 *
 * export async function POST(request: Request) {
 *   const { query, limit } = await request.json();
 *   const result = await handleGoogleSearch(query, { limit });
 *   return Response.json(result);
 * }
 * ```
 *
 * @example Streaming Chat Response
 * ```typescript
 * // app/api/chat/stream/route.ts
 * import { handleGeminiChatStream } from '@/lib/gemini-api';
 *
 * export async function POST(request: Request) {
 *   const { prompt } = await request.json();
 *   const stream = handleGeminiChatStream(prompt);
 *   return new Response(stream, {
 *     headers: { 'Content-Type': 'text/event-stream' }
 *   });
 * }
 * ```
 */

import { GeminiChatParametersSchema } from "@/lib/core/schemas";
import { createLogger } from "@/lib/infrastructure/logger";
import { geminiService } from "@/lib/services/gemini-service";
import { ResponseFormatter } from "@/lib/services/response-formatter";
import { TIMEOUT_CONFIG } from "../config";

/**
 * Helper reference to SSE formatting function from ResponseFormatter.
 * Used for streaming chat responses.
 * @private
 */
const formatSse = ResponseFormatter.sse;

/**
 * Module-level logger for API operations.
 * @private
 */
const logger = createLogger("gemini-api");

/**
 * Handles a Google search request through the Gemini CLI.
 *
 * This function serves as the HTTP API handler for Google search operations.
 * It validates inputs, delegates to the service layer, and formats responses
 * in a consistent structure suitable for API consumption.
 *
 * @param query - The search query string (required, non-empty)
 * @param options - Optional configuration parameters
 * @param options.limit - Maximum number of search results to return (default: from CLI)
 * @param options.raw - If true, return raw search results without processing
 * @param options.sandbox - If true, execute in sandbox mode (restricted environment)
 * @param options.yolo - If true, bypass safety checks (use with caution)
 * @param options.model - Specific Gemini model to use (e.g., "gemini-pro")
 * @param options.workingDirectory - Working directory for CLI execution
 * @param options.apiKey - Google API key (falls back to environment variable)
 *
 * @returns A standardized response object with:
 *   - `success: true` and `data` containing search results on success
 *   - `success: false` and `error` containing error message on failure
 *   - `timestamp` in ISO 8601 format for all responses
 *
 * @throws Never throws - all errors are caught and returned in the response object
 *
 * @remarks
 * - Logs all requests with query preview and option presence
 * - Uses structured logging for debugging
 * - Automatically allows npx fallback for CLI execution
 * - Response format is consistent with {@link ResponseFormatter.success} and {@link ResponseFormatter.error}
 *
 * @example Basic Search
 * ```typescript
 * const result = await handleGoogleSearch("TypeScript best practices");
 * if (result.success) {
 *   console.log(result.data); // Search results as markdown
 * }
 * ```
 *
 * @example Advanced Search with Options
 * ```typescript
 * const result = await handleGoogleSearch("quantum computing", {
 *   limit: 5,
 *   model: "gemini-pro",
 *   sandbox: true
 * });
 * ```
 *
 * @see {@link geminiService.search} for underlying implementation
 * @see {@link ResponseFormatter} for response structure details
 */
export async function handleGoogleSearch(
  query: string,
  options: {
    limit?: number;
    raw?: boolean;
    sandbox?: boolean;
    yolo?: boolean;
    model?: string;
    workingDirectory?: string;
    apiKey?: string;
  } = {},
) {
  logger.info("handleGoogleSearch called", {
    query: query.substring(0, 100),
    hasOptions: Object.keys(options).length > 0,
  });
  try {
    const result = await geminiService.search(
      {
        query,
        ...options,
      },
      true,
    );

    logger.info("handleGoogleSearch successful");
    return ResponseFormatter.success(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`handleGoogleSearch failed: ${errorMessage}`);
    return ResponseFormatter.error(error);
  }
}

/**
 * Handles a Gemini chat request through the Gemini CLI.
 *
 * This function serves as the HTTP API handler for chat conversations with Gemini AI.
 * It validates inputs, delegates to the service layer, and returns formatted responses
 * suitable for synchronous HTTP API consumption (non-streaming).
 *
 * @param prompt - The chat prompt/message to send to Gemini (required, non-empty)
 * @param options - Optional configuration parameters
 * @param options.sandbox - If true, execute in sandbox mode (restricted environment)
 * @param options.yolo - If true, bypass safety checks (use with caution)
 * @param options.model - Specific Gemini model to use (e.g., "gemini-pro", "gemini-ultra")
 * @param options.workingDirectory - Working directory for CLI execution
 * @param options.apiKey - Google API key (falls back to environment variable)
 *
 * @returns A standardized response object with:
 *   - `success: true` and `data` containing the complete chat response on success
 *   - `success: false` and `error` containing error message on failure
 *   - `timestamp` in ISO 8601 format for all responses
 *
 * @throws Never throws - all errors are caught and returned in the response object
 *
 * @remarks
 * - This is the **non-streaming** version. For streaming, use {@link handleGeminiChatStream}
 * - Waits for complete response before returning (may take several seconds)
 * - Logs all requests with prompt length and option presence
 * - Uses structured logging for debugging
 * - Automatically allows npx fallback for CLI execution
 * - Response format is consistent with {@link ResponseFormatter.success} and {@link ResponseFormatter.error}
 *
 * @example Basic Chat
 * ```typescript
 * const result = await handleGeminiChat("Explain quantum entanglement");
 * if (result.success) {
 *   console.log(result.data); // Complete AI response
 * }
 * ```
 *
 * @example Chat with Model Selection
 * ```typescript
 * const result = await handleGeminiChat("Write a TypeScript function", {
 *   model: "gemini-pro",
 *   sandbox: true
 * });
 * ```
 *
 * @see {@link handleGeminiChatStream} for streaming version
 * @see {@link geminiService.chat} for underlying implementation
 * @see {@link ResponseFormatter} for response structure details
 */
export async function handleGeminiChat(
  prompt: string,
  options: {
    sandbox?: boolean;
    yolo?: boolean;
    model?: string;
    workingDirectory?: string;
    apiKey?: string;
  } = {},
) {
  logger.info("handleGeminiChat called", {
    promptLength: prompt.length,
    hasOptions: Object.keys(options).length > 0,
  });
  try {
    const result = await geminiService.chat(
      {
        prompt,
        ...options,
      },
      true,
    );

    logger.info("handleGeminiChat successful");
    return ResponseFormatter.success(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`handleGeminiChat failed: ${errorMessage}`);
    return ResponseFormatter.error(error);
  }
}

/**
 * Handles a Gemini chat request and streams the response using Server-Sent Events (SSE).
 *
 * This function serves as the HTTP API handler for streaming chat conversations with Gemini AI.
 * It provides real-time streaming of AI responses chunk-by-chunk, ideal for long-form content
 * and improving user experience with progressive content display.
 *
 * @param prompt - The chat prompt/message to send to Gemini (required, non-empty)
 * @param options - Optional configuration parameters
 * @param options.sandbox - If true, execute in sandbox mode (restricted environment)
 * @param options.yolo - If true, bypass safety checks (use with caution)
 * @param options.model - Specific Gemini model to use (e.g., "gemini-pro", "gemini-ultra")
 * @param options.workingDirectory - Working directory for CLI execution
 * @param options.apiKey - Google API key (falls back to environment variable)
 *
 * @returns A Web API ReadableStream that emits SSE-formatted messages:
 *   - `{type: "stdout", content: string}` - AI response chunks
 *   - `{type: "stderr", content: string}` - Warning/info messages
 *   - `{type: "close", content: string}` - Process exit notification
 *   - `{type: "error", content: string}` - Error messages
 *
 * @remarks
 * - This is the **streaming** version. For complete responses, use {@link handleGeminiChat}
 * - Implements automatic timeout handling ({@link TIMEOUT_CONFIG.CHAT_TIMEOUT_MS})
 * - Automatically terminates child processes on timeout with SIGTERM
 * - All messages are formatted using {@link ResponseFormatter.sse}
 * - Logs all stream lifecycle events (start, data, close, error)
 * - Does NOT allow npx fallback for streaming (security consideration)
 *
 * SSE Message Format:
 * ```
 * data: {"type":"stdout","content":"Hello"}\n\n
 * data: {"type":"stdout","content":" world"}\n\n
 * data: {"type":"close","content":"Process exited with code 0"}\n\n
 * ```
 *
 * @example Basic Streaming in Next.js API Route
 * ```typescript
 * // app/api/chat/stream/route.ts
 * import { handleGeminiChatStream } from '@/lib/gemini-api';
 *
 * export async function POST(request: Request) {
 *   const { prompt } = await request.json();
 *   const stream = handleGeminiChatStream(prompt);
 *
 *   return new Response(stream, {
 *     headers: {
 *       'Content-Type': 'text/event-stream',
 *       'Cache-Control': 'no-cache',
 *       'Connection': 'keep-alive',
 *     }
 *   });
 * }
 * ```
 *
 * @example Client-Side SSE Consumption
 * ```typescript
 * const eventSource = new EventSource('/api/chat/stream?prompt=Hello');
 *
 * eventSource.onmessage = (event) => {
 *   const message = JSON.parse(event.data);
 *   if (message.type === 'stdout') {
 *     console.log(message.content); // Progressive AI response
 *   }
 * };
 * ```
 *
 * @example Streaming with Options
 * ```typescript
 * const stream = handleGeminiChatStream("Write a long essay", {
 *   model: "gemini-pro",
 *   sandbox: true
 * });
 * ```
 *
 * @see {@link handleGeminiChat} for non-streaming version
 * @see {@link geminiService.chatStream} for underlying implementation
 * @see {@link ResponseFormatter.sse} for SSE message formatting
 * @see {@link TIMEOUT_CONFIG} for timeout configuration
 */
export function handleGeminiChatStream(
  prompt: string,
  options: {
    sandbox?: boolean;
    yolo?: boolean;
    model?: string;
    workingDirectory?: string;
    apiKey?: string;
  } = {},
) {
  logger.info("handleGeminiChatStream called", {
    promptLength: prompt.length,
    hasOptions: Object.keys(options).length > 0,
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const parsedArgs = GeminiChatParametersSchema.parse({
          prompt,
          ...options,
        });
        logger.debug("Parsed chat arguments for streaming", {
          hasPrompt: !!parsedArgs.prompt,
        });

        // Use the service layer for streaming
        const child = await geminiService.chatStream(parsedArgs, false);

        const timeout = setTimeout(() => {
          logger.warn(
            `Chat stream timed out after ${TIMEOUT_CONFIG.CHAT_TIMEOUT_MS}ms. Killing child process.`,
          );
          child.kill("SIGTERM");
        }, TIMEOUT_CONFIG.CHAT_TIMEOUT_MS);

        child.stdout.on("data", (data: Buffer) => {
          const content = data.toString();
          logger.debug(`STDOUT chunk received (${content.length} bytes)`);
          controller.enqueue(formatSse({ type: "stdout", content: content }));
        });

        child.stderr.on("data", (data: Buffer) => {
          const content = data.toString();
          logger.warn(`STDERR chunk: ${content.trim()}`);
          controller.enqueue(formatSse({ type: "stderr", content: content }));
        });

        child.on("close", (code) => {
          clearTimeout(timeout);
          logger.info(`Child process closed with code ${code}`);
          controller.enqueue(
            formatSse({
              type: "close",
              content: `Process exited with code ${code}`,
            }),
          );
          controller.close();
        });

        child.on("error", (err) => {
          clearTimeout(timeout);
          logger.error(`Child process error: ${err.message}`);
          controller.enqueue(
            formatSse({ type: "error", content: err.message }),
          );
          controller.error(err);
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(`Failed to start chat stream: ${errorMessage}`);
        controller.enqueue(
          formatSse({
            type: "error",
            content: `Failed to start stream: ${errorMessage}`,
          }),
        );
        controller.close();
      }
    },
  });

  return stream;
}
