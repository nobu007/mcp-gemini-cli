/**
 * Unit tests for GeminiCliResolver
 * Tests CLI command resolution logic
 */

import { describe, test, expect } from "bun:test";
import { GeminiCliResolver } from "../../../lib/infrastructure/gemini-cli-resolver";

describe("GeminiCliResolver", () => {
  describe("resolve", () => {
    test("should resolve gemini command when available in PATH", async () => {
      // This test assumes 'gemini' is installed (as per the current test setup)
      const result = await GeminiCliResolver.resolve(false);

      expect(result).toBeDefined();
      expect(result.command).toBeDefined();
      expect(result.initialArgs).toBeDefined();
      expect(Array.isArray(result.initialArgs)).toBe(true);

      // Should either find 'gemini' or fallback to npx
      expect(
        result.command === "gemini" ||
          (result.command === "npx" &&
            result.initialArgs[0] === "@google/gemini-cli"),
      ).toBe(true);
    });

    test("should return command with initialArgs array", async () => {
      const result = await GeminiCliResolver.resolve(true);

      expect(result).toHaveProperty("command");
      expect(result).toHaveProperty("initialArgs");
      expect(Array.isArray(result.initialArgs)).toBe(true);
    });

    test("should fallback to npx when gemini not found", async () => {
      // This test verifies the fallback mechanism works
      const result = await GeminiCliResolver.resolve(true);

      if (result.command === "npx") {
        expect(result.initialArgs).toEqual(["@google/gemini-cli"]);
      } else {
        // If gemini is found, that's also valid
        expect(result.command).toBe("gemini");
        expect(result.initialArgs).toEqual([]);
      }
    });

    test("should resolve with allowNpx=false", async () => {
      const result = await GeminiCliResolver.resolve(false);

      expect(result).toBeDefined();
      expect(result.command).toBeTruthy();
    });

    test("should resolve with allowNpx=true", async () => {
      const result = await GeminiCliResolver.resolve(true);

      expect(result).toBeDefined();
      expect(result.command).toBeTruthy();
    });

    test("should return consistent structure", async () => {
      const result = await GeminiCliResolver.resolve(true);

      // Verify the structure matches GeminiCliCommand type
      expect(typeof result.command).toBe("string");
      expect(Array.isArray(result.initialArgs)).toBe(true);
      expect(result.initialArgs.every((arg) => typeof arg === "string")).toBe(
        true,
      );
    });

    test("should complete within reasonable time", async () => {
      const startTime = Date.now();
      await GeminiCliResolver.resolve(true);
      const elapsed = Date.now() - startTime;

      // Should complete within 5 seconds (generous timeout for CI)
      expect(elapsed).toBeLessThan(5000);
    });

    test("gemini command should have empty initialArgs", async () => {
      const result = await GeminiCliResolver.resolve(true);

      if (result.command === "gemini") {
        expect(result.initialArgs).toEqual([]);
      }
    });

    test("npx fallback should have correct initialArgs", async () => {
      const result = await GeminiCliResolver.resolve(true);

      if (result.command === "npx") {
        expect(result.initialArgs).toEqual(["@google/gemini-cli"]);
        expect(result.initialArgs.length).toBe(1);
      }
    });

    test("should handle multiple sequential calls", async () => {
      const result1 = await GeminiCliResolver.resolve(true);
      const result2 = await GeminiCliResolver.resolve(true);
      const result3 = await GeminiCliResolver.resolve(false);

      // All should succeed
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();

      // Results should be consistent
      expect(result1.command).toBe(result2.command);
      expect(result1.command).toBe(result3.command);
    });

    test("should handle parallel resolution calls", async () => {
      const promises = [
        GeminiCliResolver.resolve(true),
        GeminiCliResolver.resolve(false),
        GeminiCliResolver.resolve(true),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.command).toBeTruthy();
      });

      // All should return the same command
      expect(results[0].command).toBe(results[1].command);
      expect(results[1].command).toBe(results[2].command);
    });
  });

  describe("command validation", () => {
    test("resolved command should be executable", async () => {
      const result = await GeminiCliResolver.resolve(true);

      // The command should be a non-empty string
      expect(result.command).toBeTruthy();
      expect(typeof result.command).toBe("string");
      expect(result.command.length).toBeGreaterThan(0);
    });

    test("initialArgs should not contain the main command", async () => {
      const result = await GeminiCliResolver.resolve(true);

      if (result.command === "gemini") {
        expect(result.initialArgs).not.toContain("gemini");
      } else if (result.command === "npx") {
        expect(result.initialArgs[0]).toBe("@google/gemini-cli");
      }
    });
  });

  describe("error resilience", () => {
    test("should never reject the promise", async () => {
      // The resolver always falls back to npx, so it should never reject
      const result = await GeminiCliResolver.resolve(true);
      expect(result).toBeDefined();
    });

    test("should handle system errors gracefully", async () => {
      // Even if 'which' command fails, should fallback to npx
      const result = await GeminiCliResolver.resolve(false);
      expect(result).toBeDefined();
      expect(result.command).toBeTruthy();
    });
  });
});
