# Expected Behavior

## Module Purpose

MCP Gemini CLI provides a Model Context Protocol (MCP) server that wraps Google's Gemini CLI, enabling AI assistants like Claude to search the web and chat with Gemini.

## Input/Output Specifications

### googleSearch Input

1. **Invalid Query**: Empty or missing query string
   - Response: Zod validation error
2. **CLI Not Found**: gemini-cli not installed
   - Response: "Error: gemini-cli not found in PATH"
3. **Timeout**: Search takes too long (>60s)
   - Response: "CLI operation timed out after 60000ms"
4. **API Rate Limit**: Gemini API rate limit exceeded
   - Response: Error from Gemini CLI with rate limit message

### Tool: geminiChat

### geminiChat Input

```typescript
{
  prompt: string;               // Required: The chat prompt
  sandbox?: boolean;            // Optional: Run in sandbox mode
  yolo?: boolean;               // Optional: Auto-accept all actions
  model?: string;               // Optional: Gemini model to use
  workingDirectory?: string;    // Optional: Working directory for execution
  apiKey?: string;              // Optional: Gemini API key
}
```

### googleSearch Output

```typescript
// Plain text response from Gemini
"The capital of France is Paris. It has been the capital since..."
```

### googleSearch Error Cases

1. **Invalid Prompt**: Empty or missing prompt
   - Response: Zod validation error
2. **CLI Not Found**: gemini-cli not installed
   - Response: "Error: gemini-cli not found in PATH"
3. **Timeout**: Chat takes too long (>600s / 10 minutes)
   - Response: "CLI operation timed out after 600000ms"
4. **Authentication Failed**: No valid credentials
   - Response: Error from Gemini CLI about authentication

## Processing Flow

### MCP Server Mode (stdio)

```text
1. Client sends MCP tool request
   ↓
2. MCP server receives request
   ↓
3. Validate request with Zod schemas
   ↓
4. GeminiService resolves CLI command (cached)
   ↓
5. Build CLI arguments from parameters
   ↓
6. EnvManager prepares environment
   ↓
7. GeminiCliExecutor spawns child process
   ↓
8. Collect stdout/stderr with timeout
   ↓
9. Filter informational stderr messages
   ↓
10. Return formatted response to client
```

### Web Server Mode (HTTP/SSE)

```text
1. HTTP request to /api/gemini-chat or /api/google-search
   ↓
2. Next.js API route receives request
   ↓
3. Parse request body
   ↓
4. Call geminiService.search() or geminiService.chat()
   ↓
5. [Same as MCP mode steps 4-9]
   ↓
6. ResponseFormatter formats result
   ↓
7. Return JSON response

For streaming (/api/gemini-chat with SSE):
8. Spawn child process for streaming
   ↓
9. Pipe stdout/stderr as SSE events
   ↓
10. Client receives real-time updates
```

## State Management

### CLI Command Resolution

