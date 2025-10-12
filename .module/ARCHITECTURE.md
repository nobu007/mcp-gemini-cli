# Architecture Design

## Target Layer Structure

### 1. Infrastructure Layer (`lib/infrastructure/`)

**Responsibility**: External system interactions, process management

- `cli-executor.ts` - Base CLI execution with timeout and error handling
- `env-manager.ts` - Environment variable preparation and validation
- `process-manager.ts` - Child process spawning with consistent configuration

### 2. Core/Domain Layer (`lib/core/`)

**Responsibility**: Business logic, tool definitions

- `schemas.ts` - Centralized Zod schema definitions (DRY principle)
- `gemini-tools.ts` - Pure business logic for Gemini operations
- `types.ts` - Shared TypeScript interfaces and types

### 3. Service Layer (`lib/services/`)

**Responsibility**: Orchestration, high-level operations

- `gemini-service.ts` - Service layer coordinating infrastructure and core
- `response-formatter.ts` - Consistent response formatting

### 4. API/Presentation Layer

**Responsibility**: External interfaces (MCP server, HTTP endpoints)

- `lib/mcp-server.ts` - MCP server configuration (thin wrapper)
- `app/api/*` - Next.js API routes (thin controllers)
- `cli.ts` - CLI entry point (thin wrapper)

## Dependency Flow

```
Presentation Layer (API/CLI)
    ↓ depends on
Service Layer (gemini-service)
    ↓ depends on
Core Layer (schemas, business logic)
    ↓ depends on
Infrastructure Layer (cli-executor, env-manager)
```

## Current vs Target Architecture

### Current Issues

```
cli.ts
  ├─ duplicates schemas from tools.ts
  ├─ duplicates server setup from mcp-server.ts
  └─ creates its own McpServer instance

tools.ts (433 lines)
  ├─ CLI execution (infrastructure)
  ├─ Schema definitions (core)
  ├─ Business logic (service)
  └─ Environment handling (infrastructure)

gemini-api.ts
  └─ directly calls tools (no service layer)
```

### Target Structure

```
lib/
  ├─ infrastructure/
  │   ├─ cli-executor.ts (base class + common patterns)
  │   ├─ env-manager.ts (centralized env handling)
  │   └─ process-manager.ts (spawn wrapper)
  ├─ core/
  │   ├─ schemas.ts (all Zod schemas)
  │   ├─ types.ts (TypeScript interfaces)
  │   └─ constants.ts (shared constants)
  ├─ services/
  │   ├─ gemini-service.ts (orchestration)
  │   └─ response-formatter.ts (consistent responses)
  └─ [existing files refactored to use layers]
```

## Module Responsibilities Matrix

| Layer | Allowed Dependencies | Forbidden Actions |
|-------|---------------------|-------------------|
| Infrastructure | Node.js APIs, external CLIs | Business logic, API responses |
| Core | TypeScript, Zod | I/O operations, process spawning |
| Service | Core, Infrastructure | Direct API responses, process management |
| Presentation | Service | Direct infrastructure calls, business logic |

## Migration Strategy

1. **Phase 1**: Extract infrastructure (CLI execution, env handling)
2. **Phase 2**: Centralize core (schemas, types)
3. **Phase 3**: Create service layer
4. **Phase 4**: Refactor presentation to use services
5. **Phase 5**: Remove duplicated code
