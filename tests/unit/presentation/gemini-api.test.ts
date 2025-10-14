/**
 * Unit tests for Gemini API handlers (Presentation Layer)
 *
 * Tests the HTTP API handler functions in gemini-api.ts, verifying
 * parameter validation, service layer delegation, response formatting,
 * and error handling.
 */

import { describe, test, expect, mock, beforeEach } from "bun:test";
import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";

describe("Gemini API Handlers", async () => {
  // Mock the service layer before importing gemini-api
  const mockGeminiService = {
    search: mock(async () => "Search result"),
    chat: mock(async () => "Chat response"),
    chatStream: mock(() => {
      const mockChild = new EventEmitter();
      (mockChild as ChildProcess).stdout = new Readable({ read() {} });
      (mockChild as ChildProcess).stderr = new Readable({ read() {} });
      (mockChild as ChildProcess).kill = mock(() => true);
      return Promise.resolve(mockChild as ChildProcess);
    }),
  };

  // Mock the modules before importing gemini-api
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

  // Now we can import gemini-api with mocked dependencies
  const { handleGoogleSearch, handleGeminiChat, handleGeminiChatStream } =
    await import("@/lib/gemini-api");

  beforeEach(() => {
    // Reset all mocks before each test
    mockGeminiService.search.mockClear();
    mockGeminiService.chat.mockClear();
    mockGeminiService.chatStream.mockClear();
  });

  describe("handleGoogleSearch", () => {
    test("should call geminiService.search with correct parameters", async () => {
      const query = "TypeScript best practices";
      const options = { limit: 5, model: "gemini-pro" };

      await handleGoogleSearch(query, options);

      expect(mockGeminiService.search).toHaveBeenCalledTimes(1);
      expect(mockGeminiService.search).toHaveBeenCalledWith(
        {
          query,
          ...options,
        },
        true, // allowNpx
      );
    });

    test("should return success response with data", async () => {
      mockGeminiService.search.mockResolvedValueOnce("Mock search results");

      const result = await handleGoogleSearch("quantum computing");

      expect(result.success).toBe(true);
      expect(result.data).toBe("Mock search results");
      expect(result.timestamp).toBeDefined();
    });

    test("should handle errors and return error response", async () => {
      mockGeminiService.search.mockRejectedValueOnce(
        new Error("Search failed"),
      );

      const result = await handleGoogleSearch("test query");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test("should work with default options (no options provided)", async () => {
      await handleGoogleSearch("simple query");

      expect(mockGeminiService.search).toHaveBeenCalledWith(
        { query: "simple query" },
        true,
      );
    });

    test("should pass all supported options to service", async () => {
      const options = {
        limit: 10,
        raw: true,
        sandbox: true,
        yolo: false,
        model: "gemini-ultra",
        workingDirectory: "/tmp",
        apiKey: "test-key-123",
      };

      await handleGoogleSearch("test", options);

      expect(mockGeminiService.search).toHaveBeenCalledWith(
        {
          query: "test",
          ...options,
        },
        true,
      );
    });
  });

  describe("handleGeminiChat", () => {
    test("should call geminiService.chat with correct parameters", async () => {
      const prompt = "Explain quantum entanglement";
      const options = { model: "gemini-pro", sandbox: true };

      await handleGeminiChat(prompt, options);

      expect(mockGeminiService.chat).toHaveBeenCalledTimes(1);
      expect(mockGeminiService.chat).toHaveBeenCalledWith(
        {
          prompt,
          ...options,
        },
        true, // allowNpx
      );
    });

    test("should return success response with data", async () => {
      mockGeminiService.chat.mockResolvedValueOnce(
        "Mock chat response about quantum physics",
      );

      const result = await handleGeminiChat("What is quantum computing?");

      expect(result.success).toBe(true);
      expect(result.data).toBe("Mock chat response about quantum physics");
      expect(result.timestamp).toBeDefined();
    });

    test("should handle errors and return error response", async () => {
      mockGeminiService.chat.mockRejectedValueOnce(
        new Error("Chat API unavailable"),
      );

      const result = await handleGeminiChat("test prompt");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test("should work with default options (no options provided)", async () => {
      await handleGeminiChat("Hello AI");

      expect(mockGeminiService.chat).toHaveBeenCalledWith(
        { prompt: "Hello AI" },
        true,
      );
    });

    test("should pass all supported options to service", async () => {
      const options = {
        sandbox: true,
        yolo: false,
        model: "gemini-ultra",
        workingDirectory: "/home/user",
        apiKey: "test-key-456",
      };

      await handleGeminiChat("Write code", options);

      expect(mockGeminiService.chat).toHaveBeenCalledWith(
        {
          prompt: "Write code",
          ...options,
        },
        true,
      );
    });
  });

  describe("handleGeminiChatStream", () => {
    test("should call geminiService.chatStream with correct parameters", async () => {
      const prompt = "Write a long essay";
      const options = { model: "gemini-pro" };

      const stream = handleGeminiChatStream(prompt, options);

      // Consume stream to trigger start()
      const reader = stream.getReader();
      await reader.cancel(); // Stop immediately

      expect(mockGeminiService.chatStream).toHaveBeenCalledTimes(1);
    });

    test("should return a ReadableStream", () => {
      const stream = handleGeminiChatStream("test prompt");

      expect(stream).toBeInstanceOf(ReadableStream);
      expect(typeof stream.getReader).toBe("function");
    });

    test("should accept prompt and options", () => {
      const prompt = "Write a long essay";
      const options = { model: "gemini-pro", sandbox: true };

      const stream = handleGeminiChatStream(prompt, options);

      expect(stream).toBeDefined();
      expect(stream).toBeInstanceOf(ReadableStream);
    });

    test("should work with empty options", () => {
      const stream = handleGeminiChatStream("test");

      expect(stream).toBeDefined();
      expect(stream).toBeInstanceOf(ReadableStream);
    });

    test("should accept all supported options", () => {
      const options = {
        sandbox: true,
        yolo: false,
        model: "gemini-ultra",
        workingDirectory: "/tmp",
        apiKey: "test-key",
      };

      const stream = handleGeminiChatStream("test prompt", options);

      expect(stream).toBeDefined();
      expect(stream).toBeInstanceOf(ReadableStream);
    });
  });

  describe("Response formatting", () => {
    test("handleGoogleSearch should return ResponseFormatter.success format", async () => {
      mockGeminiService.search.mockResolvedValueOnce("Test data");

      const result = await handleGoogleSearch("test");

      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("timestamp");
      expect(typeof result.timestamp).toBe("string");
    });

    test("handleGoogleSearch should return ResponseFormatter.error format", async () => {
      mockGeminiService.search.mockRejectedValueOnce(new Error("Test error"));

      const result = await handleGoogleSearch("test");

      expect(result).toHaveProperty("success", false);
      expect(result).toHaveProperty("error");
      expect(result).toHaveProperty("timestamp");
      expect(typeof result.timestamp).toBe("string");
    });

    test("handleGeminiChat should return ResponseFormatter.success format", async () => {
      mockGeminiService.chat.mockResolvedValueOnce("Test response");

      const result = await handleGeminiChat("test");

      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("timestamp");
    });

    test("handleGeminiChat should return ResponseFormatter.error format", async () => {
      mockGeminiService.chat.mockRejectedValueOnce(new Error("Test error"));

      const result = await handleGeminiChat("test");

      expect(result).toHaveProperty("success", false);
      expect(result).toHaveProperty("error");
      expect(result).toHaveProperty("timestamp");
    });
  });
});
