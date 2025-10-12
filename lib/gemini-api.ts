import { GeminiChatParametersSchema } from "@/lib/core/schemas";
import { createLogger } from "@/lib/infrastructure/logger";
import { geminiService } from "@/lib/services/gemini-service";
import { ResponseFormatter } from "@/lib/services/response-formatter";
import { TIMEOUT_CONFIG } from "../config";

// Helper to format SSE messages
const formatSse = ResponseFormatter.sse;

// Module logger
const logger = createLogger("gemini-api");

/**
 * Handles a Google search request by executing the `executeGoogleSearch` function.
 * This function is designed to be used by the Next.js API route.
 * @param query The search query string.
 * @param options Optional parameters for the search.
 * @returns A result object with success status, data or error, and a timestamp.
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
 * Handles a Gemini chat request by executing the `executeGeminiChat` function.
 * This function is designed to be used by the Next.js API route.
 * @param prompt The chat prompt string.
 * @param options Optional parameters for the chat.
 * @returns A result object with success status, data or error, and a timestamp.
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
 * Handles a Gemini chat request and streams the response using SSE.
 * @param prompt The chat prompt string.
 * @param options Optional parameters for the chat.
 * @returns A ReadableStream that emits SSE-formatted messages.
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
