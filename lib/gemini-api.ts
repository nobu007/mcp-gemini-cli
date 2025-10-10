import {
  executeGoogleSearch,
  executeGeminiChat,
  decideGeminiCliCommand,
  streamGeminiCli,
  GeminiChatParametersSchema,
} from "../index";
import { TIMEOUT_CONFIG } from "../config";

// Helper to format SSE messages
const formatSse = (data: object) => `data: ${JSON.stringify(data)}\n\n`;

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
  try {
    const result = await executeGoogleSearch(
      {
        query,
        ...options,
      },
      true,
    );

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
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
  try {
    const result = await executeGeminiChat(
      {
        prompt,
        ...options,
      },
      true,
    );

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
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
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const parsedArgs = GeminiChatParametersSchema.parse({
          prompt,
          ...options,
        });
        // In the context of the API server, we don't expect to use npx.
        const geminiCliCmd = await decideGeminiCliCommand(false);

        const workingDir =
          parsedArgs.workingDirectory || process.env.GEMINI_CLI_WORKING_DIR;
        const envVars: Record<string, string> = {};
        if (parsedArgs.apiKey) {
          envVars.GEMINI_API_KEY = parsedArgs.apiKey;
        }

        const cliArgs = ["-p", parsedArgs.prompt];
        if (parsedArgs.sandbox) cliArgs.push("-s");
        if (parsedArgs.yolo) cliArgs.push("-y");
        if (parsedArgs.model) cliArgs.push("-m", parsedArgs.model);

        const child = streamGeminiCli(
          geminiCliCmd,
          cliArgs,
          workingDir,
          envVars,
        );

        const timeout = setTimeout(() => {
          child.kill("SIGTERM");
        }, TIMEOUT_CONFIG.CHAT_TIMEOUT_MS);

        child.stdout.on("data", (data: Buffer) => {
          controller.enqueue(
            formatSse({ type: "stdout", content: data.toString() }),
          );
        });

        child.stderr.on("data", (data: Buffer) => {
          controller.enqueue(
            formatSse({ type: "stderr", content: data.toString() }),
          );
        });

        child.on("close", (code) => {
          clearTimeout(timeout);
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
          controller.enqueue(
            formatSse({ type: "error", content: err.message }),
          );
          controller.error(err);
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
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
