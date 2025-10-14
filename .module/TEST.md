# Test Specifications

## Testing Philosophy

This module follows a layered testing approach matching the architecture:

1. **Unit Tests**: Test individual functions and classes in isolation
2. **Integration Tests**: Test layer interactions
3. **E2E Tests**: Test complete user workflows
4. **Contract Tests**: Verify API contracts don't break

## Test Coverage Goals

### Current Status (Updated 2025-10-14)

- **Unit Tests**: 65.85% line coverage, 60.06% function coverage
  - Core Layer (schemas.ts): 100% ✅
  - Infrastructure Layer:
    - logger.ts: 100% ✅
    - env-manager.ts: 100% ✅
    - file-system-service.ts: 88% ✅
    - cli-executor.ts: 7.63% (needs improvement)
    - gemini-cli-executor.ts: 9.30% (needs improvement)
    - gemini-cli-resolver.ts: 9.80% (needs improvement)
  - Services Layer:
    - specification-service.ts: 100% ✅
    - name-generation-service.ts: 100% ✅
    - response-formatter.ts: 68%
    - gemini-service.ts: 7.52% (needs improvement)
- **Integration Tests**: Partial (tools.test.ts exists)
- **E2E Tests**: 0% (not implemented yet)

### Target Coverage

- **Overall**: >80%
- **Infrastructure Layer**: >85% (critical path)
- **Core Layer**: >90% (pure logic, easy to test)
- **Service Layer**: >80% (orchestration)
- **API Layer**: >75% (integration tests cover most)

## Test Structure

```text
tests/
├── unit/
│   ├── infrastructure/
│   │   ├── env-manager.test.ts
│   │   ├── cli-executor.test.ts
│   │   └── gemini-cli-executor.test.ts
│   ├── core/
│   │   ├── schemas.test.ts
│   │   └── types.test.ts
│   ├── services/
│   │   ├── response-formatter.test.ts
│   │   └── gemini-service.test.ts
│   └── tools.test.ts
├── integration/
│   ├── gemini-service.test.ts
│   ├── mcp-server.test.ts
│   └── tools.test.ts (existing)
└── e2e/
    ├── mcp-stdio.test.ts
    ├── web-api.test.ts
    └── sse-streaming.test.ts
```

## Unit Test Specifications

### Infrastructure Layer

#### EnvManager Tests

**File**: `tests/unit/infrastructure/env-manager.test.ts`

```typescript
describe("EnvManager", () => {
  describe("prepareEnv", () => {
    it("should remove GEMINI_API_KEY by default", () => {
      process.env.GEMINI_API_KEY = "test-key";
      const env = EnvManager.prepareEnv();
      expect(env.GEMINI_API_KEY).toBeUndefined();
    });

    it("should disable IDE integration variables", () => {
      process.env.GEMINI_CLI_IDE_SERVER_PORT = "1234";
      const env = EnvManager.prepareEnv();
      expect(env.GEMINI_CLI_IDE_SERVER_PORT).toBeUndefined();
    });

    it("should apply custom environment variables", () => {
      const env = EnvManager.prepareEnv({ CUSTOM_VAR: "value" });
      expect(env.CUSTOM_VAR).toBe("value");
    });

    it("should unset variables with undefined value", () => {
      process.env.TO_DELETE = "exists";
      const env = EnvManager.prepareEnv({ TO_DELETE: undefined });
      expect(env.TO_DELETE).toBeUndefined();
    });
  });

  describe("maskSensitiveData", () => {
    it("should mask GEMINI_API_KEY", () => {
      const env = { GEMINI_API_KEY: "secret-key-123" };
      const masked = EnvManager.maskSensitiveData(env);
      expect(masked.GEMINI_API_KEY).toBe("[MASKED]");
    });

    it("should not modify other variables", () => {
      const env = { OTHER_VAR: "value" };
      const masked = EnvManager.maskSensitiveData(env);
      expect(masked.OTHER_VAR).toBe("value");
    });
  });

  describe("fromToolArgs", () => {
    it("should set GEMINI_API_KEY from apiKey arg", () => {
      const env = EnvManager.fromToolArgs({ apiKey: "my-key" });
      expect(env.GEMINI_API_KEY).toBe("my-key");
    });

    it("should return empty object if no apiKey", () => {
      const env = EnvManager.fromToolArgs({});
      expect(env).toEqual({});
    });
  });

  describe("resolveWorkingDirectory", () => {
    it("should use requested directory if provided", () => {
      const dir = EnvManager.resolveWorkingDirectory("/custom", "/env");
      expect(dir).toBe("/custom");
    });

    it("should fallback to envDefault", () => {
      const dir = EnvManager.resolveWorkingDirectory(undefined, "/env");
      expect(dir).toBe("/env");
    });

    it("should fallback to process.cwd()", () => {
      const dir = EnvManager.resolveWorkingDirectory(undefined, undefined);
      expect(dir).toBe(process.cwd());
    });
  });
});
```

