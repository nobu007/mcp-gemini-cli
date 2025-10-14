# Infrastructure Layer - Test Specification

## Test Coverage Requirements

- Line Coverage: > 90%
- Branch Coverage: > 85%
- Function Coverage: 100%

## Test Organization

```
tests/unit/infrastructure/
├── cli-executor.test.ts           # CliExecutor tests
├── gemini-cli-resolver.test.ts    # GeminiCliResolver tests
├── env-manager.test.ts            # EnvManager tests (TODO)
├── logger.test.ts                 # Logger tests (TODO)
└── file-system-service.test.ts    # FileSystemService tests (TODO)
```

## Test Cases

### CliExecutor Tests (Implemented ✓)

**Constructor**

- [x] Creates instance successfully
- [x] Initializes logger with module name

**executeWithTimeout**

- [x] Executes simple command successfully
- [x] Executes with multiple arguments
- [x] Merges initial args with provided args
- [x] Handles custom working directory
- [x] Handles custom environment variables
- [x] Rejects on non-zero exit code
- [x] Rejects on command not found
- [x] Timeouts long-running commands
- [x] Uses default timeout when not specified
- [x] Handles empty stdout
- [x] Captures stderr messages in error

**isInfoMessage**

- [x] Identifies "Loaded cached credentials"
- [x] Identifies "Using cached credentials"
- [x] Identifies "[timestamp] Loaded ..."
- [x] Identifies "[timestamp] Using ..."
- [x] Identifies "[timestamp] Authenticated ..."
- [x] Does not identify actual errors
- [x] Does not identify random messages
- [x] Handles empty messages
- [x] Handles whitespace-only messages
- [x] Handles messages with whitespace

**spawnForStreaming**

- [x] Spawns child process
- [x] Spawns with correct working directory
- [x] Spawns with environment variables
- [x] Closes stdin immediately
- [x] Provides access to stdout stream
- [x] Provides access to stderr stream

**Error Handling**

- [x] Handles spawn errors gracefully
- [x] Handles timeout with proper cleanup
- [x] Provides meaningful error messages

**Integration Scenarios**

- [x] Handles commands with pipes
- [x] Handles special characters
- [x] Handles multiline output

### GeminiCliResolver Tests (Implemented ✓)

**Resolve Method**

- [x] Resolves when gemini in PATH
- [x] Returns command with initialArgs array
- [x] Fallback to npx when gemini not found
- [x] Works with allowNpx=false
- [x] Works with allowNpx=true
- [x] Returns consistent structure
- [x] Completes within reasonable time
- [x] Gemini command has empty initialArgs
- [x] npx fallback has correct initialArgs
- [x] Handles multiple sequential calls
- [x] Handles parallel resolution calls

**Command Validation**

- [x] Resolved command is executable
- [x] initialArgs don't contain main command

**Error Resilience**

- [x] Never rejects the promise
- [x] Handles system errors gracefully

### GeminiCliExecutor Tests (TODO)

**Execute Method**

- [ ] Executes search command successfully
- [ ] Executes chat command successfully
- [ ] Passes through timeout option
- [ ] Passes through working directory
- [ ] Passes through environment variables

**Stream Method**

- [ ] Returns streaming child process
- [ ] Works with search commands
- [ ] Works with chat commands

**buildSearchArgs**

- [ ] Builds basic search args
- [ ] Adds limit parameter
- [ ] Adds raw flag for JSON
- [ ] Adds sandbox flag
- [ ] Adds yolo flag
- [ ] Adds model parameter
- [ ] Combines all parameters

**buildChatArgs**

- [ ] Builds basic chat args
- [ ] Adds sandbox flag
- [ ] Adds yolo flag
- [ ] Adds model parameter
- [ ] Combines all parameters

**processRawSearchResult**

- [ ] Parses valid JSON
- [ ] Pretty-prints valid JSON
- [ ] Removes markdown code fence
- [ ] Returns raw on invalid JSON
- [ ] Handles empty input
- [ ] Handles malformed JSON

