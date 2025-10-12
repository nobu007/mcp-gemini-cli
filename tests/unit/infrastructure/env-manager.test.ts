import { beforeEach, describe, expect, test } from "bun:test";
import { EnvManager } from "../../../lib/infrastructure/env-manager";

describe("EnvManager", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  describe("prepareEnv", () => {
    test("merges custom env with process.env", () => {
      const customEnv = { TEST_KEY: "test_value" };
      const result = EnvManager.prepareEnv(customEnv);

      expect(result.TEST_KEY).toBe("test_value");
      expect(result.PATH).toBeDefined(); // Should include system PATH
    });

    test("handles undefined custom env", () => {
      const result = EnvManager.prepareEnv();

      expect(result.PATH).toBeDefined();
      expect(typeof result).toBe("object");
    });

    test("overrides process.env values with custom env", () => {
      process.env.MY_VAR = "old_value";
      const customEnv = { MY_VAR: "new_value" };
      const result = EnvManager.prepareEnv(customEnv);

      expect(result.MY_VAR).toBe("new_value");
    });

    test("filters out undefined values", () => {
      const customEnv = { DEFINED: "value", UNDEFINED: undefined };
      const result = EnvManager.prepareEnv(customEnv);

      expect(result.DEFINED).toBe("value");
      expect(result.UNDEFINED).toBeUndefined();
    });
  });

  describe("fromToolArgs", () => {
    test("creates env object from tool arguments with API key", () => {
      const result = EnvManager.fromToolArgs({ apiKey: "test-key-123" });

      expect(result.GEMINI_API_KEY).toBe("test-key-123");
    });

    test("returns empty object when apiKey is undefined", () => {
      const result = EnvManager.fromToolArgs({});

      expect(Object.keys(result)).toHaveLength(0);
    });

    test("returns empty object when apiKey is empty string", () => {
      const result = EnvManager.fromToolArgs({ apiKey: "" });

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe("resolveWorkingDirectory", () => {
    test("returns param value when provided", () => {
      const result = EnvManager.resolveWorkingDirectory(
        "/custom/path",
        "/env/path",
      );

      expect(result).toBe("/custom/path");
    });

    test("returns env value when param is undefined", () => {
      const result = EnvManager.resolveWorkingDirectory(undefined, "/env/path");

      expect(result).toBe("/env/path");
    });

    test("returns process.cwd() when both are undefined", () => {
      const result = EnvManager.resolveWorkingDirectory(undefined, undefined);

      expect(result).toBe(process.cwd());
    });

    test("prefers param over env", () => {
      const result = EnvManager.resolveWorkingDirectory(
        "/param/path",
        "/env/path",
      );

      expect(result).toBe("/param/path");
    });
  });

  describe("maskSensitiveData", () => {
    test("masks API key values", () => {
      const env = { GEMINI_API_KEY: "secret-key-123" };
      const result = EnvManager.maskSensitiveData(env);

      expect(result.GEMINI_API_KEY).toBe("[MASKED]");
    });

    test("does not mask non-API-key values", () => {
      const env = { DB_PASSWORD: "secret-password" };
      const result = EnvManager.maskSensitiveData(env);

      expect(result.DB_PASSWORD).toBe("secret-password");
    });

    test("preserves non-GEMINI_API_KEY values", () => {
      const env = { AUTH_TOKEN: "secret-token" };
      const result = EnvManager.maskSensitiveData(env);

      expect(result.AUTH_TOKEN).toBe("secret-token");
    });

    test("only masks GEMINI_API_KEY", () => {
      const env = { MY_SECRET: "secret-value" };
      const result = EnvManager.maskSensitiveData(env);

      expect(result.MY_SECRET).toBe("secret-value");
    });

    test("preserves non-sensitive values", () => {
      const env = { PATH: "/usr/bin", HOME: "/home/user" };
      const result = EnvManager.maskSensitiveData(env);

      expect(result.PATH).toBe("/usr/bin");
      expect(result.HOME).toBe("/home/user");
    });

    test("handles mixed GEMINI_API_KEY and non-sensitive values", () => {
      const env = {
        GEMINI_API_KEY: "secret",
        PATH: "/usr/bin",
        PASSWORD: "secret",
        USER: "john",
      };
      const result = EnvManager.maskSensitiveData(env);

      expect(result.GEMINI_API_KEY).toBe("[MASKED]");
      expect(result.PATH).toBe("/usr/bin");
      expect(result.PASSWORD).toBe("secret");
      expect(result.USER).toBe("john");
    });

    test("handles undefined values", () => {
      const env = { GEMINI_API_KEY: undefined, PATH: "/usr/bin" };
      const result = EnvManager.maskSensitiveData(env);

      expect(result.GEMINI_API_KEY).toBeUndefined();
      expect(result.PATH).toBe("/usr/bin");
    });
  });
});