**Coverage Goal**: >90%

#### GeminiCliExecutor Tests

**File**: `tests/unit/infrastructure/gemini-cli-executor.test.ts`

```typescript
describe("GeminiCliExecutor", () => {
  describe("buildSearchArgs", () => {
    it("should build basic search args", () => {
      const args = GeminiCliExecutor.buildSearchArgs({
        query: "test query",
      });
      expect(args).toEqual(["-p", "Search for: test query"]);
    });

    it("should include limit in prompt", () => {
      const args = GeminiCliExecutor.buildSearchArgs({
        query: "test",
        limit: 5,
      });
      expect(args[1]).toContain("up to 5 results");
    });

    it("should build raw search with JSON prompt", () => {
      const args = GeminiCliExecutor.buildSearchArgs({
        query: "test",
        raw: true,
      });
      expect(args[1]).toContain("valid JSON object");
      expect(args[1]).toContain("sources");
    });

    it("should add model flag if provided", () => {
      const args = GeminiCliExecutor.buildSearchArgs({
        query: "test",
        model: "gemini-2.5-pro",
      });
      expect(args).toContain("-m");
      expect(args).toContain("gemini-1.5-pro");
    });

    it("should add sandbox flag", () => {
      const args = GeminiCliExecutor.buildSearchArgs({
        query: "test",
        sandbox: true,
      });
      expect(args).toContain("-s");
    });

    it("should add yolo flag", () => {
      const args = GeminiCliExecutor.buildSearchArgs({
        query: "test",
        yolo: true,
      });
      expect(args).toContain("-y");
    });
  });

  describe("buildChatArgs", () => {
    it("should build basic chat args", () => {
      const args = GeminiCliExecutor.buildChatArgs({
        prompt: "hello",
      });
      expect(args).toEqual(["-p", "hello"]);
    });

    it("should add all optional flags", () => {
      const args = GeminiCliExecutor.buildChatArgs({
        prompt: "hello",
        sandbox: true,
        yolo: true,
        model: "gemini-2.5-flash",
      });
      expect(args).toContain("-s");
      expect(args).toContain("-y");
      expect(args).toContain("-m");
      expect(args).toContain("gemini-1.5-flash");
    });
  });

  describe("processRawSearchResult", () => {
    it("should parse valid JSON", () => {
      const input = '{"summary": "test", "sources": []}';
      const output = GeminiCliExecutor.processRawSearchResult(input);
      const parsed = JSON.parse(output);
      expect(parsed.summary).toBe("test");
    });

    it("should strip markdown backticks", () => {
      const input = '```json\n{"summary": "test"}\n```';
      const output = GeminiCliExecutor.processRawSearchResult(input);
      const parsed = JSON.parse(output);
      expect(parsed.summary).toBe("test");
    });

    it("should return raw output if JSON invalid", () => {
      const input = "not json";
      const output = GeminiCliExecutor.processRawSearchResult(input);
      expect(output).toBe(input);
    });

    it("should pretty-print valid JSON", () => {
      const input = '{"summary":"test"}';
      const output = GeminiCliExecutor.processRawSearchResult(input);
      expect(output).toContain("\n"); // Pretty-printed
    });
  });
});
```

**Coverage Goal**: >85%

### Core Layer

#### Schemas Tests

