/**
 * CLI Executor - Base Infrastructure for CLI Process Management
 * Provides consistent CLI execution with timeout, error handling, and logging
 */

import {
  type ChildProcess,
  type ChildProcessWithoutNullStreams,
  spawn,
} from "node:child_process";
import { TIMEOUT_CONFIG } from "../../config";
import { EnvManager } from "./env-manager";
import {
  CliExecutionError,
  CliSpawnError,
  CliTimeoutError,
  calculateBackoffDelay,
  DEFAULT_RETRY_CONFIG,
  isRetryableError,
  MaxRetriesExceededError,
  type RetryConfig,
  wait,
} from "./errors";
import { createLogger, type Logger } from "./logger";

export interface CliCommand {
  command: string;
  initialArgs: string[];
}

export interface CliExecutionOptions {
  timeoutMs?: number;
  workingDirectory?: string;
  env?: Record<string, string | undefined>;
  retry?: Partial<RetryConfig>;
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
   * Supports automatic retry with exponential backoff for transient failures
   */
  protected async executeWithTimeout(
    cliCommand: CliCommand,
    args: string[],
    options: CliExecutionOptions = {},
  ): Promise<string> {
    const retryConfig: RetryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...options.retry,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
      try {
        if (attempt > 0) {
          const delay = calculateBackoffDelay(attempt - 1, retryConfig);
          this.logger.info(
            `Retry attempt ${attempt + 1}/${retryConfig.maxAttempts} after ${delay}ms delay`,
          );
          await wait(delay);
        }

        return await this.executeWithTimeoutInternal(cliCommand, args, options);
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!isRetryableError(lastError, retryConfig)) {
          this.logger.warn(
            `Error is not retryable, failing immediately: ${lastError.message}`,
          );
          throw lastError;
        }

        // Log retry information
        if (attempt < retryConfig.maxAttempts - 1) {
          this.logger.warn(
            `Attempt ${attempt + 1} failed: ${lastError.message}. Will retry...`,
          );
        } else {
          this.logger.error(
            `All ${retryConfig.maxAttempts} attempts failed. Giving up.`,
          );
        }
      }
    }

    // All retries exhausted
    const { command, initialArgs } = cliCommand;
    const allArgs = [...initialArgs, ...args];
    throw new MaxRetriesExceededError(
      command,
      allArgs,
      retryConfig.maxAttempts,
      lastError || new Error("Unknown error"),
    );
  }

  /**
   * Internal method that performs a single CLI execution attempt
   */
  private async executeWithTimeoutInternal(
    cliCommand: CliCommand,
    args: string[],
    options: CliExecutionOptions,
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
      const child: ChildProcessWithoutNullStreams = spawn(command, allArgs, {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: cwd,
        env: fullEnv as NodeJS.ProcessEnv,
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
          reject(new CliTimeoutError(command, allArgs, timeoutMs));
        }
      }, timeoutMs);

      child.stdin.end();

      child.stdout.on("data", (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        if (output.trim()) {
          this.logger.debug(`STDOUT: ${output.trim()}`);
        }
      });

      child.stderr.on("data", (data: Buffer) => {
        const message = data.toString();
        stderr += message;

        // Filter out informational messages that are not actual errors
        if (!this.isInfoMessage(message)) {
          this.logger.warn(`STDERR: ${message.trim()}`);
        }
      });

      child.on("close", (code: number | null) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          this.logger.info(
            `Command exited with code ${code}: ${command} ${allArgs.join(" ")}`,
          );

          if (code === 0) {
            resolve(stdout);
          } else {
            reject(
              new CliExecutionError(
                command,
                allArgs,
                code ?? 1,
                stderr,
                stdout,
              ),
            );
          }
        }
      });

      child.on("error", (err: Error) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          this.logger.error(
            `Failed to start command ${command} ${allArgs.join(" ")}: ${err.message}`,
          );
          reject(new CliSpawnError(command, allArgs, err));
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

    const child: ChildProcessWithoutNullStreams = spawn(command, allArgs, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: cwd,
      env: fullEnv as NodeJS.ProcessEnv,
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
