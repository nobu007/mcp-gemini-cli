/**
 * Tools Module - Refactored
 * This module now serves as a thin adapter layer to maintain backward compatibility
 * All actual implementation has been moved to the proper architectural layers
 */

// Re-export schemas from the centralized core layer
export {
  type GeminiChatParameters,
  GeminiChatParametersSchema,
  type GoogleSearchParameters,
  GoogleSearchParametersSchema,
} from "./core/schemas";

// Import schemas for validation
import {
  GeminiChatParametersSchema,
  GoogleSearchParametersSchema,
} from "./core/schemas";

// Re-export types for backward compatibility
export type { GeminiCliCommand } from "./core/types";

import { GeminiCliResolver } from "./infrastructure/gemini-cli-resolver";
// Import the service layer
import { geminiService } from "./services/gemini-service";

/**
 * @deprecated Use GeminiCliResolver.resolve() directly
 * Kept for backward compatibility
 */
export async function decideGeminiCliCommand(
  allowNpx: boolean,
): Promise<{ command: string; initialArgs: string[] }> {
  return GeminiCliResolver.resolve(allowNpx);
}

/**
 * @deprecated Use GeminiCliExecutor directly from infrastructure layer
 * Kept for backward compatibility
 */
export async function executeGeminiCli(
  geminiCliCommand: { command: string; initialArgs: string[] },
  args: string[],
  timeoutMs?: number,
  workingDirectory?: string,
  env?: Record<string, string | undefined>,
): Promise<string> {
  const { GeminiCliExecutor } = await import(
    "./infrastructure/gemini-cli-executor"
  );
  const executor = new GeminiCliExecutor();
  return executor.execute(geminiCliCommand, args, {
    timeoutMs,
    workingDirectory,
    env,
  });
}

/**
 * @deprecated Use GeminiCliExecutor.stream() directly
 * Kept for backward compatibility with gemini-api.ts
 */
export async function streamGeminiCli(
  geminiCliCommand: { command: string; initialArgs: string[] },
  args: string[],
  workingDirectory?: string,
  env?: Record<string, string | undefined>,
) {
  // Use dynamic import to avoid circular dependencies at module load time
  const { GeminiCliExecutor } = await import(
    "./infrastructure/gemini-cli-executor"
  );
  const executor = new GeminiCliExecutor();
  return executor.stream(geminiCliCommand, args, {
    workingDirectory,
    env,
  });
}

/**
 * Executes a Google search using the gemini-cli.
 * Now delegates to the service layer for actual implementation.
 * @param args - The arguments for the search
 * @param allowNpx - If true, allows using npx as a fallback
 * @returns The search result as a string
 */
export async function executeGoogleSearch(args: unknown, allowNpx = false) {
  // Validate and parse arguments using the schema
  const parsedArgs = GoogleSearchParametersSchema.parse(args);
  return geminiService.search(parsedArgs, allowNpx);
}

/**
 * Executes a chat conversation using the gemini-cli.
 * Now delegates to the service layer for actual implementation.
 * @param args - The arguments for the chat
 * @param allowNpx - If true, allows using npx as a fallback
 * @returns The chat response as a string
 */
export async function executeGeminiChat(args: unknown, allowNpx = false) {
  // Validate and parse arguments using the schema
  const parsedArgs = GeminiChatParametersSchema.parse(args);
  return geminiService.chat(parsedArgs, allowNpx);
}
