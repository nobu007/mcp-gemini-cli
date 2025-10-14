# Infrastructure Layer - Implementation Specification

## Class Hierarchy

```typescript
// Base abstraction
abstract class CliExecutor {
  protected logger: Logger
  protected abstract executeWithTimeout()
  protected abstract spawnForStreaming()
  protected abstract isInfoMessage()
}

// Concrete implementation
class GeminiCliExecutor extends CliExecutor {
  public execute()
  public stream()
  static buildSearchArgs()
  static buildChatArgs()
  static processRawSearchResult()
}

// Utility classes
class GeminiCliResolver {
  static async resolve()
}

class EnvManager {
  static prepareEnv()
  static maskSensitiveData()
  static fromToolArgs()
  static resolveWorkingDirectory()
}

class Logger {
  debug()
  info()
  warn()
  error()
  child()
}

// Factory
function createLogger(moduleName: string): Logger

// Repository pattern
interface FileSystemService {
  getExistingSpecNames()
  createDirectory()
  writeFile()
}

class FileSystemServiceImpl implements FileSystemService
```

## Core Interfaces

```typescript
// CLI execution
interface CliCommand {
  command: string;
  initialArgs: string[];
}

interface CliExecutionOptions {
  timeoutMs?: number;
  workingDirectory?: string;
  env?: Record<string, string | undefined>;
}

interface CliExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// Logging
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface LoggerConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableColors: boolean;
}

// Environment
interface GeminiEnvConfig {
  apiKey?: string;
  workingDirectory?: string;
  [key: string]: string | undefined;
}

// File System
interface FileSystemService {
  getExistingSpecNames(path: string): Promise<string[]>;
  createDirectory(path: string): Promise<Result<void, Error>>;
  writeFile(path: string, content: string): Promise<Result<void, Error>>;
}
```

## Implementation Details

### CliExecutor (Abstract Base)

```typescript
export abstract class CliExecutor {
  protected logger: Logger;

  constructor(moduleName: string) {
    this.logger = createLogger(moduleName);
  }

  protected async executeWithTimeout(
    cliCommand: CliCommand,
    args: string[],
    options: CliExecutionOptions = {},
  ): Promise<string> {
    // 1. Prepare command and environment
    // 2. Set up timeout mechanism
    // 3. Spawn child process
    // 4. Handle stdout/stderr streams
    // 5. Return result or throw error
  }

  protected spawnForStreaming(
    cliCommand: CliCommand,
    args: string[],
    options: CliExecutionOptions = {},
  ): ChildProcess {
    // 1. Prepare command and environment
    // 2. Spawn child process
    // 3. Close stdin
    // 4. Return ChildProcess for caller
  }

  protected isInfoMessage(message: string): boolean {
    // Pattern matching for informational messages
  }
}
```

### GeminiCliExecutor (Concrete)

```typescript
export class GeminiCliExecutor extends CliExecutor {
  constructor() {
    super("gemini-cli-executor");
  }

  async execute(
    geminiCliCommand: GeminiCliCommand,
    args: string[],
    options: CliExecutionOptions = {},
  ): Promise<string> {
    return this.executeWithTimeout(geminiCliCommand, args, options);
  }

  stream(
    geminiCliCommand: GeminiCliCommand,
    args: string[],
    options: CliExecutionOptions = {},
  ): ChildProcess {
    return this.spawnForStreaming(geminiCliCommand, args, options);
  }

  static buildSearchArgs(params: SearchParams): string[] {
    // Build CLI arguments for Google Search
  }

  static buildChatArgs(params: ChatParams): string[] {
    // Build CLI arguments for Chat
  }

  static processRawSearchResult(result: string): string {
    // Parse and format JSON results
  }
}
```

### GeminiCliResolver

```typescript
export class GeminiCliResolver {
  static async resolve(_allowNpx: boolean): Promise<GeminiCliCommand> {
    return new Promise((resolve, _reject) => {
      // 1. Check if 'gemini' exists with 'which'
      // 2. Return gemini command if found
      // 3. Fallback to npx if not found or error
      // 4. Always resolve (never reject)
    });
  }
}
```

### EnvManager

```typescript
export class EnvManager {
  static prepareEnv(
    customEnv?: Record<string, string | undefined>,
  ): Record<string, string | undefined> {
    // 1. Copy process.env
    // 2. Remove IDE integration vars
    // 3. Remove GEMINI_API_KEY
    // 4. Apply custom overrides
  }

  static maskSensitiveData(
    env: Record<string, string | undefined>,
  ): Record<string, string | undefined> {
    // Mask GEMINI_API_KEY for logging
  }

  static fromToolArgs(args: GeminiEnvConfig): Record<string, string> {
    // Build env from parsed arguments
  }

  static resolveWorkingDirectory(
    requestedDir?: string,
    envDefault?: string,
  ): string {
    // Fallback chain: requested > envDefault > process.env > cwd
  }
}
```

### Logger

```typescript
export class Logger {
  private config: LoggerConfig;
  private moduleName: string;

  constructor(moduleName: string, config?: Partial<LoggerConfig>);

  private shouldLog(level: LogLevel): boolean;
  private formatLogEntry(entry: LogEntry): string;
  private log(level: LogLevel, message: string, metadata?: object): void;

  public debug(message: string, metadata?: object): void;
  public info(message: string, metadata?: object): void;
  public warn(message: string, metadata?: object): void;
  public error(message: string, metadata?: object): void;
  public child(subModuleName: string): Logger;
}

export function createLogger(
  moduleName: string,
  config?: Partial<LoggerConfig>,
): Logger;
```

### FileSystemService

```typescript
export class FileSystemServiceImpl implements FileSystemService {
  async getExistingSpecNames(path: string): Promise<string[]> {
    // Read directory, filter directories, return names
  }

  async createDirectory(path: string): Promise<Result<void, Error>> {
    // Recursive mkdir with Result wrapping
  }

  async writeFile(path: string, content: string): Promise<Result<void, Error>> {
    // UTF-8 file write with Result wrapping
  }
}
```

## Dependencies

### External

- `node:child_process`: Process spawning
- `node:fs/promises`: Async file operations
- `neverthrow`: Result type for error handling

### Internal

- `config`: Timeout configuration
- `core/types`: Type definitions (GeminiCliCommand, etc.)

## Error Handling Strategy

1. **Synchronous Errors**: Throw immediately
2. **Async Errors**: Reject Promise with Error
3. **File System**: Return Result<T, Error>
4. **CLI Execution**: Throw Error with context
5. **Timeout**: Throw Error with duration

## Testing Strategy

1. **Unit Tests**: Test each method in isolation
2. **Integration Tests**: Test with real CLI commands
3. **Mock Strategy**: Mock child_process for controlled tests
4. **Edge Cases**: Timeout, errors, empty output, signals
5. **Coverage Target**: > 90% line coverage
