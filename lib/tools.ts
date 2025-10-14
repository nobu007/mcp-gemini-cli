/**
 * Tools Module - Backward Compatibility Adapter
 *
 * This module serves as a thin adapter layer maintaining backward compatibility
 * while the actual implementation has been refactored into proper architectural layers.
 *
 * @module tools
 * @deprecated Most functions in this module are deprecated. Use service layer directly.
 *
 * @remarks
 * Architecture Layer: Presentation (Compatibility Adapter)
 * - **DO NOT** add new implementations to this file
 * - **DO** use this for backward compatibility with existing consumers
 * - **DO** guide new code to use service layer directly
 *
 * Migration Path:
 * ```typescript
 * // Old (deprecated):
 * import { executeGoogleSearch } from '@/lib/tools';
 *
 * // New (recommended):
 * import { geminiService } from '@/lib/services/gemini-service';
 * const result = await geminiService.search(params);
 * ```
 *
 * @see {@link geminiService} for new service-based API
 * @see {@link GeminiCliExecutor} for direct infrastructure access
 *
 * @example Schema Re-exports (Still Recommended)
 * ```typescript
 * import {
 *   GoogleSearchParametersSchema,
 *   GeminiChatParametersSchema
 * } from '@/lib/tools';
 *
 * const params = GoogleSearchParametersSchema.parse({ query: "hello" });
 * ```
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
 * Decides which Gemini CLI command to use (direct or npx).
 *
 * @deprecated Use {@link GeminiCliResolver.resolve} directly instead
 *
 * This function is kept for backward compatibility. New code should use
 * the GeminiCliResolver class directly from the infrastructure layer.
 *
 * @param allowNpx - If true, allows falling back to 'npx gemini-cli' when 'gemini' is not in PATH
 *
 * @returns A command object with:
 *   - `command`: The command to execute ("gemini" or "npx")
 *   - `initialArgs`: Initial arguments ([] or ["gemini-cli"])
 *
 * @example Deprecated Usage
 * ```typescript
 * const cmd = await decideGeminiCliCommand(true);
 * // cmd = { command: "gemini", initialArgs: [] } or
 * //       { command: "npx", initialArgs: ["gemini-cli"] }
 * ```
 *
 * @example Recommended Migration
 * ```typescript
 * import { GeminiCliResolver } from '@/lib/infrastructure/gemini-cli-resolver';
 * const cmd = await GeminiCliResolver.resolve(true);
 * ```
 *
 * @see {@link GeminiCliResolver.resolve} for the recommended API
 */
export async function decideGeminiCliCommand(
  allowNpx: boolean,
): Promise<{ command: string; initialArgs: string[] }> {
  return GeminiCliResolver.resolve(allowNpx);
}