### EnvManager Tests (TODO)

**prepareEnv**

- [ ] Copies process.env
- [ ] Removes IDE integration vars
- [ ] Removes GEMINI_API_KEY
- [ ] Applies custom overrides
- [ ] Handles undefined values (unset)
- [ ] Preserves other variables

**maskSensitiveData**

- [ ] Masks GEMINI_API_KEY
- [ ] Preserves other variables
- [ ] Handles missing sensitive vars
- [ ] Creates new object (doesn't mutate)

**fromToolArgs**

- [ ] Extracts API key
- [ ] Returns empty when no API key
- [ ] Ignores other properties

**resolveWorkingDirectory**

- [ ] Uses requested directory first
- [ ] Falls back to envDefault
- [ ] Falls back to process.env
- [ ] Falls back to cwd

### Logger Tests (TODO)

**Constructor**

- [ ] Creates with module name
- [ ] Uses default config
- [ ] Merges custom config
- [ ] Reads from environment

**Log Level Filtering**

- [ ] Debug level logs all
- [ ] Info level skips debug
- [ ] Warn level skips debug/info
- [ ] Error level logs only errors

**Formatting**

- [ ] Includes timestamp when enabled
- [ ] Excludes timestamp when disabled
- [ ] Applies colors when enabled
- [ ] No colors when disabled
- [ ] Includes module name
- [ ] Includes metadata when present

**Log Methods**

- [ ] debug() logs at debug level
- [ ] info() logs at info level
- [ ] warn() logs at warn level
- [ ] error() logs at error level

**Child Logger**

- [ ] Creates child with sub-module name
- [ ] Inherits parent config
- [ ] Formats with parent:child

### FileSystemService Tests (TODO)

**getExistingSpecNames**

- [ ] Returns directory names
- [ ] Filters out files
- [ ] Returns empty on ENOENT
- [ ] Throws on other errors
- [ ] Handles empty directory

**createDirectory**

- [ ] Creates directory successfully
- [ ] Returns ok() on success
- [ ] Returns err() on failure
- [ ] Creates parent directories
- [ ] Handles existing directory

**writeFile**

- [ ] Writes file successfully
- [ ] Returns ok() on success
- [ ] Returns err() on failure
- [ ] Uses UTF-8 encoding
- [ ] Overwrites existing file

## Test Utilities

### Mocks

```typescript
// Mock ChildProcess
const mockChildProcess = {
  stdout: new EventEmitter(),
  stderr: new EventEmitter(),
  stdin: { end: vi.fn() },
  kill: vi.fn(),
  on: vi.fn(),
};

// Mock Logger
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
```

### Test Helpers

```typescript
// Wait for async operations
function waitFor(ms: number): Promise<void>;

// Create test file structure
function createTestFiles(structure: FileTree): Promise<void>;

// Clean up test files
function cleanupTestFiles(paths: string[]): Promise<void>;
```

## Coverage Gaps

Current gaps requiring test implementation:

1. EnvManager - No tests exist
2. Logger - No tests exist
3. FileSystemService - No tests exist
4. GeminiCliExecutor - Only base class tested
5. Error scenarios - Need more edge cases
6. Concurrent execution - Race conditions
7. Resource cleanup - Memory leaks

## Test Execution

```bash
# Run all infrastructure tests
bun test tests/unit/infrastructure/

# Run specific test file
bun test tests/unit/infrastructure/cli-executor.test.ts

# Run with coverage
bun test --coverage tests/unit/infrastructure/

# Watch mode
bun test --watch tests/unit/infrastructure/
```

## Success Criteria

- [x] All CliExecutor tests pass
- [x] All GeminiCliResolver tests pass
- [ ] All EnvManager tests implemented and pass
- [ ] All Logger tests implemented and pass
- [ ] All FileSystemService tests implemented and pass
- [ ] All GeminiCliExecutor tests implemented and pass
- [ ] Line coverage > 90%
- [ ] No flaky tests
- [ ] All tests run in < 30 seconds
