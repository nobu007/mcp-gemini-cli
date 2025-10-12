# Implementation Details

## Technology Stack

### Runtime & Language

- **Node.js**: ≥18.0.0 (for native fetch support)
- **TypeScript**: 5.x (strict mode recommended but not enforced)
- **Bun**: Primary runtime for development (also compatible with Node.js)

### Core Dependencies

- **@modelcontextprotocol/sdk**: 1.13.1 - MCP server implementation
- **zod**: 3.25.67 - Runtime type validation
- **Next.js**: 14.x - Web server for HTTP/SSE mode
- **googleapis**: 150.0.1 - Google API client (future OAuth integration)

### Development Dependencies

- **@biomejs/biome**: 2.0.5 - Linting and formatting
- **@playwright/test**: 1.56.0 - E2E testing
- **lefthook**: 1.11.14 - Git hooks

## Architecture Implementation

### Layer 1: Infrastructure (`lib/infrastructure/`)

#### CliExecutor (Base Class)

**File**: `lib/infrastructure/cli-executor.ts`
**Purpose**: Abstract base class for CLI process management

```typescript
abstract class CliExecutor {
  protected logPrefix: string;

  // Template method pattern
  protected async executeWithTimeout(
    cliCommand: CliCommand,
    args: string[],
    options: CliExecutionOptions
  ): Promise<string>

  protected spawnForStreaming(
    cliCommand: CliCommand,
    args: string[],
    options: CliExecutionOptions
  ): ChildProcess

  // Hook for subclasses to override
  protected isInfoMessage(message: string): boolean
}
```

**Key Features**:

- Promise-based execution with timeout
- Automatic cleanup on timeout (SIGTERM)
- Stderr filtering (informational vs. error)
- Consistent logging with log prefix
- Environment variable preparation

**Design Patterns**:

- **Template Method**: Base execution flow in parent, customization in child
- **Strategy Pattern**: isInfoMessage() allows custom filtering logic

#### GeminiCliExecutor (Specialized Executor)

**File**: `lib/infrastructure/gemini-cli-executor.ts`
**Purpose**: Gemini-specific CLI execution

```typescript
class GeminiCliExecutor extends CliExecutor {
  constructor() {
    super("gemini-cli-executor");
  }

  async execute(geminiCliCommand, args, options): Promise<string>
  stream(geminiCliCommand, args, options): ChildProcess

  // Static factory methods
  static buildSearchArgs(params): string[]
  static buildChatArgs(params): string[]
  static processRawSearchResult(result: string): string
}
```

**Key Features**:

- Inherits timeout and error handling from base
- Gemini-specific argument building
- JSON parsing for raw search results
- Markdown backtick stripping

#### EnvManager (Environment Management)

**File**: `lib/infrastructure/env-manager.ts`
**Purpose**: Centralized environment variable handling

```typescript
class EnvManager {
  static prepareEnv(customEnv): Record<string, string | undefined>
  static maskSensitiveData(env): Record<string, string | undefined>
  static fromToolArgs(args): Record<string, string>
  static resolveWorkingDirectory(requestedDir, envDefault): string
}
```

**Key Features**:

- IDE integration disabling (prevents auth conflicts)
- API key masking for logs
- Fallback chain for working directory
- Undefined handling (unset vs. set to empty)

#### GeminiCliResolver (CLI Discovery)

**File**: `lib/infrastructure/gemini-cli-resolver.ts`
**Purpose**: Locate and resolve gemini-cli command

```typescript
class GeminiCliResolver {
  static async resolve(allowNpx: boolean): Promise<GeminiCliCommand>
}
```

**Key Features**:

- Uses `which gemini` to find installed CLI
- Fallback to `npx @google/gemini-cli` if not found
- Promise-based with proper error handling
- Logs resolution path for debugging

### Layer 2: Core (`lib/core/`)

#### Schemas (Validation)

**File**: `lib/core/schemas.ts`
**Purpose**: Single source of truth for all Zod schemas

```typescript
// Base schema (DRY principle)
const BaseGeminiParametersSchema = z.object({
  sandbox: z.boolean().optional(),
  yolo: z.boolean().optional(),
  model: z.string().optional(),
  workingDirectory: z.string().optional(),
  apiKey: z.string().optional(),
});

// Extended schemas
const GoogleSearchParametersSchema = BaseGeminiParametersSchema.extend({
  query: z.string(),
  limit: z.number().optional(),
  raw: z.boolean().optional(),
});

const GeminiChatParametersSchema = BaseGeminiParametersSchema.extend({
  prompt: z.string(),
});

// Tool definitions for MCP registration
export const TOOL_DEFINITIONS = {
  googleSearch: {
    name: "googleSearch",
    description: "...",
    schema: GoogleSearchToolSchema,
  },
  geminiChat: {
    name: "geminiChat",
    description: "...",
    schema: GeminiChatToolSchema,
  },
} as const;
```

**Key Features**:

- Single source of truth (eliminates duplication)
- Type inference with `z.infer`
- Descriptive error messages
- Easy to extend (just inherit from base)