/**
 * Executes a Gemini CLI command with specified arguments.
 *
 * @deprecated Use {@link GeminiCliExecutor} directly from infrastructure layer
 *
 * This function is kept for backward compatibility. New code should use
 * the GeminiCliExecutor class directly from the infrastructure layer.
 *
 * @param geminiCliCommand - Command object from {@link decideGeminiCliCommand}
 * @param args - Command-line arguments to pass to Gemini CLI
 * @param timeoutMs - Optional timeout in milliseconds (default: 120000ms)
 * @param workingDirectory - Optional working directory for command execution
 * @param env - Optional environment variables to inject
 *
 * @returns The command output as a string (stdout)
 *
 * @throws Error if command execution fails or times out
 *
 * @example Deprecated Usage
 * ```typescript
 * const cmd = await decideGeminiCliCommand(true);
 * const result = await executeGeminiCli(
 *   cmd,
 *   ['search', 'TypeScript tips'],
 *   30000,
 *   '/home/user/project',
 *   { GEMINI_API_KEY: 'key123' }
 * );
 * ```
 *
 * @example Recommended Migration
 * ```typescript
 * import { GeminiCliExecutor } from '@/lib/infrastructure/gemini-cli-executor';
 * const executor = new GeminiCliExecutor();
 * const result = await executor.execute(cmd, args, {
 *   timeoutMs: 30000,
 *   workingDirectory: '/home/user/project',
 *   env: { GEMINI_API_KEY: 'key123' }
 * });
 * ```
 *
 * @see {@link GeminiCliExecutor.execute} for the recommended API
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
 * Streams output from a Gemini CLI command execution.
 *
 * @deprecated Use {@link GeminiCliExecutor.stream} directly
 *
 * This function is kept for backward compatibility with gemini-api.ts.
 * New code should use the GeminiCliExecutor class directly.
 *
 * @param geminiCliCommand - Command object from {@link decideGeminiCliCommand}
 * @param args - Command-line arguments to pass to Gemini CLI
 * @param workingDirectory - Optional working directory for command execution
 * @param env - Optional environment variables to inject
 *
 * @returns A Node.js ChildProcess that can be used for streaming stdout/stderr
 *
 * @remarks
 * Uses dynamic import to avoid circular dependencies at module load time.
 * The returned child process should be manually managed (event listeners, cleanup).
 *
 * @example Deprecated Usage
 * ```typescript
 * const cmd = await decideGeminiCliCommand(true);
 * const child = await streamGeminiCli(cmd, ['chat', 'Hello']);
 *
 * child.stdout.on('data', (chunk) => {
 *   console.log(chunk.toString());
 * });
 * ```
 *
 * @example Recommended Migration
 * ```typescript
 * import { GeminiCliExecutor } from '@/lib/infrastructure/gemini-cli-executor';
 * const executor = new GeminiCliExecutor();
 * const child = await executor.stream(cmd, args, {
 *   workingDirectory: '/home/user/project',
 *   env: { GEMINI_API_KEY: 'key123' }
 * });
 * ```
 *
 * @see {@link GeminiCliExecutor.stream} for the recommended API
 * @see {@link handleGeminiChatStream} for higher-level streaming API
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
 * Executes a Google search using the Gemini CLI.
 *
 * This is the recommended function for executing Google searches.
 * It provides automatic validation, type safety, and delegates to the service layer.
 *
 * @param args - Search parameters (validated against {@link GoogleSearchParametersSchema})
 * @param allowNpx - If true, allows using 'npx gemini-cli' as fallback (default: false)
 *
 * @returns The search results as a formatted string (typically markdown)
 *
 * @throws {ZodError} If args don't match the expected schema
 * @throws {Error} If CLI execution fails
 *
 * @remarks
 * - Automatically validates inputs using Zod schema
 * - Delegates to {@link geminiService.search} for actual implementation
 * - Uses centralized error handling and logging
 * - Suitable for both programmatic and MCP tool usage
 *
 * @example Basic Search
 * ```typescript
 * const result = await executeGoogleSearch({
 *   query: "TypeScript best practices"
 * });
 * console.log(result); // Markdown-formatted search results
 * ```
 *
 * @example Advanced Search with Options
 * ```typescript
 * const result = await executeGoogleSearch({
 *   query: "quantum computing",
 *   limit: 5,
 *   model: "gemini-pro",
 *   sandbox: true
 * }, true); // allow npx fallback
 * ```
 *
 * @see {@link GoogleSearchParametersSchema} for valid parameter structure
 * @see {@link geminiService.search} for underlying implementation
 */
export async function executeGoogleSearch(args: unknown, allowNpx = false) {
  // Validate and parse arguments using the schema
  const parsedArgs = GoogleSearchParametersSchema.parse(args);
  return geminiService.search(parsedArgs, allowNpx);
}

/**
 * Executes a chat conversation using the Gemini CLI.
 *
 * This is the recommended function for executing Gemini chat interactions.
 * It provides automatic validation, type safety, and delegates to the service layer.
 *
 * @param args - Chat parameters (validated against {@link GeminiChatParametersSchema})
 * @param allowNpx - If true, allows using 'npx gemini-cli' as fallback (default: false)
 *
 * @returns The complete AI chat response as a string
 *
 * @throws {ZodError} If args don't match the expected schema
 * @throws {Error} If CLI execution fails
 *
 * @remarks
 * - Automatically validates inputs using Zod schema
 * - Delegates to {@link geminiService.chat} for actual implementation
 * - Uses centralized error handling and logging
 * - Suitable for both programmatic and MCP tool usage
 * - This is the **non-streaming** version (waits for complete response)
 *
 * @example Basic Chat
 * ```typescript
 * const result = await executeGeminiChat({
 *   prompt: "Explain quantum entanglement"
 * });
 * console.log(result); // Complete AI response
 * ```
 *
 * @example Chat with Model Selection
 * ```typescript
 * const result = await executeGeminiChat({
 *   prompt: "Write a TypeScript function to sort arrays",
 *   model: "gemini-pro",
 *   sandbox: true
 * }, true); // allow npx fallback
 * ```
 *
 * @see {@link GeminiChatParametersSchema} for valid parameter structure
 * @see {@link geminiService.chat} for underlying implementation
 * @see {@link handleGeminiChatStream} for streaming version
 */
export async function executeGeminiChat(args: unknown, allowNpx = false) {
  // Validate and parse arguments using the schema
  const parsedArgs = GeminiChatParametersSchema.parse(args);
  return geminiService.chat(parsedArgs, allowNpx);
}