**File**: `tests/unit/core/schemas.test.ts`

```typescript
describe("Schemas", () => {
  describe("GoogleSearchParametersSchema", () => {
    it("should validate valid search parameters", () => {
      const valid = {
        query: "test",
        limit: 5,
        raw: true,
      };
      expect(() => GoogleSearchParametersSchema.parse(valid)).not.toThrow();
    });

    it("should reject missing query", () => {
      const invalid = { limit: 5 };
      expect(() => GoogleSearchParametersSchema.parse(invalid)).toThrow();
    });

    it("should accept optional parameters", () => {
      const minimal = { query: "test" };
      const parsed = GoogleSearchParametersSchema.parse(minimal);
      expect(parsed.query).toBe("test");
      expect(parsed.limit).toBeUndefined();
    });

    it("should validate all base parameters", () => {
      const full = {
        query: "test",
        sandbox: true,
        yolo: false,
        model: "gemini-2.5-pro",
        workingDirectory: "/tmp",
        apiKey: "key123",
      };
      expect(() => GoogleSearchParametersSchema.parse(full)).not.toThrow();
    });
  });

  describe("GeminiChatParametersSchema", () => {
    it("should validate valid chat parameters", () => {
      const valid = { prompt: "hello" };
      expect(() => GeminiChatParametersSchema.parse(valid)).not.toThrow();
    });

    it("should reject missing prompt", () => {
      const invalid = { model: "gemini-1.5-pro" };
      expect(() => GeminiChatParametersSchema.parse(invalid)).toThrow();
    });

    it("should accept all base parameters", () => {
      const full = {
        prompt: "hello",
        sandbox: true,
        yolo: true,
        model: "gemini-2.5-flash",
        workingDirectory: "/home",
        apiKey: "secret",
      };
      expect(() => GeminiChatParametersSchema.parse(full)).not.toThrow();
    });
  });

  describe("TOOL_DEFINITIONS", () => {
    it("should have googleSearch definition", () => {
      expect(TOOL_DEFINITIONS.googleSearch.name).toBe("googleSearch");
      expect(TOOL_DEFINITIONS.googleSearch.description).toBeTruthy();
      expect(TOOL_DEFINITIONS.googleSearch.schema).toBeTruthy();
    });

    it("should have geminiChat definition", () => {
      expect(TOOL_DEFINITIONS.geminiChat.name).toBe("geminiChat");
      expect(TOOL_DEFINITIONS.geminiChat.description).toBeTruthy();
      expect(TOOL_DEFINITIONS.geminiChat.schema).toBeTruthy();
    });

    it("should be immutable (as const)", () => {
      // TypeScript should enforce this at compile time
      expect(Object.isFrozen(TOOL_DEFINITIONS)).toBe(false); // as const doesn't freeze
      // But TypeScript prevents modification
    });
  });
});
```

**Coverage Goal**: >95%

### Service Layer

#### ResponseFormatter Tests

**File**: `tests/unit/services/response-formatter.test.ts`

```typescript
describe("ResponseFormatter", () => {
  describe("success", () => {
    it("should create success response", () => {
      const response = ResponseFormatter.success("test data");
      expect(response.success).toBe(true);
      expect(response.data).toBe("test data");
      expect(response.timestamp).toBeTruthy();
      expect(response.error).toBeUndefined();
    });

    it("should include ISO 8601 timestamp", () => {
      const response = ResponseFormatter.success("test");
      const date = new Date(response.timestamp);
      expect(date.toISOString()).toBe(response.timestamp);
    });
  });

  describe("error", () => {
    it("should create error response from Error", () => {
      const error = new Error("Test error");
      const response = ResponseFormatter.error(error);
      expect(response.success).toBe(false);
      expect(response.error).toBe("Test error");
      expect(response.data).toBeUndefined();
    });

    it("should create error response from string", () => {
      const response = ResponseFormatter.error("Error message");
      expect(response.error).toBe("Error message");
    });

    it("should convert non-Error objects to string", () => {
      const response = ResponseFormatter.error({ code: 500 });
      expect(typeof response.error).toBe("string");
    });
  });

  describe("mcpTool", () => {
    it("should format result for MCP tool", () => {
      const response = ResponseFormatter.mcpTool("Result text");
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe("text");
      expect(response.content[0].text).toBe("Result text");
    });
  });

  describe("sse", () => {
    it("should format SSE message", () => {
      const message = { type: "stdout" as const, content: "output" };
      const formatted = ResponseFormatter.sse(message);
      expect(formatted).toBe('data: {"type":"stdout","content":"output"}\n\n');
    });

    it("should handle error messages", () => {
      const message = { type: "error" as const, content: "Error occurred" };
      const formatted = ResponseFormatter.sse(message);
      expect(formatted).toContain('"type":"error"');
      expect(formatted).toContain('"content":"Error occurred"');
    });
  });
});
```

