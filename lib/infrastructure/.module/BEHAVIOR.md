# Infrastructure Layer - Expected Behavior

## CLI Execution Behavior

### Input

- **CliCommand**: Command name and initial arguments
- **args**: Additional arguments array
- **CliExecutionOptions**: Optional configuration
  - `timeoutMs`: Execution timeout in milliseconds
  - `workingDirectory`: Working directory for command
  - `env`: Custom environment variables

### Process Flow

1. **Command Preparation**
   - Merge initial args with provided args
   - Resolve working directory (custom > env > cwd)
   - Prepare environment with security considerations
   - Log execution details (with sensitive data masked)

2. **Process Execution**
   - Spawn child process with stdio pipes
   - Set up timeout mechanism
   - Stream stdout/stderr data
   - Monitor process exit

3. **Output Handling**
   - Buffer stdout for complete output
   - Filter stderr messages (info vs errors)
   - Log stream data in real-time
   - Accumulate results

4. **Completion**
   - Clear timeout on successful completion
   - Return stdout on exit code 0
   - Throw descriptive error on non-zero exit
   - Clean up process resources

### Output

**Success Case**

- Returns: Complete stdout as string
- Exit Code: 0
- Logs: Info level for execution, debug for streams

**Failure Cases**

- Non-zero exit: Throws Error with exit code and stderr
- Timeout: Throws Error with timeout duration
- Spawn failure: Throws Error with spawn details
- Signal termination: Throws Error with signal name

## Streaming Execution Behavior

### Input

Same as CLI execution

### Process Flow

1. Spawn child process
2. Close stdin immediately (no interactive input)
3. Return ChildProcess for caller to handle streams
4. Log spawn details

### Output

- Returns: ChildProcess object
- Caller manages: stdout/stderr event handlers, exit handlers

## Environment Management Behavior

### Input

- Custom environment variables (Record<string, string | undefined>)

### Process Flow

1. Copy current process.env
2. Remove IDE integration variables
3. Remove GEMINI_API_KEY (OAuth by default)
4. Apply custom overrides
5. Handle undefined values as unset

### Output

- Returns: Complete environment object ready for spawn

### Security

- Mask API keys in logs
- Remove sensitive variables before logging
- Never expose credentials in error messages

## Logger Behavior

### Input

- Module name
- Log level (debug, info, warn, error)
- Message string
- Optional metadata object

### Process Flow

1. Check if level should be logged (priority filtering)
2. Create structured log entry with timestamp
3. Format with colors (if enabled)
4. Route to appropriate console method

### Output

```
[2025-10-14T12:34:56.789Z] INFO  [module-name] Message content {"key": "value"}
```

### Configuration

- `LOG_LEVEL`: Minimum level to log (default: info)
- `LOG_TIMESTAMPS`: Enable/disable timestamps (default: true)
- `LOG_COLORS`: Enable/disable colors (default: true for TTY)

## File System Service Behavior

### Input

- Path: Absolute or relative file/directory path
- Content: String content for file writes

### Process Flow

**getExistingSpecNames**

1. Read directory entries
2. Filter for directories only
3. Extract names
4. Return array (empty on ENOENT)

**createDirectory**

1. Attempt recursive mkdir
2. Return Result<void, Error>

**writeFile**

1. Write UTF-8 content to file
2. Return Result<void, Error>

### Output

- Success: ok(value) Result
- Failure: err(Error) Result

## CLI Resolver Behavior

### Input

- allowNpx: Boolean flag (currently unused, always allows fallback)

### Process Flow

1. Execute `which gemini`
2. Monitor stdout/stderr
3. On success (exit 0): Return gemini command
4. On failure: Fallback to npx @google/gemini-cli
5. On error: Fallback to npx @google/gemini-cli
6. Log resolution process

### Output

```typescript
{
  command: "gemini" | "npx",
  initialArgs: [] | ["@google/gemini-cli"]
}
```

## Error Classification

### Informational Messages (Not Errors)

- "Loaded cached credentials"
- "Using cached credentials"
- Messages matching: `[.*] (Loaded|Using|Authenticated)`

### Actual Errors

- Non-zero exit codes with stderr
- Timeout exceptions
- Spawn failures
- File system errors
