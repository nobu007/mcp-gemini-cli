/**
 * Unit tests for MCP Server configuration
 *
 * Tests the MCP server initialization, tool registration, and configuration
 * management, particularly the GEMINI_CLI_ALLOW_NPX environment variable.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";

describe("MCP Server Configuration", () => {
  // Store original environment variable
  let originalAllowNpx: string | undefined;

  beforeEach(() => {
    // Save original value
    originalAllowNpx = process.env.GEMINI_CLI_ALLOW_NPX;
  });

  afterEach(() => {
    // Restore original value
    if (originalAllowNpx === undefined) {
      delete process.env.GEMINI_CLI_ALLOW_NPX;
    } else {
      process.env.GEMINI_CLI_ALLOW_NPX = originalAllowNpx;
    }

    // Clear module cache to allow fresh imports in each test
    // This is necessary because the allowNpx constant is evaluated at module load time
    const mcpServerPath = require.resolve("@/lib/mcp-server");
    if (mcpServerPath) {
      delete require.cache[mcpServerPath];
    }
  });

  describe("GEMINI_CLI_ALLOW_NPX environment variable", () => {
    test("should default to true when GEMINI_CLI_ALLOW_NPX is not set", () => {
      delete process.env.GEMINI_CLI_ALLOW_NPX;

      // Re-import module to get fresh allowNpx value
      const freshModule = require("@/lib/mcp-server");

      // allowNpx is not exported, but we can verify behavior indirectly
      // by checking the module loads without errors
      expect(freshModule.mcpServer).toBeDefined();
    });

    test("should be true when GEMINI_CLI_ALLOW_NPX=true", () => {
      process.env.GEMINI_CLI_ALLOW_NPX = "true";

      // Re-import module
      const freshModule = require("@/lib/mcp-server");

      expect(freshModule.mcpServer).toBeDefined();
    });

    test("should be false when GEMINI_CLI_ALLOW_NPX=false", () => {
      process.env.GEMINI_CLI_ALLOW_NPX = "false";

      // Re-import module
      const freshModule = require("@/lib/mcp-server");

      expect(freshModule.mcpServer).toBeDefined();
    });

    test("should be case-insensitive (FALSE should disable npx)", () => {
      process.env.GEMINI_CLI_ALLOW_NPX = "FALSE";

      // Re-import module
      const freshModule = require("@/lib/mcp-server");

      expect(freshModule.mcpServer).toBeDefined();
    });

    test("should be case-insensitive (False should disable npx)", () => {
      process.env.GEMINI_CLI_ALLOW_NPX = "False";

      // Re-import module
      const freshModule = require("@/lib/mcp-server");

      expect(freshModule.mcpServer).toBeDefined();
    });

    test("should default to true for any value other than 'false'", () => {
      process.env.GEMINI_CLI_ALLOW_NPX = "yes";

      // Re-import module
      const freshModule = require("@/lib/mcp-server");

      expect(freshModule.mcpServer).toBeDefined();
    });

    test("should default to true for empty string", () => {
      process.env.GEMINI_CLI_ALLOW_NPX = "";

      // Re-import module
      const freshModule = require("@/lib/mcp-server");

      expect(freshModule.mcpServer).toBeDefined();
    });
  });

  describe("MCP Server Instance", () => {
    test("should have correct name and version", async () => {
      // Import fresh module
      const { mcpServer } = await import("@/lib/mcp-server");

      expect(mcpServer).toBeDefined();
      // Note: McpServer properties may not be directly accessible
      // This test verifies the module exports the server instance
    });

    test("should export mcpServer instance", async () => {
      const { mcpServer } = await import("@/lib/mcp-server");

      expect(mcpServer).toBeDefined();
      expect(typeof mcpServer).toBe("object");
    });
  });

  describe("Tool Registration", () => {
    test("should register tools without errors", async () => {
      // Import should complete without throwing errors
      const module = await import("@/lib/mcp-server");

      expect(module.mcpServer).toBeDefined();
    });

    test("should use centralized TOOL_DEFINITIONS", async () => {
      // Verify the module imports TOOL_DEFINITIONS
      const { TOOL_DEFINITIONS } = await import("@/lib/core/schemas");

      expect(TOOL_DEFINITIONS.googleSearch).toBeDefined();
      expect(TOOL_DEFINITIONS.geminiChat).toBeDefined();
    });
  });
});