#### Types (TypeScript Interfaces)

**File**: `lib/core/types.ts`
**Purpose**: Shared type definitions

```typescript
interface ApiResponse<T> { success, data?, error?, timestamp }
type SseMessageType = "stdout" | "stderr" | "close" | "error"
interface SseMessage { type, content }
interface McpToolResponse { content: Array<{type, text}> }
interface GeminiCliCommand { command, initialArgs }
```

**Key Features**:

- Generic ApiResponse<T> for type safety
- Discriminated union for SSE messages
- Consistent MCP response structure

### Layer 3: Service (`lib/services/`)

#### GeminiService (Orchestration)

**File**: `lib/services/gemini-service.ts`
**Purpose**: High-level coordination of Gemini operations

```typescript
class GeminiService {
  private executor: GeminiCliExecutor;
  private cachedCliCommand: GeminiCliCommand | null = null;

  async search(params: GoogleSearchParameters, allowNpx): Promise<string>
  async chat(params: GeminiChatParameters, allowNpx): Promise<string>
  async chatStream(params: GeminiChatParameters, allowNpx): Promise<ChildProcess>

  private async resolveCliCommand(allowNpx): Promise<GeminiCliCommand>
}

// Singleton instance
export const geminiService = new GeminiService();
```

**Key Features**:

- Caches CLI command resolution (performance)
- Coordinates infrastructure layer
- Handles working directory resolution
- Builds CLI arguments
- Post-processes results (JSON parsing)

**Design Patterns**:

- **Singleton**: geminiService instance for convenience
- **Facade**: Simplifies complex infrastructure interactions
- **Adapter**: Adapts infrastructure to service interface

#### ResponseFormatter (Consistency)

**File**: `lib/services/response-formatter.ts`
**Purpose**: Consistent response formatting

```typescript
class ResponseFormatter {
  static success<T>(data: T): ApiResponse<T>
  static error(error: unknown): ApiResponse
  static mcpTool(result: string): McpToolResponse
  static sse(message: SseMessage): string
}
```

**Key Features**:

- Consistent timestamp format (ISO 8601)
- Type-safe success responses
- Error normalization (Error → string)
- SSE formatting (data: {JSON}\n\n)

### Layer 4: Presentation

#### MCP Server

**File**: `lib/mcp-server.ts`
**Purpose**: MCP server configuration (thin wrapper)

```typescript
export const mcpServer = new McpServer({
  name: "mcp-gemini-cli",
  version: "0.2.0",
});

mcpServer.tool(
  TOOL_DEFINITIONS.googleSearch.name,
  TOOL_DEFINITIONS.googleSearch.description,
  TOOL_DEFINITIONS.googleSearch.schema,
  async (args) => {
    const result = await executeGoogleSearch(args, allowNpx);
    return { content: [{ type: "text", text: result }] };
  }
);

// Similar for geminiChat
```

**Key Features**:

- Uses centralized TOOL_DEFINITIONS
- Thin wrapper around tool execution
- Delegates to service layer via tools.ts

#### CLI Entry Point

**File**: `cli.ts`
**Purpose**: stdio MCP server entry point

```typescript
async function startMcpServer() {
  const allowNpx = process.argv.includes("--allow-npx");

  // Pre-flight check
  await decideGeminiCliCommand(allowNpx);

  const server = new McpServer({
    name: "mcp-gemini-cli",
    version: "0.2.0",
  });

  // Register tools (same as mcp-server.ts)

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```

**Key Features**:

- Pre-flight CLI availability check
- --allow-npx flag support
- stdio transport for MCP protocol

#### Web API Handlers

**File**: `lib/gemini-api.ts`
**Purpose**: HTTP/SSE API handlers for Next.js

```typescript
export async function handleGoogleSearch(query, options) {
  const result = await geminiService.search({ query, ...options }, true);
  return ResponseFormatter.success(result);
}

export async function handleGeminiChat(prompt, options) {
  const result = await geminiService.chat({ prompt, ...options }, true);
  return ResponseFormatter.success(result);
}

export function handleGeminiChatStream(prompt, options) {
  return new ReadableStream({
    async start(controller) {
      const child = await geminiService.chatStream(parsedArgs, false);

      child.stdout.on("data", (data) => {
        controller.enqueue(formatSse({ type: "stdout", content: data }));
      });

      // Similar for stderr, close, error
    }
  });
}
```

**Key Features**:

- Delegates to geminiService
- Uses ResponseFormatter
- SSE support for streaming
- Timeout management for streams

## Design Patterns Applied

### Creational Patterns

- **Singleton**: geminiService instance
- **Factory Method**: GeminiCliExecutor.buildSearchArgs(), buildChatArgs()

### Structural Patterns

- **Facade**: GeminiService simplifies infrastructure complexity
- **Adapter**: tools.ts adapts old API to new service layer

### Behavioral Patterns

