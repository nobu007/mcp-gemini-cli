/**
 * Custom error types for infrastructure layer
 * Provides specific, actionable error information for CLI operations
 */

/**
 * Base class for all CLI-related errors
 */
export abstract class CliError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly args: string[],
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Returns a formatted representation of the command that failed
   */
  get commandString(): string {
    return `${this.command} ${this.args.join(" ")}`;
  }
}

/**
 * Error thrown when a CLI command times out
 */
export class CliTimeoutError extends CliError {
  constructor(
    command: string,
    args: string[],
    public readonly timeoutMs: number,
  ) {
    super(
      `CLI operation timed out after ${timeoutMs}ms: ${command} ${args.join(" ")}`,
      command,
      args,
    );
  }
}

/**
 * Error thrown when a CLI command exits with a non-zero code
 */
export class CliExecutionError extends CliError {
  constructor(
    command: string,
    args: string[],
    public readonly exitCode: number,
    public readonly stderr: string,
    public readonly stdout: string,
  ) {
    super(`CLI exited with code ${exitCode}: ${stderr}`, command, args);
  }
}

/**
 * Error thrown when a CLI command fails to spawn
 */
export class CliSpawnError extends CliError {
  constructor(
    command: string,
    args: string[],
    public readonly cause: Error,
  ) {
    super(
      `Failed to start command ${command} ${args.join(" ")}: ${cause.message}`,
      command,
      args,
    );
  }
}

/**
 * Error thrown when maximum retry attempts are exceeded
 */
export class MaxRetriesExceededError extends CliError {
  constructor(
    command: string,
    args: string[],
    public readonly attempts: number,
    public readonly lastError: Error,
  ) {
    super(
      `Maximum retry attempts (${attempts}) exceeded for ${command} ${args.join(" ")}: ${lastError.message}`,
      command,
      args,
    );
  }
}

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts: number;
  /** Initial delay in milliseconds before first retry (default: 1000) */
  initialDelayMs: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number;
  /** Maximum delay in milliseconds between retries (default: 30000) */
  maxDelayMs: number;
  /** Function to determine if an error is retryable (default: all errors) */
  isRetryable: (error: Error) => boolean;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
  isRetryable: (error: Error) => {
    // Don't retry timeout errors or execution errors with specific exit codes
    if (error instanceof CliTimeoutError) {
      return false;
    }
    if (error instanceof CliExecutionError) {
      // Retry on transient errors (e.g., network issues, temporary unavailability)
      // Don't retry on permanent errors (e.g., invalid arguments, authentication failures)
      const transientExitCodes = [124, 125, 126, 127]; // timeout, retry, permission denied, command not found
      return !transientExitCodes.includes(error.exitCode);
    }
    // Retry spawn errors (might be transient resource issues)
    return error instanceof CliSpawnError;
  },
};

/**
 * Utility function to calculate delay for exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig,
): number {
  const delay = config.initialDelayMs * config.backoffMultiplier ** attempt;
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Utility function to wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Type guard to check if an error is a CliError
 */
export function isCliError(error: unknown): error is CliError {
  return error instanceof CliError;
}

/**
 * Type guard to check if an error is retryable based on config
 */
export function isRetryableError(
  error: Error,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): boolean {
  return config.isRetryable(error);
}
