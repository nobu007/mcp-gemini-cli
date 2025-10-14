import { describe, expect, test } from "bun:test";
import { ResponseFormatter } from "../../../lib/services/response-formatter";

describe("ResponseFormatter", () => {
  describe("success", () => {
    test("formats successful response with data", () => {
      const data = "test result";
      const response = ResponseFormatter.success(data);

      expect(response.success).toBe(true);
      expect(response.data).toBe(data);
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp).getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
    });

    test("handles complex data objects", () => {
      const data = {
        summary: "Test summary",
        sources: [{ url: "https://example.com", title: "Example" }],
      };
      const response = ResponseFormatter.success(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
    });

    test("handles empty string data", () => {
      const response = ResponseFormatter.success("");

      expect(response.success).toBe(true);
      expect(response.data).toBe("");
    });

    test("timestamp is ISO 8601 format", () => {
      const response = ResponseFormatter.success("test");

      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });

  describe("error", () => {
    test("formats error response from Error object", () => {
      const error = new Error("Test error message");
      const response = ResponseFormatter.error(error);

      expect(response.success).toBe(false);
      expect(response.error).toBe("Test error message");
      expect(response.timestamp).toBeDefined();
    });

    test("handles string errors", () => {
      const response = ResponseFormatter.error("String error");

      expect(response.success).toBe(false);
      expect(response.error).toBe("String error");
    });

    test("handles unknown error types", () => {
      const response = ResponseFormatter.error({ custom: "error" });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(typeof response.error).toBe("string");
    });

    test("handles null/undefined errors", () => {
      const response1 = ResponseFormatter.error(null);
      const response2 = ResponseFormatter.error(undefined);

      expect(response1.success).toBe(false);
      expect(response1.error).toBeDefined();
      expect(response2.success).toBe(false);
      expect(response2.error).toBeDefined();
    });
  });

  describe("sse", () => {
    test("formats SSE message with type and content", () => {
      const message = { type: "stdout" as const, content: "test output" };
      const sse = ResponseFormatter.sse(message);

      expect(sse).toContain("data: ");
      expect(sse).toContain('"type":"stdout"');
      expect(sse).toContain('"content":"test output"');
      expect(sse).toEndWith("\n\n");
    });

    test("handles different message types", () => {
      const types = ["stdout", "stderr", "close", "error"] as const;

      for (const type of types) {
        const message = { type, content: `${type} content` };
        const sse = ResponseFormatter.sse(message);

        expect(sse).toContain(`"type":"${type}"`);
        expect(sse).toContain(`"content":"${type} content"`);
      }
    });

    test("handles empty content", () => {
      const message = { type: "stdout" as const, content: "" };
      const sse = ResponseFormatter.sse(message);

      expect(sse).toContain('"content":""');
      expect(sse).toEndWith("\n\n");
    });

    test("escapes special characters in JSON", () => {
      const message = {
        type: "stdout" as const,
        content: 'test "quotes" and \n newlines',
      };
      const sse = ResponseFormatter.sse(message);

      expect(sse).toContain("data: ");
      // JSON.stringify should handle escaping
      expect(sse).toContain('\\"');
    });

    test("formats correct SSE structure", () => {
      const message = { type: "stdout" as const, content: "test" };
      const sse = ResponseFormatter.sse(message);

      // Should start with "data: "
      expect(sse.startsWith("data: ")).toBe(true);
      // Should end with double newline
      expect(sse.endsWith("\n\n")).toBe(true);
      // Should contain valid JSON after "data: "
      const jsonPart = sse.slice(6, -2); // Remove "data: " and "\n\n"
      expect(() => JSON.parse(jsonPart)).not.toThrow();
    });
  });

  describe("response structure consistency", () => {
    test("success responses have consistent structure", () => {
      const response1 = ResponseFormatter.success("data1");
      const response2 = ResponseFormatter.success("data2");

      expect(Object.keys(response1).sort()).toEqual(
        Object.keys(response2).sort(),
      );
      expect(response1).toHaveProperty("success");
      expect(response1).toHaveProperty("data");
      expect(response1).toHaveProperty("timestamp");
    });

    test("error responses have consistent structure", () => {
      const response1 = ResponseFormatter.error(new Error("error1"));
      const response2 = ResponseFormatter.error("error2");

      expect(Object.keys(response1).sort()).toEqual(
        Object.keys(response2).sort(),
      );
      expect(response1).toHaveProperty("success");
      expect(response1).toHaveProperty("error");
      expect(response1).toHaveProperty("timestamp");
    });

    test("success and error responses have different structures", () => {
      const successResponse = ResponseFormatter.success("data");
      const errorResponse = ResponseFormatter.error("error");

      expect(successResponse).toHaveProperty("data");
      expect(successResponse).not.toHaveProperty("error");
      expect(errorResponse).toHaveProperty("error");
      expect(errorResponse).not.toHaveProperty("data");
    });
  });
});
