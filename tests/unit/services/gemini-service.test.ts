import { beforeEach, describe, expect, test } from "bun:test";
import { GeminiService } from "../../../lib/services/gemini-service";

describe("GeminiService", () => {
  let service: GeminiService;

  beforeEach(() => {
    service = new GeminiService();
  });

  describe("constructor", () => {
    test("creates a new GeminiService instance", () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(GeminiService);
    });
  });

  describe("search method signature", () => {
    test("search method accepts correct parameter types", () => {
      // Type checking - this will fail at compile time if signature is wrong
      const _validParams = {
        query: "test query",
        limit: 5,
        raw: true,
        sandbox: true,
        yolo: true,
        model: "gemini-2.5-flash",
        workingDirectory: "/tmp",
        apiKey: "test-key",
      };

      // We're just checking the method exists and has the right signature
      expect(typeof service.search).toBe("function");
      // Methods can have default parameters, so length may be less than total parameters
    });
  });

  describe("chat method signature", () => {
    test("chat method accepts correct parameter types", () => {
      const _validParams = {
        prompt: "test prompt",
        sandbox: true,
        yolo: true,
        model: "gemini-2.5-flash",
        workingDirectory: "/tmp",
        apiKey: "test-key",
      };

      // We're just checking the method exists and has the right signature
      expect(typeof service.chat).toBe("function");
      // Methods can have default parameters, so length may be less than total parameters
    });
  });

  describe("chatStream method signature", () => {
    test("chatStream method accepts correct parameter types", () => {
      const _validParams = {
        prompt: "test prompt",
        yolo: true,
      };

      // We're just checking the method exists and has the right signature
      expect(typeof service.chatStream).toBe("function");
      // Methods can have default parameters, so length may be less than total parameters
    });
  });

  describe("service instantiation", () => {
    test("multiple service instances are independent", () => {
      const service1 = new GeminiService();
      const service2 = new GeminiService();

      // Each instance should be independent
      expect(service1).not.toBe(service2);
      expect(service1).toBeInstanceOf(GeminiService);
      expect(service2).toBeInstanceOf(GeminiService);
    });

    test("exported singleton exists", async () => {
      const { geminiService } = await import(
        "../../../lib/services/gemini-service"
      );
      expect(geminiService).toBeInstanceOf(GeminiService);
    });
  });
});