- **Initial State**: No cached command
- **Resolution**: Check `which gemini`, fallback to `npx @google/gemini-cli`
- **Caching**: Command cached in GeminiService instance
- **Invalidation**: Never (assumes CLI doesn't change during process lifetime)

### Environment Variables

- **Preparation**: Merge process.env with custom overrides
- **API Key Handling**:
  - If apiKey parameter provided: Use it (highest priority)
  - Else: Use OAuth authentication (default)
- **IDE Integration**: Always disabled (to avoid authentication conflicts)
- **Working Directory**: Resolve with fallback chain:
  1. Request parameter
  2. GEMINI_CLI_WORKING_DIR env var
  3. process.cwd()

### Process Lifecycle

```text
Spawn → Setup timeout → Collect output → Close/Error → Cleanup
```

- **Timeout Handling**: Kill process with SIGTERM on timeout
- **Error Propagation**: Stderr collected and included in error message
- **Exit Codes**: Non-zero exit codes cause rejection with stderr

## Expected Behavior Examples

### Example 1: Simple Search

```typescript
// Input
{ query: "latest AI news" }

// Expected Flow
1. Resolve gemini CLI command (cached)
2. Build args: ["-p", "Search for: latest AI news"]
3. Execute with 60s timeout
4. Return: "Here are the latest AI developments..."

// Expected Logs
[gemini-cli-executor] Executing: gemini -p Search for: latest AI news
[gemini-cli-executor] Working directory: /home/user/project
[gemini-cli-executor] STDOUT: Here are the latest AI developments...
[gemini-cli-executor] Command exited with code 0
```

### Example 2: Raw Search with Limit

```typescript
// Input
{ query: "TypeScript tutorials", limit: 3, raw: true }

// Expected Flow
1. Build args with custom prompt for JSON output
2. Execute and get JSON response
3. Parse and pretty-print JSON
4. Return formatted JSON

// Expected Output
{
  "summary": "Top TypeScript tutorials include...",
  "sources": [
    { "url": "...", "title": "...", "snippet": "..." },
    { "url": "...", "title": "...", "snippet": "..." },
    { "url": "...", "title": "...", "snippet": "..." }
  ]
}
```

### Example 3: Chat with Model Selection

```typescript
// Input
{ prompt: "Explain quantum computing", model: "gemini-1.5-pro" }

// Expected Flow
1. Build args: ["-p", "Explain quantum computing", "-m", "gemini-1.5-pro"]
2. Execute with 600s timeout (chat timeout)
3. Return Gemini's response

// Expected Output
"Quantum computing is a type of computing that harnesses quantum mechanics..."
```

### Example 4: Error - Timeout

```typescript
// Input
{ query: "very complex search" }

// If search takes >60s
1. Process spawned
2. 60 seconds elapse
3. Timeout handler kills process
4. Error thrown: "CLI operation timed out after 60000ms"

// Expected Logs
[gemini-cli-executor] Executing: gemini -p ...
[gemini-cli-executor] Command timed out after 60000ms: gemini ...
```

### Example 5: Streaming Chat

```typescript
// Input (HTTP SSE)
POST /api/gemini-chat
{ prompt: "Write a long story" }

// Expected SSE Events
data: {"type":"stdout","content":"Once upon a time"}
data: {"type":"stdout","content":" there was a"}
data: {"type":"stdout","content":" brave knight"}
data: {"type":"close","content":"Process exited with code 0"}

// Client receives updates in real-time
```

## Logging Behavior

### Normal Operation

- Log CLI execution command and arguments
- Log working directory
- Log environment variables (with API keys masked)
- Log stdout chunks
- Log exit code

### Error Conditions

- Log stderr (unless informational message)
- Log timeout events
- Log process spawn errors
- Log validation errors

### Informational Stderr Filtering

These messages are NOT logged as errors:

- "Loaded cached credentials"
- "Using cached credentials"
- Any message matching: `[.*] (Loaded|Using|Authenticated)`

## Performance Characteristics

### Timeouts

- **Search**: 60 seconds (configurable via GEMINI_CLI_SEARCH_TIMEOUT_MS)
- **Chat**: 600 seconds (10 minutes, configurable via GEMINI_CLI_CHAT_TIMEOUT_MS)
- **General**: 60 seconds (configurable via GEMINI_CLI_TIMEOUT_MS)

### Response Times (typical)

- **CLI Resolution**: <100ms (cached after first call)
- **Search**: 2-10 seconds
- **Chat**: 3-30 seconds (depends on prompt complexity)
- **API Overhead**: <10ms (service layer + formatting)

### Memory Usage

- Base process: ~50MB
- Per CLI spawn: +30-50MB (subprocess)
- Streaming: +5-10MB (buffering)

## Reliability Guarantees

### What is guaranteed

- ✅ Validation of all inputs with Zod schemas
- ✅ Timeout protection for all CLI executions
- ✅ Consistent error response format
- ✅ Logging of all operations
- ✅ API key masking in logs
- ✅ Graceful handling of CLI not found

### What is not guaranteed

- ❌ Gemini API rate limits (depends on Google's policies)
- ❌ Gemini response quality or accuracy
- ❌ CLI backward compatibility (depends on @google/gemini-cli)
- ❌ Concurrent request limits (depends on system resources)
