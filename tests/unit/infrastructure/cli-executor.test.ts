/**
 * Unit tests for CliExecutor base class
 * Tests common CLI execution patterns, timeout handling, and error cases
 */

import { beforeEach, describe, expect, test } from "bun:test";
import {
  type CliCommand,
  type CliExecutionOptions,
  CliExecutor,
} from "../../../lib/infrastructure/cli-executor";

/**
 * Test implementation of CliExecutor for testing abstract base class
 */
class TestCliExecutor extends CliExecutor {
  constructor() {
    super("test-cli-executor");
  }

  // Expose protected methods for testing
  public async testExecuteWithTimeout(
    cliCommand: CliCommand,
    args: string[],
    options?: CliExecutionOptions,
  ): Promise<string> {
    return this.executeWithTimeout(cliCommand, args, options);
  }

  public testIsInfoMessage(message: string): boolean {
    return this.isInfoMessage(message);
  }

  public testSpawnForStreaming(
    cliCommand: CliCommand,
    args: string[],
    options?: CliExecutionOptions,
  ) {
    return this.spawnForStreaming(cliCommand, args, options);
  }
}

describe("CliExecutor", () => {
  let executor: TestCliExecutor;

  beforeEach(() => {
    executor = new TestCliExecutor();
  });

  describe("constructor", () => {
    test("should create a new CliExecutor instance", () => {
      expect(executor).toBeDefined();
      expect(executor).toBeInstanceOf(CliExecutor);
    });

    test("should initialize logger with module name", () => {
      expect(executor.logger).toBeDefined();
    });
  });

  describe("executeWithTimeout", () => {
    // Helper to disable retry for faster tests
    const noRetry = { retry: { maxAttempts: 1 } };

    test("should execute simple command successfully", async () => {
      const result = await executor.testExecuteWithTimeout(
        { command: "echo", initialArgs: [] },
        ["hello"],
        noRetry,
      );
      expect(result.trim()).toBe("hello");
    });

    test("should execute command with multiple arguments", async () => {
      const result = await executor.testExecuteWithTimeout(
        { command: "echo", initialArgs: [] },
        ["hello", "world"],
        noRetry,
      );
      expect(result.trim()).toBe("hello world");
    });

    test("should merge initial args with provided args", async () => {
      const result = await executor.testExecuteWithTimeout(
        { command: "echo", initialArgs: ["initial"] },
        ["final"],
        noRetry,
      );
      expect(result.trim()).toBe("initial final");
    });

    test("should handle command with working directory", async () => {
      const result = await executor.testExecuteWithTimeout(
        { command: "pwd", initialArgs: [] },
        [],
        { workingDirectory: "/tmp", ...noRetry },
      );
      expect(result.trim()).toBe("/tmp");
    });

    test("should handle command with environment variables", async () => {
      const result = await executor.testExecuteWithTimeout(
        { command: "bash", initialArgs: ["-c"] },
        ["echo $TEST_VAR"],
        { env: { TEST_VAR: "test-value" }, ...noRetry },
      );
      expect(result.trim()).toBe("test-value");
    });

    test("should reject on non-zero exit code", async () => {
      expect(
        executor.testExecuteWithTimeout(
          { command: "bash", initialArgs: ["-c"] },
          ["exit 1"],
          noRetry,
        ),
      ).rejects.toThrow("CLI exited with code 1");
    });

    test("should reject on command not found", async () => {
      expect(
        executor.testExecuteWithTimeout(
          { command: "nonexistent-command-xyz", initialArgs: [] },
          [],
          noRetry,
        ),
      ).rejects.toThrow();
    });

    test("should timeout long-running command", async () => {
      expect(
        executor.testExecuteWithTimeout(
          { command: "sleep", initialArgs: [] },
          ["10"],
          { timeoutMs: 100, ...noRetry },
        ),
      ).rejects.toThrow("CLI operation timed out after 100ms");
    }, 500);

    test("should use default timeout when not specified", async () => {
      const result = await executor.testExecuteWithTimeout(
        { command: "echo", initialArgs: [] },
        ["test"],
        noRetry,
      );
      expect(result.trim()).toBe("test");
    });

    test("should handle empty stdout", async () => {
      const result = await executor.testExecuteWithTimeout(
        { command: "bash", initialArgs: ["-c"] },
        ["exit 0"],
        noRetry,
      );
      expect(result).toBe("");
    });

    test("should capture stderr messages", async () => {
      try {
        await executor.testExecuteWithTimeout(
          { command: "bash", initialArgs: ["-c"] },
          ["echo error >&2 && exit 1"],
          noRetry,
        );
      } catch (error) {
        expect((error as Error).message).toContain("error");
      }
    });
  });

  describe("isInfoMessage", () => {
    test("should identify 'Loaded cached credentials' as info", () => {
      expect(executor.testIsInfoMessage("Loaded cached credentials")).toBe(
        true,
      );
    });

    test("should identify 'Using cached credentials' as info", () => {
      expect(executor.testIsInfoMessage("Using cached credentials")).toBe(true);
    });

    test("should identify '[timestamp] Loaded ...' as info", () => {
      expect(executor.testIsInfoMessage("[2024-01-01] Loaded something")).toBe(
        true,
      );
    });

    test("should identify '[timestamp] Using ...' as info", () => {
      expect(executor.testIsInfoMessage("[2024-01-01] Using something")).toBe(
        true,
      );
    });

    test("should identify '[timestamp] Authenticated ...' as info", () => {
      expect(executor.testIsInfoMessage("[2024-01-01] Authenticated")).toBe(
        true,
      );
    });

    test("should not identify actual errors as info", () => {
      expect(executor.testIsInfoMessage("Error: something went wrong")).toBe(
        false,
      );
    });

    test("should not identify random messages as info", () => {
      expect(executor.testIsInfoMessage("This is a random message")).toBe(
        false,
      );
    });

    test("should handle empty messages", () => {
      expect(executor.testIsInfoMessage("")).toBe(false);
    });

    test("should handle whitespace-only messages", () => {
      expect(executor.testIsInfoMessage("   ")).toBe(false);
    });

    test("should handle messages with leading/trailing whitespace", () => {
      expect(executor.testIsInfoMessage("  Loaded cached credentials  ")).toBe(
        true,
      );
    });
  });

  describe("spawnForStreaming", () => {
    test("should spawn child process for streaming", () => {
      const child = executor.testSpawnForStreaming(
        { command: "echo", initialArgs: [] },
        ["hello"],
      );
      expect(child).toBeDefined();
      expect(child.pid).toBeDefined();
      child.kill();
    });

    test("should spawn with correct working directory", () => {
      const child = executor.testSpawnForStreaming(
        { command: "pwd", initialArgs: [] },
        [],
        { workingDirectory: "/tmp" },
      );
      expect(child).toBeDefined();
      expect(child.pid).toBeDefined();
      child.kill();
    });

    test("should spawn with environment variables", () => {
      const child = executor.testSpawnForStreaming(
        { command: "bash", initialArgs: ["-c"] },
        ["echo $TEST_VAR"],
        { env: { TEST_VAR: "test-value" } },
      );
      expect(child).toBeDefined();
      expect(child.pid).toBeDefined();
      child.kill();
    });

    test("should have stdin closed immediately", (done) => {
      const child = executor.testSpawnForStreaming(
        { command: "echo", initialArgs: [] },
        ["test"],
      );

      // Stdin should be null or closed
      child.on("close", () => {
        expect(child.killed || child.exitCode !== null).toBe(true);
        done();
      });
    });

    test("should provide access to stdout stream", (done) => {
      const child = executor.testSpawnForStreaming(
        { command: "echo", initialArgs: [] },
        ["streaming-test"],
      );

      let output = "";
      child.stdout?.on("data", (data) => {
        output += data.toString();
      });

      child.on("close", () => {
        expect(output.trim()).toBe("streaming-test");
        done();
      });
    });

    test("should provide access to stderr stream", (done) => {
      const child = executor.testSpawnForStreaming(
        { command: "bash", initialArgs: ["-c"] },
        ["echo error >&2"],
      );

      let errorOutput = "";
      child.stderr?.on("data", (data) => {
        errorOutput += data.toString();
      });

      child.on("close", () => {
        expect(errorOutput.trim()).toBe("error");
        done();
      });
    });
  });

  describe("error handling", () => {
    const noRetry = { retry: { maxAttempts: 1 } };

    test("should handle command spawn errors gracefully", async () => {
      expect(
        executor.testExecuteWithTimeout(
          { command: "/nonexistent/path/to/command", initialArgs: [] },
          [],
          noRetry,
        ),
      ).rejects.toThrow();
    });

    test("should handle timeout with proper cleanup", async () => {
      const startTime = Date.now();
      try {
        await executor.testExecuteWithTimeout(
          { command: "sleep", initialArgs: [] },
          ["5"],
          { timeoutMs: 100, ...noRetry },
        );
      } catch (error) {
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThan(200); // Should timeout quickly
        expect((error as Error).message).toContain("timed out");
      }
    }, 500);

    test("should reject with meaningful error messages", async () => {
      try {
        await executor.testExecuteWithTimeout(
          { command: "bash", initialArgs: ["-c"] },
          ["echo custom error >&2 && exit 42"],
          noRetry,
        );
      } catch (error) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain("CLI exited with code 42");
        expect(errorMessage).toContain("custom error");
      }
    });
  });

  describe("integration scenarios", () => {
    const noRetry = { retry: { maxAttempts: 1 } };

    test("should handle complex command with pipes", async () => {
      const result = await executor.testExecuteWithTimeout(
        { command: "bash", initialArgs: ["-c"] },
        ["echo hello | tr 'a-z' 'A-Z'"],
        noRetry,
      );
      expect(result.trim()).toBe("HELLO");
    });

    test("should handle commands with special characters", async () => {
      const result = await executor.testExecuteWithTimeout(
        { command: "echo", initialArgs: [] },
        ["hello$world"],
        noRetry,
      );
      expect(result.trim()).toBe("hello$world");
    });

    test("should handle multiline output", async () => {
      const result = await executor.testExecuteWithTimeout(
        { command: "bash", initialArgs: ["-c"] },
        ["echo line1 && echo line2"],
        noRetry,
      );
      expect(result.trim()).toBe("line1\nline2");
    });
  });
});
