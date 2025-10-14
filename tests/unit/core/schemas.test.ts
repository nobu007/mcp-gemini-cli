import { describe, it, expect } from 'bun:test';
import {
  GoogleSearchParametersSchema,
  GeminiChatParametersSchema,
  TOOL_DEFINITIONS,
  GoogleSearchToolSchema,
  GeminiChatToolSchema,
} from '../../../lib/core/schemas';

describe('Schemas', () => {
  describe('GoogleSearchParametersSchema', () => {
    it('should validate valid search parameters', () => {
      const valid = {
        query: 'test query',
        limit: 5,
        raw: true,
        sandbox: false,
        yolo: false,
        model: 'gemini-2.5-pro',
        workingDirectory: '/tmp',
        apiKey: 'test-key',
      };

      const result = GoogleSearchParametersSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('test query');
        expect(result.data.limit).toBe(5);
        expect(result.data.raw).toBe(true);
      }
    });

    it('should validate minimal search parameters', () => {
      const minimal = { query: 'test' };
      const result = GoogleSearchParametersSchema.safeParse(minimal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('test');
        expect(result.data.limit).toBeUndefined();
        expect(result.data.raw).toBeUndefined();
      }
    });

    it('should reject missing query', () => {
      const invalid = { limit: 5 };
      const result = GoogleSearchParametersSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should accept empty query (Zod allows empty strings)', () => {
      const withEmptyQuery = { query: '' };
      const result = GoogleSearchParametersSchema.safeParse(withEmptyQuery);

      // Note: Zod string() accepts empty strings by default
      // Use .min(1) to reject empty strings if needed
      expect(result.success).toBe(true);
    });

    it('should validate all optional parameters', () => {
      const withOptionals = {
        query: 'test',
        limit: 10,
        raw: false,
        sandbox: true,
        yolo: true,
        model: 'gemini-2.5-flash',
        workingDirectory: '/home/user',
        apiKey: 'secret-key',
      };

      const result = GoogleSearchParametersSchema.safeParse(withOptionals);
      expect(result.success).toBe(true);
    });

    it('should reject invalid types', () => {
      const invalidTypes = {
        query: 'test',
        limit: 'not a number',
        raw: 'not a boolean',
      };

      const result = GoogleSearchParametersSchema.safeParse(invalidTypes);
      expect(result.success).toBe(false);
    });

    it('should handle null values correctly', () => {
      const withNull = {
        query: 'test',
        limit: null,
      };

      const result = GoogleSearchParametersSchema.safeParse(withNull);
      expect(result.success).toBe(false);
    });
  });

  describe('GeminiChatParametersSchema', () => {
    it('should validate valid chat parameters', () => {
      const valid = {
        prompt: 'Hello, how are you?',
        sandbox: true,
        yolo: false,
        model: 'gemini-2.5-pro',
        workingDirectory: '/tmp',
        apiKey: 'test-key',
      };

      const result = GeminiChatParametersSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prompt).toBe('Hello, how are you?');
      }
    });

    it('should validate minimal chat parameters', () => {
      const minimal = { prompt: 'Hello' };
      const result = GeminiChatParametersSchema.safeParse(minimal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prompt).toBe('Hello');
        expect(result.data.sandbox).toBeUndefined();
      }
    });

    it('should reject missing prompt', () => {
      const invalid = { model: 'gemini-1.5-pro' };
      const result = GeminiChatParametersSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should accept empty prompt (Zod allows empty strings)', () => {
      const withEmptyPrompt = { prompt: '' };
      const result = GeminiChatParametersSchema.safeParse(withEmptyPrompt);

      // Note: Zod string() accepts empty strings by default
      // Use .min(1) to reject empty strings if needed
      expect(result.success).toBe(true);
    });

    it('should accept long prompts', () => {
      const longPrompt = 'a'.repeat(10000);
      const valid = { prompt: longPrompt };

      const result = GeminiChatParametersSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate all base parameters', () => {
      const full = {
        prompt: 'hello',
        sandbox: true,
        yolo: true,
        model: 'gemini-2.5-flash',
        workingDirectory: '/home',
        apiKey: 'secret',
      };

      const result = GeminiChatParametersSchema.safeParse(full);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in prompt', () => {
      const specialChars = {
        prompt: 'Hello! @#$%^&*() 日本語 émojis 🎉',
      };

      const result = GeminiChatParametersSchema.safeParse(specialChars);
      expect(result.success).toBe(true);
    });
  });

  describe('TOOL_DEFINITIONS', () => {
    it('should have googleSearch definition', () => {
      expect(TOOL_DEFINITIONS.googleSearch).toBeDefined();
      expect(TOOL_DEFINITIONS.googleSearch.name).toBe('googleSearch');
      expect(TOOL_DEFINITIONS.googleSearch.description).toBeTruthy();
      expect(TOOL_DEFINITIONS.googleSearch.schema).toBeTruthy();
    });

    it('should have geminiChat definition', () => {
      expect(TOOL_DEFINITIONS.geminiChat).toBeDefined();
      expect(TOOL_DEFINITIONS.geminiChat.name).toBe('geminiChat');
      expect(TOOL_DEFINITIONS.geminiChat.description).toBeTruthy();
      expect(TOOL_DEFINITIONS.geminiChat.schema).toBeTruthy();
    });

    it('should have exactly two tool definitions', () => {
      const keys = Object.keys(TOOL_DEFINITIONS);
      expect(keys.length).toBe(2);
      expect(keys).toContain('googleSearch');
      expect(keys).toContain('geminiChat');
    });

    it('googleSearch schema should match GoogleSearchToolSchema', () => {
      expect(TOOL_DEFINITIONS.googleSearch.schema).toBe(GoogleSearchToolSchema);
    });

    it('geminiChat schema should match GeminiChatToolSchema', () => {
      expect(TOOL_DEFINITIONS.geminiChat.schema).toBe(GeminiChatToolSchema);
    });

    it('should have meaningful descriptions', () => {
      expect(TOOL_DEFINITIONS.googleSearch.description.length).toBeGreaterThan(10);
      expect(TOOL_DEFINITIONS.geminiChat.description.length).toBeGreaterThan(10);

      expect(TOOL_DEFINITIONS.googleSearch.description.toLowerCase()).toContain('search');
      expect(TOOL_DEFINITIONS.geminiChat.description.toLowerCase()).toContain('chat');
    });
  });

  describe('GoogleSearchToolSchema', () => {
    it('should be a Zod shape object', () => {
      expect(GoogleSearchToolSchema).toBeDefined();
      expect(typeof GoogleSearchToolSchema).toBe('object');
    });

    it('should contain query field', () => {
      expect(GoogleSearchToolSchema.query).toBeDefined();
    });

    it('should contain optional fields', () => {
      expect(GoogleSearchToolSchema.limit).toBeDefined();
      expect(GoogleSearchToolSchema.raw).toBeDefined();
      expect(GoogleSearchToolSchema.sandbox).toBeDefined();
      expect(GoogleSearchToolSchema.yolo).toBeDefined();
      expect(GoogleSearchToolSchema.model).toBeDefined();
    });
  });

  describe('GeminiChatToolSchema', () => {
    it('should be a Zod shape object', () => {
      expect(GeminiChatToolSchema).toBeDefined();
      expect(typeof GeminiChatToolSchema).toBe('object');
    });

    it('should contain prompt field', () => {
      expect(GeminiChatToolSchema.prompt).toBeDefined();
    });

    it('should contain base parameters', () => {
      expect(GeminiChatToolSchema.sandbox).toBeDefined();
      expect(GeminiChatToolSchema.yolo).toBeDefined();
      expect(GeminiChatToolSchema.model).toBeDefined();
    });
  });

  describe('Schema integration', () => {
    it('should parse and validate googleSearch parameters end-to-end', () => {
      const input = {
        query: 'TypeScript tutorials',
        limit: 3,
        raw: true,
      };

      const parsed = GoogleSearchParametersSchema.parse(input);

      expect(parsed.query).toBe('TypeScript tutorials');
      expect(parsed.limit).toBe(3);
      expect(parsed.raw).toBe(true);
    });

    it('should parse and validate geminiChat parameters end-to-end', () => {
      const input = {
        prompt: 'Explain quantum computing',
        model: 'gemini-2.5-pro',
      };

      const parsed = GeminiChatParametersSchema.parse(input);

      expect(parsed.prompt).toBe('Explain quantum computing');
      expect(parsed.model).toBe('gemini-2.5-pro');
    });

    it('should throw on invalid googleSearch input', () => {
      const invalid = { query: 123 };

      expect(() => GoogleSearchParametersSchema.parse(invalid)).toThrow();
    });

    it('should throw on invalid geminiChat input', () => {
      const invalid = { prompt: true };

      expect(() => GeminiChatParametersSchema.parse(invalid)).toThrow();
    });
  });

  describe('Type safety', () => {
    it('should infer correct types from GoogleSearchParametersSchema', () => {
      const data = GoogleSearchParametersSchema.parse({
        query: 'test',
        limit: 5,
      });

      // TypeScript should infer these types correctly
      const query: string = data.query;
      const limit: number | undefined = data.limit;

      expect(query).toBe('test');
      expect(limit).toBe(5);
    });

    it('should infer correct types from GeminiChatParametersSchema', () => {
      const data = GeminiChatParametersSchema.parse({
        prompt: 'hello',
      });

      // TypeScript should infer these types correctly
      const prompt: string = data.prompt;
      const sandbox: boolean | undefined = data.sandbox;

      expect(prompt).toBe('hello');
      expect(sandbox).toBeUndefined();
    });
  });
});
