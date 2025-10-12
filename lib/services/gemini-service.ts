/**
 * Gemini Service
 * High-level service layer coordinating infrastructure and core logic
 * This is the single entry point for all Gemini operations
 */

import type { ChildProcess } from "node:child_process";
import { TIMEOUT_CONFIG } from "../../config";
import type {
  GeminiChatParameters,
  GoogleSearchParameters,
} from "../core/schemas";
import type { GeminiCliCommand } from "../core/types";
import { EnvManager } from "../infrastructure/env-manager";
import { GeminiCliExecutor } from "../infrastructure/gemini-cli-executor";
import { GeminiCliResolver } from "../infrastructure/gemini-cli-resolver";

/**
 * Main service for Gemini operations
 */
export class GeminiService {
  private executor: GeminiCliExecutor;
  private cachedCliCommand: GeminiCliCommand | null = null;

  constructor() {
    this.executor = new GeminiCliExecutor();
  }

  /**
   * Resolves the Gemini CLI command (cached after first call)
   */
  private async resolveCliCommand(
    allowNpx: boolean,
  ): Promise<GeminiCliCommand> {
    if (!this.cachedCliCommand) {
      this.cachedCliCommand = await GeminiCliResolver.resolve(allowNpx);
    }
    return this.cachedCliCommand;
  }

  /**
   * Prepares execution context (working directory and environment variables)
   * This eliminates duplication across search/chat/chatStream methods
   */
  private prepareExecutionContext(
    workingDirectory?: string,
    apiKey?: string,
  ): { workingDir: string; envVars: Record<string, string | undefined> } {
    const workingDir = EnvManager.resolveWorkingDirectory(
      workingDirectory,
      process.env.GEMINI_CLI_WORKING_DIR,
    );

    const envVars = EnvManager.fromToolArgs({ apiKey });

    return { workingDir, envVars };
  }

  /**
   * Executes a Google search
   * @param params - Search parameters including query, limit, and options
   * @param allowNpx - Whether to allow npx fallback for CLI resolution
   * @returns Search results as a string (JSON if raw=true, formatted otherwise)
   * @throws Error if CLI execution fails or times out
   */
  async search(
    params: GoogleSearchParameters,
    allowNpx = false,
  ): Promise<string> {
    const geminiCliCmd = await this.resolveCliCommand(allowNpx);
    const { workingDir, envVars } = this.prepareExecutionContext(
      params.workingDirectory,
      params.apiKey,
    );

    const cliArgs = GeminiCliExecutor.buildSearchArgs({
      query: params.query,
      limit: params.limit,
      raw: params.raw,
      sandbox: params.sandbox,
      yolo: params.yolo,
      model: params.model,
    });

    const result = await this.executor.execute(geminiCliCmd, cliArgs, {
      timeoutMs: TIMEOUT_CONFIG.SEARCH_TIMEOUT_MS,
      workingDirectory: workingDir,
      env: envVars,
    });

    // For raw requests, attempt to clean up and parse the JSON
    if (params.raw) {
      return GeminiCliExecutor.processRawSearchResult(result);
    }

    return result;
  }

  /**
   * Executes a chat conversation
   * @param params - Chat parameters including prompt and options
   * @param allowNpx - Whether to allow npx fallback for CLI resolution
   * @returns Chat response as a string
   * @throws Error if CLI execution fails or times out
   */
  async chat(params: GeminiChatParameters, allowNpx = false): Promise<string> {
    const geminiCliCmd = await this.resolveCliCommand(allowNpx);
    const { workingDir, envVars } = this.prepareExecutionContext(
      params.workingDirectory,
      params.apiKey,
    );

    const cliArgs = GeminiCliExecutor.buildChatArgs({
      prompt: params.prompt,
      sandbox: params.sandbox,
      yolo: params.yolo,
      model: params.model,
    });

    const result = await this.executor.execute(geminiCliCmd, cliArgs, {
      timeoutMs: TIMEOUT_CONFIG.CHAT_TIMEOUT_MS,
      workingDirectory: workingDir,
      env: envVars,
    });

    return result;
  }

  /**
   * Streams a chat conversation
   * @param params - Chat parameters including prompt and options
   * @param allowNpx - Whether to allow npx fallback for CLI resolution
   * @returns ChildProcess for streaming the response
   * @throws Error if CLI process fails to spawn
   */
  async chatStream(
    params: GeminiChatParameters,
    allowNpx = false,
  ): Promise<ChildProcess> {
    const geminiCliCmd = await this.resolveCliCommand(allowNpx);
    const { workingDir, envVars } = this.prepareExecutionContext(
      params.workingDirectory,
      params.apiKey,
    );

    const cliArgs = GeminiCliExecutor.buildChatArgs({
      prompt: params.prompt,
      sandbox: params.sandbox,
      yolo: params.yolo,
      model: params.model,
    });

    return this.executor.stream(geminiCliCmd, cliArgs, {
      workingDirectory: workingDir,
      env: envVars,
    });
  }
}

/**
 * Singleton instance for convenience
 */
export const geminiService = new GeminiService();
