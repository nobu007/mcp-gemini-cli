import {
  executeGoogleSearch,
  executeGeminiChat,
  decideGeminiCliCommand,
  streamGeminiCli,
  GeminiChatParametersSchema,
} from "@/lib/tools";
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
  console.log(
    `[gemini-api] handleGoogleSearch called with query: "${query}", options: ${JSON.stringify(options)}`,
  );
  try {
    const result = await executeGoogleSearch(
      {
        query,
        ...options,
      },
      true,
    );

    console.log("[gemini-api] handleGoogleSearch successful.");
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[gemini-api] handleGoogleSearch failed: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
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
  console.log(
    `[gemini-api] handleGeminiChat called with prompt: "${prompt.substring(0, 100)}...", options: ${JSON.stringify(options)}`,
  );
  try {
    const result = await executeGeminiChat(
      {
        prompt,
        ...options,
      },
      true,
    );

    console.log("[gemini-api] handleGeminiChat successful.");
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[gemini-api] handleGeminiChat failed: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
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
  console.log(
    `[gemini-api] handleGeminiChatStream called with prompt: "${prompt.substring(0, 100)}...", options: ${JSON.stringify(options)}`,
  );

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const parsedArgs = GeminiChatParametersSchema.parse({
          prompt,
          ...options,
        });
        console.log(
          `[gemini-api] Parsed chat arguments: ${JSON.stringify(parsedArgs)}`,
        );

        // In the context of the API server, we don't expect to use npx.
        const geminiCliCmd = await decideGeminiCliCommand(false);
        console.log(
          `[gemini-api] Gemini CLI command decided: ${JSON.stringify(geminiCliCmd)}`,
        );

        const workingDir =
          parsedArgs.workingDirectory || process.env.GEMINI_CLI_WORKING_DIR;

        const envVars: Record<string, string | undefined> = {};
        if (parsedArgs.apiKey) {
          // Use the provided API key
          envVars.GEMINI_API_KEY = parsedArgs.apiKey;
        } else {
          // Explicitly prevent inheriting GEMINI_API_KEY from the parent process
          // to allow fallback to local authentication (e.g., gcloud auth).
          envVars.GEMINI_API_KEY = undefined;
        }

        // Mask API key for logging
        const loggedEnvVars = { ...envVars };
        if (loggedEnvVars.GEMINI_API_KEY) {
          loggedEnvVars.GEMINI_API_KEY = "[MASKED]";
        }
        console.log(
          `[gemini-api] Working directory: ${workingDir}, Environment variables: ${JSON.stringify(loggedEnvVars)}`,
        );

        const cliArgs = ["-p", parsedArgs.prompt];
        if (parsedArgs.sandbox) cliArgs.push("-s");
        if (parsedArgs.yolo) cliArgs.push("-y");
        if (parsedArgs.model) cliArgs.push("-m", parsedArgs.model);
        console.log(
          `[gemini-api] CLI arguments for streaming: ${cliArgs.join(" ")}`,
        );

        const child = streamGeminiCli(
          geminiCliCmd,
          cliArgs,
          workingDir,
          envVars,
        );

        const timeout = setTimeout(() => {
          console.warn(
            `[gemini-api] Chat stream timed out after ${TIMEOUT_CONFIG.CHAT_TIMEOUT_MS}ms. Killing child process.`,
          );
          child.kill("SIGTERM");
        }, TIMEOUT_CONFIG.CHAT_TIMEOUT_MS);

        child.stdout.on("data", (data: Buffer) => {
          const content = data.toString();
          console.log(`[gemini-api] STDOUT chunk: ${content.trim()}`);
          controller.enqueue(formatSse({ type: "stdout", content: content }));
        });

        child.stderr.on("data", (data: Buffer) => {
          const content = data.toString();
          console.error(`[gemini-api] STDERR chunk: ${content.trim()}`);
          controller.enqueue(formatSse({ type: "stderr", content: content }));
        });

        child.on("close", (code) => {
          clearTimeout(timeout);
          console.log(`[gemini-api] Child process closed with code ${code}.`);
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
          console.error(`[gemini-api] Child process error: ${err.message}`);
          controller.enqueue(
            formatSse({ type: "error", content: err.message }),
          );
          controller.error(err);
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[gemini-api] Failed to start chat stream: ${errorMessage}`,
        );
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