- **Template Method**: CliExecutor defines execution flow, subclasses customize
- **Strategy**: isInfoMessage() allows custom filtering strategies
- **Command**: CLI arguments encapsulated as objects

## Error Handling Strategy

### Validation Errors (Zod)

```typescript
try {
  const parsed = GoogleSearchParametersSchema.parse(args);
} catch (error) {
  // Zod provides detailed validation errors
  // Example: "query: Required"
  throw error; // Let caller handle
}
```

### Execution Errors (CLI)

```typescript
if (code !== 0) {
  reject(new Error(`CLI exited with code ${code}: ${stderr}`));
}
```

### Timeout Errors

```typescript
setTimeout(() => {
  child.kill("SIGTERM");
  reject(new Error(`CLI operation timed out after ${timeoutMs}ms`));
}, timeoutMs);
```

### Error Propagation

```
Infrastructure Layer → Service Layer → API Layer → Client
     (throw Error)   →  (catch + log) → (format)  → (JSON)
```

## Configuration Management

### Compile-Time Configuration

- TypeScript compiler options in tsconfig.json
- Biome linting rules in biome.json

### Runtime Configuration

**File**: `config.ts`

```typescript
export const TIMEOUT_CONFIG = {
  CHAT_TIMEOUT_MS: Number.parseInt(
    process.env.GEMINI_CLI_CHAT_TIMEOUT_MS || "600000",
    10
  ),
  SEARCH_TIMEOUT_MS: Number.parseInt(
    process.env.GEMINI_CLI_SEARCH_TIMEOUT_MS || "60000",
    10
  ),
  DEFAULT_TIMEOUT_MS: Number.parseInt(
    process.env.GEMINI_CLI_TIMEOUT_MS || "60000",
    10
  ),
} as const;
```

**Environment Variables**:

- `GEMINI_CLI_CHAT_TIMEOUT_MS`: Chat timeout (default: 600000)
- `GEMINI_CLI_SEARCH_TIMEOUT_MS`: Search timeout (default: 60000)
- `GEMINI_CLI_TIMEOUT_MS`: General timeout (default: 60000)
- `GEMINI_CLI_WORKING_DIR`: Default working directory (default: process.cwd())
- `GEMINI_API_KEY`: Gemini API key (optional, OAuth used if not set)

## Testing Strategy

### Unit Tests (Planned)

- `EnvManager`: Test environment preparation, masking
- `ResponseFormatter`: Test response formatting
- `GeminiCliExecutor.buildSearchArgs()`: Test argument building

### Integration Tests (Planned)

- `GeminiService.search()`: Test end-to-end search
- `GeminiService.chat()`: Test end-to-end chat
- CLI resolution: Test `which` fallback to npx

### E2E Tests (Planned)

- MCP server: Test tool calls via stdio
- Web API: Test HTTP endpoints
- SSE streaming: Test real-time chat

## Performance Optimizations

### CLI Command Caching

```typescript
private cachedCliCommand: GeminiCliCommand | null = null;

private async resolveCliCommand(allowNpx: boolean): Promise<GeminiCliCommand> {
  if (!this.cachedCliCommand) {
    this.cachedCliCommand = await GeminiCliResolver.resolve(allowNpx);
  }
  return this.cachedCliCommand;
}
```

**Impact**: Avoids `which` subprocess on every request (~50-100ms saved)

### Lazy Imports (Backward Compatibility)

```typescript
export async function streamGeminiCli(...) {
  const { GeminiCliExecutor } = await import("./infrastructure/gemini-cli-executor");
  // ...
}
```

**Impact**: Defers module loading until needed (faster startup)

### Process Reuse (Future Enhancement)

Currently: Spawn new process per request
Future: Process pool with worker threads

## Security Considerations

### API Key Masking

```typescript
static maskSensitiveData(env) {
  const masked = { ...env };
  if (masked.GEMINI_API_KEY) {
    masked.GEMINI_API_KEY = "[MASKED]";
  }
  return masked;
}
```

### Process Timeout Protection

- Prevents runaway processes
- SIGTERM on timeout (graceful)
- Cleans up resources

### Input Validation

- All inputs validated with Zod
- Type-safe at compile time and runtime
- Descriptive error messages

### No Eval or Dynamic Code Execution

- All CLI commands are static or built from validated inputs
- No eval(), Function(), or similar

## Backward Compatibility

### Deprecated API (tools.ts)

```typescript
/**
 * @deprecated Use GeminiCliExecutor directly from infrastructure layer
 * Kept for backward compatibility
 */
export async function executeGeminiCli(...) {
  const { GeminiCliExecutor } = await import("./infrastructure/gemini-cli-executor");
  const executor = new GeminiCliExecutor();
  return executor.execute(geminiCliCommand, args, { ... });
}
```

**Strategy**:

1. Mark as @deprecated in JSDoc
2. Delegate to new implementation
3. Remove in v1.0.0

### API Contract Guarantees

- MCP tool names: Stable (googleSearch, geminiChat)
- Input/output schemas: Backward compatible additions only
- Error response format: Stable
