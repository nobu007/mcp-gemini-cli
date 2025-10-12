/**
 * CLI Executor - Base Infrastructure for CLI Process Management
 * Provides consistent CLI execution with timeout, error handling, and logging
 */

import { type ChildProcess, spawn } from "node:child_process";
import { TIMEOUT_CONFIG } from "../../config";
import { EnvManager } from "./env-manager";
import { createLogger, type Logger } from "./logger";

export interface CliCommand {
  command: string;
  initialArgs: string[];
}

export interface CliExecutionOptions {
  timeoutMs?: number;
  workingDirectory?: string;
  env?: Record<string, string | undefined>;
}

export interface CliExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Base class for CLI execution with common patterns
 */
export abstract class CliExecutor {
  protected logger: Logger;

  constructor(moduleName: string) {
    this.logger = createLogger(moduleName);
  }

  /**
   * Executes a CLI command with timeout and returns the complete output
   */
  protected async executeWithTimeout(
    cliCommand: CliCommand,
    args: string[],
    options: CliExecutionOptions = {},
  ): Promise<string> {
    const { command, initialArgs } = cliCommand;
    const allArgs = [...initialArgs, ...args];
    const timeoutMs = options.timeoutMs || TIMEOUT_CONFIG.DEFAULT_TIMEOUT_MS;
    const cwd = options.workingDirectory || process.cwd();
    const fullEnv = EnvManager.prepareEnv(options.env);

    this.logger.info(`Executing: ${command} ${allArgs.join(" ")}`);
    this.logger.debug(`Working directory: ${cwd}`);
    this.logger.debug("Environment variables:", {
      env: EnvManager.maskSensitiveData(fullEnv),
    });

    return new Promise((resolve, reject) => {
      const child = spawn(command, allArgs, {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: cwd,
        env: fullEnv,
      });

      let stdout = "";
      let stderr = "";
      let isResolved = false;

      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          child.kill("SIGTERM");
          this.logger.error(
            `Command timed out after ${timeoutMs}ms: ${command} ${allArgs.join(" ")}`,
          );
          reject(new Error(`CLI operation timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      child.stdin.end();

      child.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        if (output.trim()) {
          this.logger.debug(`STDOUT: ${output.trim()}`);
        }
      });

      child.stderr.on("data", (data) => {
        const message = data.toString();
        stderr += message;

        // Filter out informational messages that are not actual errors
        if (!this.isInfoMessage(message)) {
          this.logger.warn(`STDERR: ${message.trim()}`);
        }
      });

      child.on("close", (code) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          this.logger.info(
            `Command exited with code ${code}: ${command} ${allArgs.join(" ")}`,
          );

          if (code === 0) {
            resolve(stdout);
          } else {
            reject(new Error(`CLI exited with code ${code}: ${stderr}`));
          }
        }
      });

      child.on("error", (err) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          this.logger.error(
            `Failed to start command ${command} ${allArgs.join(" ")}: ${err.message}`,
          );
          reject(err);
        }
      });
    });
  }

  /**
   * Spawns a CLI command and returns the child process for streaming
   */
  protected spawnForStreaming(
    cliCommand: CliCommand,
    args: string[],
    options: CliExecutionOptions = {},
  ): ChildProcess {
    const { command, initialArgs } = cliCommand;
    const allArgs = [...initialArgs, ...args];
    const cwd = options.workingDirectory || process.cwd();
    const fullEnv = EnvManager.prepareEnv(options.env);

    this.logger.info(`Streaming: ${command} ${allArgs.join(" ")}`);
    this.logger.debug(`Working directory: ${cwd}`);
    this.logger.debug("Environment variables:", {
      env: EnvManager.maskSensitiveData(fullEnv),
    });

    const child = spawn(command, allArgs, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: cwd,
      env: fullEnv,
    });

    // Close stdin immediately since we're not sending any input
    child.stdin.end();

    return child;
  }

  /**
   * Determines if a stderr message is informational rather than an error
   */
  protected isInfoMessage(message: string): boolean {
    const trimmedMessage = message.trim();
    return (
      trimmedMessage.startsWith("Loaded cached credentials") ||
      trimmedMessage.includes("Using cached credentials") ||
      !!trimmedMessage.match(/^\[.*\]\s*(Loaded|Using|Authenticated)/)
    );
  }
}
