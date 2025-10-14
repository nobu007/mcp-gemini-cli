/**
 * Unit tests for Tools module (Backward Compatibility Adapter)
 *
 * Tests the deprecated adapter functions in tools.ts, verifying
 * backward compatibility, schema validation, and proper delegation
 * to infrastructure and service layers.
 */

import { describe, test, expect, mock, beforeEach } from "bun:test";
import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";

describe("Tools Module (Backward Compatibility Adapter)", async () => {
  // Mock infrastructure and service layers
  const mockGeminiCliResolver = {
    resolve: mock(async () => ({
      command: "gemini",
      initialArgs: [] as string[],
    })),
  };

  const mockGeminiCliExecutor = mock(function () {
    return {
      execute: mock(async () => "Execution result"),
      stream: mock(async () => {
        const mockChild = new EventEmitter() as ChildProcess;
        mockChild.stdout = new EventEmitter() as any;
        mockChild.stderr = new EventEmitter() as any;
        mockChild.kill = mock(() => true);
        return mockChild;
      }),
    };
  });

  const mockGeminiService = {
    search: mock(async () => "Search result from service"),
    chat: mock(async () => "Chat response from service"),
  };

  // Mock modules
  mock.module("@/lib/infrastructure/gemini-cli-resolver", () => ({
    GeminiCliResolver: mockGeminiCliResolver,
  }));

  mock.module("@/lib/infrastructure/gemini-cli-executor", () => ({
    GeminiCliExecutor: mockGeminiCliExecutor,
  }));

  // Must export both the class and the singleton to avoid test interference
  class MockGeminiService {
    async search() {
      return "Mock";
    }
    async chat() {
      return "Mock";
    }
    async chatStream() {
      return Promise.resolve(new EventEmitter() as ChildProcess);
    }
  }

  // Create a singleton instance of the mock class
  const mockGeminiServiceInstance = Object.assign(
    new MockGeminiService(),
    mockGeminiService,
  );

  mock.module("@/lib/services/gemini-service", () => ({
    GeminiService: MockGeminiService,
    geminiService: mockGeminiServiceInstance,
  }));

  // Import tools module with mocked dependencies
  const {
    decideGeminiCliCommand,
    executeGeminiCli,
    streamGeminiCli,
    executeGoogleSearch,
    executeGeminiChat,
  } = await import("@/lib/tools");

  beforeEach(() => {
    // Reset all mocks
    mockGeminiCliResolver.resolve.mockClear();
    mockGeminiCliExecutor.mockClear();
    mockGeminiService.search.mockClear();
    mockGeminiService.chat.mockClear();
  });

  describe("Schema exports", () => {
    test("should export GoogleSearchParametersSchema", async () => {
      const { GoogleSearchParametersSchema } = await import("@/lib/tools");

      expect(GoogleSearchParametersSchema).toBeDefined();
      expect(typeof GoogleSearchParametersSchema.parse).toBe("function");
    });

    test("should export GeminiChatParametersSchema", async () => {
      const { GeminiChatParametersSchema } = await import("@/lib/tools");

      expect(GeminiChatParametersSchema).toBeDefined();
      expect(typeof GeminiChatParametersSchema.parse).toBe("function");
    });

    test("GoogleSearchParametersSchema should validate correct input", async () => {
      const { GoogleSearchParametersSchema } = await import("@/lib/tools");

      const validInput = { query: "TypeScript tips" };
      const result = GoogleSearchParametersSchema.parse(validInput);

      expect(result.query).toBe("TypeScript tips");
    });

    test("GeminiChatParametersSchema should validate correct input", async () => {
      const { GeminiChatParametersSchema } = await import("@/lib/tools");

      const validInput = { prompt: "Hello AI" };
      const result = GeminiChatParametersSchema.parse(validInput);

      expect(result.prompt).toBe("Hello AI");
    });
  });

  describe("decideGeminiCliCommand (deprecated)", () => {
    test("should delegate to GeminiCliResolver.resolve", async () => {
      await decideGeminiCliCommand(true);

      expect(mockGeminiCliResolver.resolve).toHaveBeenCalledTimes(1);
      expect(mockGeminiCliResolver.resolve).toHaveBeenCalledWith(true);
    });

    test("should return command object with correct structure", async () => {
      mockGeminiCliResolver.resolve.mockResolvedValueOnce({
        command: "gemini",
        initialArgs: [],
      });

      const result = await decideGeminiCliCommand(true);

      expect(result).toHaveProperty("command");
      expect(result).toHaveProperty("initialArgs");
      expect(typeof result.command).toBe("string");
      expect(Array.isArray(result.initialArgs)).toBe(true);
    });

    test("should pass allowNpx=false correctly", async () => {
      await decideGeminiCliCommand(false);

      expect(mockGeminiCliResolver.resolve).toHaveBeenCalledWith(false);
    });

    test("should handle npx fallback scenario", async () => {
      mockGeminiCliResolver.resolve.mockResolvedValueOnce({
        command: "npx",
        initialArgs: ["gemini-cli"],
      });

      const result = await decideGeminiCliCommand(true);

      expect(result.command).toBe("npx");
      expect(result.initialArgs).toEqual(["gemini-cli"]);
    });
  });

  describe("executeGeminiCli (deprecated)", () => {
    test("should instantiate GeminiCliExecutor and call execute", async () => {
      const cmd = { command: "gemini", initialArgs: [] };
      const args = ["search", "test query"];

      await executeGeminiCli(cmd, args);

      expect(mockGeminiCliExecutor).toHaveBeenCalledTimes(1);
      // The instance's execute method should be called
    });

    test("should pass all parameters to executor", async () => {
      const cmd = { command: "gemini", initialArgs: [] };
      const args = ["chat", "Hello"];
      const timeoutMs = 30000;
      const workingDirectory = "/tmp";
      const env = { GEMINI_API_KEY: "test-key" };

      const mockExecute = mock(async () => "Result");
      const mockStream = mock(async () => new EventEmitter() as ChildProcess);
      mockGeminiCliExecutor.mockReturnValueOnce({
        execute: mockExecute,
        stream: mockStream,
      });

      await executeGeminiCli(cmd, args, timeoutMs, workingDirectory, env);

      expect(mockExecute).toHaveBeenCalledWith(cmd, args, {
        timeoutMs,
        workingDirectory,
        env,
      });
    });

    test("should return execution result", async () => {
      const mockExecute = mock(async () => "Test execution output");
      const mockStream = mock(async () => new EventEmitter() as ChildProcess);
      mockGeminiCliExecutor.mockReturnValueOnce({
        execute: mockExecute,
        stream: mockStream,
      });

      const result = await executeGeminiCli(
        { command: "gemini", initialArgs: [] },
        ["test"],
      );

      expect(result).toBe("Test execution output");
    });

    test("should work with minimal parameters", async () => {
      const mockExecute = mock(async () => "Minimal result");
      const mockStream = mock(async () => new EventEmitter() as ChildProcess);
      mockGeminiCliExecutor.mockReturnValueOnce({
        execute: mockExecute,
        stream: mockStream,
      });

      const result = await executeGeminiCli(
        { command: "gemini", initialArgs: [] },
        ["test"],
      );

      expect(result).toBeDefined();
    });
  });

  describe("streamGeminiCli (deprecated)", () => {
    test("should instantiate GeminiCliExecutor and call stream", async () => {
      const cmd = { command: "gemini", initialArgs: [] };
      const args = ["chat", "Stream test"];

      await streamGeminiCli(cmd, args);

      expect(mockGeminiCliExecutor).toHaveBeenCalledTimes(1);
    });

    test("should return ChildProcess-like object", async () => {
      const mockChild = new EventEmitter() as ChildProcess;
      mockChild.stdout = new EventEmitter() as any;
      mockChild.stderr = new EventEmitter() as any;
      mockChild.kill = mock(() => true);

      const mockStream = mock(async () => mockChild);
      const mockExecute = mock(async () => "Execute");
      mockGeminiCliExecutor.mockReturnValueOnce({
        execute: mockExecute,
        stream: mockStream,
      });

      const result = await streamGeminiCli(
        { command: "gemini", initialArgs: [] },
        ["test"],
      );

      expect(result).toBeDefined();
      expect(result.stdout).toBeDefined();
      expect(result.stderr).toBeDefined();
    });

    test("should pass workingDirectory and env to stream", async () => {
      const cmd = { command: "gemini", initialArgs: [] };
      const args = ["chat", "Hello"];
      const workingDirectory = "/home/user";
      const env = { API_KEY: "test" };

      const mockStream = mock(async () => {
        const mockChild = new EventEmitter() as ChildProcess;
        mockChild.stdout = new EventEmitter() as any;
        mockChild.stderr = new EventEmitter() as any;
        return mockChild;
      });

      const mockExecute = mock(async () => "Execute");
      mockGeminiCliExecutor.mockReturnValueOnce({
        execute: mockExecute,
        stream: mockStream,
      });

      await streamGeminiCli(cmd, args, workingDirectory, env);

      expect(mockStream).toHaveBeenCalledWith(cmd, args, {
        workingDirectory,
        env,
      });
    });
  });

  describe("executeGoogleSearch (recommended)", () => {
    test("should validate input with GoogleSearchParametersSchema", async () => {
      const validInput = { query: "TypeScript" };

      await executeGoogleSearch(validInput, false);

      // Should not throw validation error
      expect(mockGeminiService.search).toHaveBeenCalledTimes(1);
    });

    test("should reject invalid input", async () => {
      const invalidInput = { query: 123 }; // query should be string

      try {
        await executeGoogleSearch(invalidInput, false);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        // Zod validation error expected
        expect(error).toBeDefined();
      }
    });

    test("should delegate to geminiService.search", async () => {
      const params = { query: "quantum computing", limit: 5 };

      await executeGoogleSearch(params, true);

      expect(mockGeminiService.search).toHaveBeenCalledTimes(1);
      expect(mockGeminiService.search).toHaveBeenCalledWith(params, true);
    });

    test("should pass allowNpx parameter correctly", async () => {
      await executeGoogleSearch({ query: "test" }, false);

      expect(mockGeminiService.search).toHaveBeenCalledWith(
        { query: "test" },
        false,
      );
    });

    test("should return service result", async () => {
      mockGeminiService.search.mockResolvedValueOnce(
        "Mock search results markdown",
      );

      const result = await executeGoogleSearch({ query: "test" });

      expect(result).toBe("Mock search results markdown");
    });

    test("should handle service errors", async () => {
      mockGeminiService.search.mockRejectedValueOnce(
        new Error("Search failed"),
      );

      try {
        await executeGoogleSearch({ query: "test" });
        expect(true).toBe(false); // Should not reach
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe("Search failed");
      }
    });

    test("should work with all optional parameters", async () => {
      const params = {
        query: "advanced query",
        limit: 10,
        raw: true,
        sandbox: true,
        yolo: false,
        model: "gemini-ultra",
        workingDirectory: "/tmp",
        apiKey: "key123",
      };

      await executeGoogleSearch(params, true);

      expect(mockGeminiService.search).toHaveBeenCalledWith(params, true);
    });
  });

  describe("executeGeminiChat (recommended)", () => {
    test("should validate input with GeminiChatParametersSchema", async () => {
      const validInput = { prompt: "Hello AI" };

      await executeGeminiChat(validInput, false);

      // Should not throw validation error
      expect(mockGeminiService.chat).toHaveBeenCalledTimes(1);
    });

    test("should reject invalid input", async () => {
      const invalidInput = { prompt: null }; // prompt should be string

      try {
        await executeGeminiChat(invalidInput, false);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        // Zod validation error expected
        expect(error).toBeDefined();
      }
    });

    test("should delegate to geminiService.chat", async () => {
      const params = {
        prompt: "Explain quantum mechanics",
        model: "gemini-pro",
      };

      await executeGeminiChat(params, true);

      expect(mockGeminiService.chat).toHaveBeenCalledTimes(1);
      expect(mockGeminiService.chat).toHaveBeenCalledWith(params, true);
    });

    test("should pass allowNpx parameter correctly", async () => {
      await executeGeminiChat({ prompt: "test" }, false);

      expect(mockGeminiService.chat).toHaveBeenCalledWith(
        { prompt: "test" },
        false,
      );
    });

    test("should return service result", async () => {
      mockGeminiService.chat.mockResolvedValueOnce(
        "AI response to your question",
      );

      const result = await executeGeminiChat({ prompt: "test" });

      expect(result).toBe("AI response to your question");
    });

    test("should handle service errors", async () => {
      mockGeminiService.chat.mockRejectedValueOnce(new Error("Chat failed"));

      try {
        await executeGeminiChat({ prompt: "test" });
        expect(true).toBe(false); // Should not reach
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe("Chat failed");
      }
    });

    test("should work with all optional parameters", async () => {
      const params = {
        prompt: "complex prompt",
        sandbox: true,
        yolo: false,
        model: "gemini-ultra",
        workingDirectory: "/home/user",
        apiKey: "key456",
      };

      await executeGeminiChat(params, true);

      expect(mockGeminiService.chat).toHaveBeenCalledWith(params, true);
    });
  });

  describe("Backward compatibility guarantees", () => {
    test("all deprecated functions should still work", async () => {
      // decideGeminiCliCommand
      const cmd = await decideGeminiCliCommand(true);
      expect(cmd).toBeDefined();

      // executeGeminiCli
      const mockExecute = mock(async () => "result");
      const mockStream2 = mock(async () => new EventEmitter() as ChildProcess);
      mockGeminiCliExecutor.mockReturnValueOnce({
        execute: mockExecute,
        stream: mockStream2,
      });
      const execResult = await executeGeminiCli(cmd, ["test"]);
      expect(execResult).toBeDefined();

      // streamGeminiCli
      const mockChild = new EventEmitter() as ChildProcess;
      mockChild.stdout = new EventEmitter() as any;
      mockChild.stderr = new EventEmitter() as any;
      const mockStream3 = mock(async () => mockChild);
      const mockExecute2 = mock(async () => "Execute");
      mockGeminiCliExecutor.mockReturnValueOnce({
        execute: mockExecute2,
        stream: mockStream3,
      });
      const streamResult = await streamGeminiCli(cmd, ["test"]);
      expect(streamResult).toBeDefined();

      // executeGoogleSearch
      mockGeminiService.search.mockResolvedValueOnce("search result");
      const searchResult = await executeGoogleSearch({ query: "test" });
      expect(searchResult).toBeDefined();

      // executeGeminiChat
      mockGeminiService.chat.mockResolvedValueOnce("chat result");
      const chatResult = await executeGeminiChat({ prompt: "test" });
      expect(chatResult).toBeDefined();
    });
  });
});
