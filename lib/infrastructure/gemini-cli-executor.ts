/**
 * Gemini CLI Executor
 * Concrete implementation of CliExecutor for Gemini CLI operations
 */

import type { ChildProcess } from "node:child_process";
import type { GeminiCliCommand } from "../core/types";
import { type CliExecutionOptions, CliExecutor } from "./cli-executor";

/**
 * Specialized executor for Gemini CLI commands
 */
export class GeminiCliExecutor extends CliExecutor {
  constructor() {
    super("gemini-cli-executor");
  }

  /**
   * Executes a Gemini CLI command with timeout
   */
  async execute(
    geminiCliCommand: GeminiCliCommand,
    args: string[],
    options: CliExecutionOptions = {},
  ): Promise<string> {
    return this.executeWithTimeout(geminiCliCommand, args, options);
  }

  /**
   * Spawns a Gemini CLI command for streaming
   */
  stream(
    geminiCliCommand: GeminiCliCommand,
    args: string[],
    options: CliExecutionOptions = {},
  ): ChildProcess {
    return this.spawnForStreaming(geminiCliCommand, args, options);
  }

  /**
   * Builds CLI arguments for Google Search
   * @param params - Search parameters
   * @param params.query - Search query string
   * @param params.limit - Maximum number of results to return
   * @param params.raw - If true, returns structured JSON with sources
   * @param params.sandbox - If true, runs in sandbox mode
   * @param params.yolo - If true, auto-accepts all prompts
   * @param params.model - Optional model name to use
   * @returns Array of CLI arguments ready for execution
   */
  static buildSearchArgs(params: {
    query: string;
    limit?: number;
    raw?: boolean;
    sandbox?: boolean;
    yolo?: boolean;
    model?: string;
  }): string[] {
    let prompt: string;

    if (params.raw) {
      const limitText = params.limit
        ? ` Limit to ${params.limit} sources.`
        : "";
      prompt = `Perform a web search for "${params.query}". Synthesize the findings and provide a list of sources. Return the entire output as a single, valid JSON object with the following structure: { "summary": "...", "sources": [{ "url": "...", "title": "...", "snippet": "..." }] }.${limitText}`;
    } else {
      prompt = `Search for: ${params.query}`;
      if (params.limit) {
        prompt += ` (return up to ${params.limit} results)`;
      }
    }

    const cliArgs = ["-p", prompt];

    if (params.sandbox) {
      cliArgs.push("-s");
    }
    if (params.yolo) {
      cliArgs.push("-y");
    }
    if (params.model) {
      cliArgs.push("-m", params.model);
    }

    return cliArgs;
  }

  /**
   * Builds CLI arguments for Chat
   * @param params - Chat parameters
   * @param params.prompt - User prompt/question
   * @param params.sandbox - If true, runs in sandbox mode
   * @param params.yolo - If true, auto-accepts all prompts
   * @param params.model - Optional model name to use
   * @returns Array of CLI arguments ready for execution
   */
  static buildChatArgs(params: {
    prompt: string;
    sandbox?: boolean;
    yolo?: boolean;
    model?: string;
  }): string[] {
    const cliArgs = ["-p", params.prompt];

    if (params.sandbox) {
      cliArgs.push("-s");
    }
    if (params.yolo) {
      cliArgs.push("-y");
    }
    if (params.model) {
      cliArgs.push("-m", params.model);
    }

    return cliArgs;
  }

  /**
   * Post-processes raw search results (attempts JSON parsing)
   * @param result - Raw output from Gemini CLI search
   * @returns Pretty-printed JSON if parseable, otherwise raw output
   * @remarks Automatically removes markdown code fence wrapping if present
   */
  static processRawSearchResult(result: string): string {
    try {
      // The model might wrap the JSON in markdown backticks
      const jsonString = result.replace(/^```json\n|```$/g, "").trim();
      // This will throw if the JSON is invalid, which is fine.
      // We just return the pretty-printed valid JSON.
      const jsonResult = JSON.parse(jsonString);
      return JSON.stringify(jsonResult, null, 2);
    } catch (_error) {
      // If parsing fails, return the raw output as a fallback.
      return result;
    }
  }
}