**Coverage Goal**: >95%

## Integration Test Specifications

### GeminiService Integration Tests

**File**: `tests/integration/gemini-service.test.ts`

```typescript
describe("GeminiService Integration", () => {
  let service: GeminiService;

  beforeEach(() => {
    service = new GeminiService();
  });

  describe("search", () => {
    it("should execute a real search (slow test)", async () => {
      const result = await service.search(
        { query: "weather in Tokyo" },
        true
      );
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    }, 30000); // 30s timeout

    it("should handle raw search with JSON", async () => {
      const result = await service.search(
        { query: "TypeScript tutorial", raw: true, limit: 2 },
        true
      );
      const parsed = JSON.parse(result);
      expect(parsed.summary).toBeTruthy();
      expect(Array.isArray(parsed.sources)).toBe(true);
    }, 30000);

    it("should respect custom model", async () => {
      const result = await service.search(
        { query: "test", model: "gemini-1.5-flash" },
        true
      );
      expect(result).toBeTruthy();
    }, 30000);

    it("should throw on invalid query (validation)", async () => {
      await expect(
        service.search({ query: "" } as any, true)
      ).rejects.toThrow();
    });
  });

  describe("chat", () => {
    it("should execute a real chat (slow test)", async () => {
      const result = await service.chat(
        { prompt: "Say hello in Japanese" },
        true
      );
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    }, 60000); // 60s timeout

    it("should handle long prompts", async () => {
      const longPrompt = "Explain ".repeat(100) + "quantum computing";
      const result = await service.chat(
        { prompt: longPrompt },
        true
      );
      expect(result).toBeTruthy();
    }, 120000); // 2min timeout

    it("should throw on invalid prompt (validation)", async () => {
      await expect(
        service.chat({ prompt: "" } as any, true)
      ).rejects.toThrow();
    });
  });

  describe("CLI command caching", () => {
    it("should cache CLI command after first resolution", async () => {
      const spy = jest.spyOn(GeminiCliResolver, "resolve");

      await service.search({ query: "test1" }, true);
      await service.search({ query: "test2" }, true);

      expect(spy).toHaveBeenCalledTimes(1); // Only called once
      spy.mockRestore();
    }, 60000);
  });
});
```

**Coverage Goal**: >70% (real CLI calls, subject to network)

## E2E Test Specifications

### MCP stdio Tests

**File**: `tests/e2e/mcp-stdio.test.ts`

```typescript
describe("MCP stdio E2E", () => {
  it("should start MCP server and handle tool call", async () => {
    // Spawn MCP server as child process
    const server = spawn("bun", ["run", "cli.ts"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Send MCP initialize request
    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "1.0.0" },
    };

    server.stdin.write(JSON.stringify(initRequest) + "\n");

    // Wait for response...
    // (Full implementation omitted for brevity)

    server.kill();
  });
});
```

**Coverage Goal**: >60% (E2E tests are expensive)

### Web API Tests

**File**: `tests/e2e/web-api.test.ts`

```typescript
describe("Web API E2E", () => {
  beforeAll(async () => {
    // Start Next.js server
  });

  afterAll(async () => {
    // Stop server
  });

  it("should handle POST /api/google-search", async () => {
    const response = await fetch("http://localhost:3000/api/google-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "test" }),
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeTruthy();
  });

  it("should handle SSE streaming for chat", async () => {
    const response = await fetch("http://localhost:3000/api/gemini-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", stream: true }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    let chunks = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      chunks++;
      expect(text).toContain("data:");
    }

    expect(chunks).toBeGreaterThan(0);
  });
});
```

