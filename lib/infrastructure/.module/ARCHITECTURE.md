# Infrastructure Layer - Architecture

## Layer Structure

The infrastructure layer follows a clean architecture pattern with clear separation of concerns:

```
lib/infrastructure/
├── cli-executor.ts          # Base CLI execution abstraction
├── gemini-cli-executor.ts   # Gemini-specific CLI executor
├── gemini-cli-resolver.ts   # CLI command resolution
├── env-manager.ts           # Environment variable management
├── logger.ts                # Logging infrastructure
└── file-system-service.ts   # File system operations
```

## Component Architecture

### 1. CLI Execution Layer

**CliExecutor (Abstract Base Class)**

- Responsibilities:
  - Execute CLI commands with timeout
  - Spawn processes for streaming
  - Handle stdout/stderr streams
  - Classify informational vs error messages
- Dependencies: Logger, EnvManager
- Design Pattern: Template Method

**GeminiCliExecutor (Concrete Implementation)**

- Responsibilities:
  - Gemini-specific CLI execution
  - Build search and chat argument arrays
  - Post-process raw results
- Extends: CliExecutor
- Design Pattern: Strategy (for argument building)

**GeminiCliResolver**

- Responsibilities:
  - Resolve gemini command availability
  - Fallback to npx when needed
  - Cache resolution results (future enhancement)
- Design Pattern: Factory

### 2. Cross-Cutting Concerns

**Logger**

- Responsibilities:
  - Structured logging with levels
  - Module-specific loggers
  - Color-coded output
  - Configurable via environment
- Design Pattern: Factory (createLogger)

**EnvManager**

- Responsibilities:
  - Prepare environment variables
  - Mask sensitive data
  - Apply custom overrides
  - Resolve working directories
- Design Pattern: Utility/Helper

**FileSystemService**

- Responsibilities:
  - Type-safe file operations
  - Result-based error handling
  - Directory and file management
- Design Pattern: Repository

## Design Principles

1. **Dependency Inversion**: High-level modules depend on abstractions
2. **Single Responsibility**: Each class has one clear purpose
3. **Open/Closed**: Open for extension via inheritance, closed for modification
4. **Liskov Substitution**: Derived classes can replace base classes
5. **Interface Segregation**: Small, focused interfaces (Result types)

## Data Flow

```
User Request
    ↓
Service Layer (gemini-service.ts)
    ↓
GeminiCliExecutor
    ↓
CliExecutor (base)
    ↓
EnvManager + Logger
    ↓
Node child_process
    ↓
External CLI (gemini-cli)
```

## Error Handling Strategy

1. **CLI Execution Errors**: Throw descriptive Error objects
2. **Timeout Errors**: Specific timeout error messages
3. **Process Spawn Errors**: Caught and logged with context
4. **Environment Errors**: Fail-fast with clear guidance
5. **File System Errors**: Result types for safe error propagation

## Future Enhancements

- [ ] Retry mechanism with exponential backoff
- [ ] Circuit breaker for external CLI calls
- [ ] Command resolution caching
- [ ] Metrics and telemetry collection
- [ ] Health check endpoints
- [ ] Graceful degradation patterns
