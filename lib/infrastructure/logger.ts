/**
 * Logger Infrastructure
 * Centralized logging with support for different log levels and consistent formatting
 * Provides structured logging across all modules
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface LoggerConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableColors: boolean;
}

/**
 * Default logger configuration
 * Can be overridden via environment variables
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || "info",
  enableTimestamps: process.env.LOG_TIMESTAMPS !== "false",
  enableColors: process.env.LOG_COLORS !== "false" && process.stdout.isTTY,
};

/**
 * Log level priority mapping for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: "\x1b[0m",
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m", // Green
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  module: "\x1b[35m", // Magenta
  timestamp: "\x1b[90m", // Gray
};

/**
 * Centralized logger class providing structured logging capabilities
 */
export class Logger {
  private config: LoggerConfig;
  private moduleName: string;

  constructor(moduleName: string, config: Partial<LoggerConfig> = {}) {
    this.moduleName = moduleName;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Checks if a log level should be emitted based on configuration
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
  }

  /**
   * Formats a log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [];

    // Add timestamp if enabled
    if (this.config.enableTimestamps) {
      const timestamp = this.config.enableColors
        ? `${COLORS.timestamp}${entry.timestamp}${COLORS.reset}`
        : entry.timestamp;
      parts.push(`[${timestamp}]`);
    }

    // Add log level
    const levelColor = this.config.enableColors ? COLORS[entry.level] : "";
    const resetColor = this.config.enableColors ? COLORS.reset : "";
    const levelStr = entry.level.toUpperCase().padEnd(5);
    parts.push(`${levelColor}${levelStr}${resetColor}`);

    // Add module name
    const moduleColor = this.config.enableColors ? COLORS.module : "";
    parts.push(`${moduleColor}[${entry.module}]${resetColor}`);

    // Add message
    parts.push(entry.message);

    // Add metadata if present
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(JSON.stringify(entry.metadata));
    }

    return parts.join(" ");
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      module: this.moduleName,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    const formattedMessage = this.formatLogEntry(entry);

    // Route to appropriate console method
    switch (level) {
      case "debug":
      case "info":
        console.log(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "error":
        console.error(formattedMessage);
        break;
    }
  }

  /**
   * Log debug message (lowest priority)
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, metadata);
  }

  /**
   * Log info message (normal operations)
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, metadata);
  }

  /**
   * Log warning message (recoverable issues)
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, metadata);
  }

  /**
   * Log error message (failures)
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log("error", message, metadata);
  }

  /**
   * Creates a child logger with a sub-module name
   */
  child(subModuleName: string): Logger {
    return new Logger(`${this.moduleName}:${subModuleName}`, this.config);
  }
}

/**
 * Factory function to create module-specific loggers
 */
export function createLogger(
  moduleName: string,
  config?: Partial<LoggerConfig>,
): Logger {
  return new Logger(moduleName, config);
}

/**
 * Global logger for general use (should be avoided in favor of module-specific loggers)
 */
export const globalLogger = new Logger("global");