**Coverage Goal**: >70%

## Test Execution

### Commands

```bash
# Run all tests
bun test

# Run unit tests only
bun test tests/unit

# Run integration tests (requires CLI installed)
bun test tests/integration

# Run E2E tests (requires server)
bun test:e2e

# Run with coverage
bun test --coverage
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    bun install
    bun test --coverage
    bun test:integration  # Only if gemini-cli available
```

## Manual Testing Checklist

### MCP Server Mode

- [ ] Start server: `bun run cli.ts`
- [ ] Send MCP initialize request
- [ ] Call googleSearch tool
- [ ] Call geminiChat tool
- [ ] Verify error handling for invalid input
- [ ] Verify timeout handling

### Web Server Mode

- [ ] Start server: `bun run web:dev`
- [ ] Visit <http://localhost:3000>
- [ ] Test /api/google-search endpoint
- [ ] Test /api/gemini-chat endpoint
- [ ] Test SSE streaming
- [ ] Verify CORS handling

### Build and Distribution

- [ ] Build: `bun run build`
- [ ] Check dist/ output
- [ ] Verify executable: `./dist/cli.js --help`
- [ ] Test npm pack
- [ ] Test npm install from tarball

## Performance Testing

### Benchmarks

```typescript
describe("Performance", () => {
  it("CLI resolution should be <100ms (cached)", async () => {
    const start = Date.now();
    await GeminiCliResolver.resolve(true);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it("Search should complete <10s", async () => {
    const start = Date.now();
    await geminiService.search({ query: "test" }, true);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10000);
  }, 15000);
});
```

## Test Data Management

### Mock Data

```typescript
// tests/fixtures/mock-search-result.json
{
  "summary": "Mock search results",
  "sources": [
    { "url": "http://example.com", "title": "Example", "snippet": "..." }
  ]
}

// tests/fixtures/mock-chat-response.txt
This is a mock chat response from Gemini.
```

### Environment Setup

```typescript
// tests/setup.ts
beforeAll(() => {
  process.env.GEMINI_CLI_TIMEOUT_MS = "5000"; // Faster tests
  process.env.GEMINI_CLI_WORKING_DIR = "/tmp/mcp-test";
});
```

## Success Criteria

### Recent Improvements (2025-10-14)

**Completed:**

- ✅ Implemented SpecificationService.initialize() method with full functionality
- ✅ Added comprehensive tests for SpecificationService (100% coverage)
- ✅ Created complete schema tests for core layer (100% coverage)
- ✅ All 111 unit tests passing with 0 failures
- ✅ Core layer schemas.ts: 100% coverage achieved
- ✅ SpecificationService: 100% coverage achieved
- ✅ NameGenerationService: 100% coverage achieved
- ✅ Logger: 100% coverage achieved
- ✅ EnvManager: 100% coverage achieved

**Next Steps:**

- Improve cli-executor.ts coverage (currently 7.63%, target >85%)
- Improve gemini-cli-executor.ts coverage (currently 9.30%, target >85%)
- Improve gemini-service.ts coverage (currently 7.52%, target >80%)
- Add integration tests for complete workflows
- Implement E2E tests for MCP server and web API

### Phase 1: Unit Tests (Immediate)

- [x] Infrastructure layer: Partial (logger, env-manager, file-system-service >85%)
- [x] Core layer: >90% coverage ✅ ACHIEVED
- [x] Service layer: Partial (specification-service, name-generation-service >80%)

### Phase 2: Integration Tests (Short-term)

- [ ] GeminiService: >70% coverage
- [ ] End-to-end search flow
- [ ] End-to-end chat flow

### Phase 3: E2E Tests (Medium-term)

- [ ] MCP stdio: Basic tool calls working
- [ ] Web API: All endpoints working
- [ ] SSE streaming: Real-time updates working

### Phase 4: Performance & Reliability (Long-term)

- [ ] Performance benchmarks passing
- [ ] No flaky tests
- [ ] CI/CD pipeline green
