import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  createLogger,
  type LogLevel,
} from "../../../lib/infrastructure/logger";

describe("Logger", () => {
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalEnv = process.env.LOG_LEVEL;
  let capturedLogs: string[] = [];

  beforeEach(() => {
    capturedLogs = [];
    // Mock console methods to capture output
    console.log = (...args: unknown[]) => {
      capturedLogs.push(args.join(" "));
    };
    console.warn = (...args: unknown[]) => {
      capturedLogs.push(args.join(" "));
    };
    console.error = (...args: unknown[]) => {
      capturedLogs.push(args.join(" "));
    };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    process.env.LOG_LEVEL = originalEnv;
  });

  describe("createLogger", () => {
    test("creates a logger with the given module name", () => {
      const logger = createLogger("test-module");
      logger.info("test message");

      expect(capturedLogs.length).toBeGreaterThan(0);
      expect(capturedLogs[0]).toContain("test-module");
      expect(capturedLogs[0]).toContain("test message");
    });

    test("different loggers have different module names", () => {
      const logger1 = createLogger("module-1");
      const logger2 = createLogger("module-2");

      logger1.info("message 1");
      logger2.info("message 2");

      expect(capturedLogs[0]).toContain("module-1");
      expect(capturedLogs[1]).toContain("module-2");
    });
  });

  describe("log levels", () => {
    test("logs debug messages when level is debug", () => {
      const logger = createLogger("test", { level: "debug" });

      logger.debug("debug message");

      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0]).toContain("debug message");
    });

    test("does not log debug messages when level is info", () => {
      const logger = createLogger("test", { level: "info" });

      logger.debug("debug message");

      expect(capturedLogs.length).toBe(0);
    });

    test("logs info messages when level is info", () => {
      const logger = createLogger("test", { level: "info" });

      logger.info("info message");

      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0]).toContain("info message");
    });

    test("does not log info messages when level is warn", () => {
      const logger = createLogger("test", { level: "warn" });

      logger.info("info message");

      expect(capturedLogs.length).toBe(0);
    });

    test("logs warn messages when level is warn", () => {
      const logger = createLogger("test", { level: "warn" });

      logger.warn("warn message");

      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0]).toContain("warn message");
    });

    test("logs error messages at all levels", () => {
      const levels: LogLevel[] = ["debug", "info", "warn", "error"];

      for (const level of levels) {
        capturedLogs = [];
        const logger = createLogger("test", { level });

        logger.error("error message");

        expect(capturedLogs.length).toBe(1);
        expect(capturedLogs[0]).toContain("error message");
      }
    });
  });

  describe("metadata", () => {
    test("logs metadata when provided", () => {
      const logger = createLogger("test");
      logger.info("message with metadata", { key: "value", count: 42 });

      expect(capturedLogs.length).toBe(1);
      const log = capturedLogs[0];
      expect(log).toContain("message with metadata");
      expect(log).toContain("key");
      expect(log).toContain("value");
    });

    test("handles undefined metadata gracefully", () => {
      const logger = createLogger("test");
      logger.info("message without metadata");

      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0]).toContain("message without metadata");
    });
  });

  describe("child logger", () => {
    test("creates child logger with parent prefix", () => {
      const parent = createLogger("parent");
      const child = parent.child("child");

      child.info("child message");

      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0]).toContain("parent:child");
      expect(capturedLogs[0]).toContain("child message");
    });

    test("child logger respects parent log level", () => {
      const parent = createLogger("parent", { level: "warn" });
      const child = parent.child("child");

      child.debug("debug message");
      child.info("info message");
      child.warn("warn message");

      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0]).toContain("warn message");
    });
  });

  describe("log level configuration", () => {
    test("respects log level configuration", () => {
      const logger = createLogger("test", { level: "error" });

      logger.info("info message");
      logger.error("error message");

      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0]).toContain("error message");
    });
  });
});
