/**
 * Gemini CLI Resolver
 * Determines the command to execute for gemini-cli
 */

import { spawn } from "node:child_process";
import type { GeminiCliCommand } from "../core/types";
import { createLogger } from "./logger";

const logger = createLogger("gemini-cli-resolver");

/**
 * Resolves the Gemini CLI command to execute
 */
export class GeminiCliResolver {
  /**
   * Determines the command to execute for gemini-cli.
   * It first checks if 'gemini' is in the system's PATH. If not, and if allowNpx is true,
   * it falls back to using 'npx' to run the CLI from its GitHub repository.
   * @param _allowNpx - If true, allows using npx as a fallback.
   * @returns A promise that resolves to an object containing the command and initial arguments.
   * @throws An error if 'gemini' is not found and npx is not allowed.
   */
  static async resolve(_allowNpx: boolean): Promise<GeminiCliCommand> {
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
        if (code === 0 && whichStdout.trim().length > 0) {
          logger.info(`'gemini' found at: ${whichStdout.trim()}`);
          resolve({ command: "gemini", initialArgs: [] });
        } else {
          logger.warn(
            `'gemini' not found in PATH. which exited with code ${code}. Stderr: ${whichStderr.trim()}`,
          );
          logger.info(
            "Falling back to 'npx @google/gemini-cli' as 'gemini' was not found in PATH.",
          );
          resolve({ command: "npx", initialArgs: ["@google/gemini-cli"] });
        }
      });

      whichChild.on("error", (err) => {
        logger.error(`Error executing 'which gemini': ${err.message}`);
        logger.info(
          "Falling back to 'npx @google/gemini-cli' due to 'which' command error.",
        );
        resolve({ command: "npx", initialArgs: ["@google/gemini-cli"] });
      });
    });
  }
}
