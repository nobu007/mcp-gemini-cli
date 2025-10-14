/**
 * Gemini CLI Resolver
 * Determines the command to execute for gemini-cli
 */

import { spawn } from "node:child_process";
import type { GeminiCliCommand } from "../core/types";
import { createLogger } from "./logger";

const logger = createLogger("gemini-cli-resolver");

/**
 * Cache for resolved CLI command to avoid repeated 'which' checks
 */
let cachedCommand: GeminiCliCommand | null = null;
let cacheTimestamp: number | null = null;

/**
 * Cache TTL in milliseconds (default: 5 minutes)
 * After this time, the resolver will re-check the command availability
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Resolves the Gemini CLI command to execute
 */
export class GeminiCliResolver {
  /**
   * Determines the command to execute for gemini-cli.
   * It first checks if 'gemini' is in the system's PATH. If not, and if allowNpx is true,
   * it falls back to using 'npx' to run the CLI from its GitHub repository.
   *
   * Results are cached for CACHE_TTL_MS to avoid repeated 'which' checks.
   *
   * @param _allowNpx - If true, allows using npx as a fallback.
   * @param useCache - If true (default), uses cached result if available and fresh.
   * @returns A promise that resolves to an object containing the command and initial arguments.
   * @throws An error if 'gemini' is not found and npx is not allowed.
   */
  static async resolve(
    _allowNpx: boolean,
    useCache = true,
  ): Promise<GeminiCliCommand> {
    // Check cache first if enabled
    if (useCache && cachedCommand && cacheTimestamp) {
      const age = Date.now() - cacheTimestamp;
      if (age < CACHE_TTL_MS) {
        logger.debug(
          `Using cached CLI command (age: ${Math.round(age / 1000)}s): ${cachedCommand.command}`,
        );
        return cachedCommand;
      }
      logger.debug("Cache expired, re-resolving CLI command");
    }

    return new Promise((resolve, _reject) => {
      logger.info("Attempting to find 'gemini' executable...");
      const whichChild = spawn("which", ["gemini"]);
      let whichStdout = "";
      let whichStderr = "";

      whichChild.stdout.on("data", (data) => {
        whichStdout += data.toString();
      });

      whichChild.stderr.on("data", (data) => {
        whichStderr += data.toString();
      });

      whichChild.on("close", (code) => {
        let result: GeminiCliCommand;

        if (code === 0 && whichStdout.trim().length > 0) {
          logger.info(`'gemini' found at: ${whichStdout.trim()}`);
          result = { command: "gemini", initialArgs: [] };
        } else {
          logger.warn(
            `'gemini' not found in PATH. which exited with code ${code}. Stderr: ${whichStderr.trim()}`,
          );
          logger.info(
            "Falling back to 'npx @google/gemini-cli' as 'gemini' was not found in PATH.",
          );
          result = { command: "npx", initialArgs: ["@google/gemini-cli"] };
        }

        // Cache the result
        cachedCommand = result;
        cacheTimestamp = Date.now();
        logger.debug("CLI command resolved and cached");

        resolve(result);
      });

      whichChild.on("error", (err) => {
        logger.error(`Error executing 'which gemini': ${err.message}`);
        logger.info(
          "Falling back to 'npx @google/gemini-cli' due to 'which' command error.",
        );

        const result = { command: "npx", initialArgs: ["@google/gemini-cli"] };

        // Cache the fallback result
        cachedCommand = result;
        cacheTimestamp = Date.now();

        resolve(result);
      });
    });
  }

  /**
   * Clears the cached CLI command, forcing a fresh resolution on next call
   */
  static clearCache(): void {
    logger.debug("Clearing CLI command cache");
    cachedCommand = null;
    cacheTimestamp = null;
  }

  /**
   * Returns the cached command if available, null otherwise
   */
  static getCachedCommand(): GeminiCliCommand | null {
    if (cachedCommand && cacheTimestamp) {
      const age = Date.now() - cacheTimestamp;
      if (age < CACHE_TTL_MS) {
        return cachedCommand;
      }
    }
    return null;
  }
}
