# Module Structure

## Directory Layout

```
mcp-gemini-cli/
├── lib/                        # Core library code
│   ├── infrastructure/         # External system interactions
│   │   ├── cli-executor.ts    # Base CLI execution framework
│   │   ├── env-manager.ts     # Environment variable management
│   │   ├── gemini-cli-resolver.ts    # CLI command resolution
│   │   └── gemini-cli-executor.ts    # Gemini-specific CLI operations
│   ├── core/                   # Business logic and schemas
│   │   ├── schemas.ts         # Centralized Zod schemas
│   │   └── types.ts           # TypeScript type definitions
│   ├── services/               # High-level orchestration
│   │   ├── gemini-service.ts  # Main Gemini operations service
│   │   └── response-formatter.ts     # Response formatting utilities
│   ├── tools.ts               # Backward compatibility layer
│   ├── gemini-api.ts          # API handlers for Next.js
│   └── mcp-server.ts          # MCP server configuration
├── cli.ts                      # CLI entry point
├── index.ts                    # Main entry point
├── config.ts                   # Configuration constants
└── .module/                    # Module documentation
    ├── MODULE_GOALS.md        # Purpose and KPIs
    ├── ARCHITECTURE.md        # Design and layer structure
    ├── MODULE_STRUCTURE.md    # This file
    ├── BEHAVIOR.md            # Expected behavior
    ├── IMPLEMENTATION.md      # Implementation details
    ├── TEST.md                # Test specifications
    ├── TASKS.md               # Progress tracking
    └── FEEDBACK.md            # Lessons learned
```

## File Naming Conventions

### Infrastructure Layer

- **Pattern**: `{domain}-{type}.ts`
- **Examples**: `gemini-cli-executor.ts`, `env-manager.ts`
- **Purpose**: Clearly indicates the domain and implementation type

### Core Layer

- **Pattern**: `{purpose}.ts`
- **Examples**: `schemas.ts`, `types.ts`
- **Purpose**: Simple, descriptive names for foundational components

### Service Layer

- **Pattern**: `{domain}-service.ts` or `{purpose}-formatter.ts`
- **Examples**: `gemini-service.ts`, `response-formatter.ts`
- **Purpose**: Indicates orchestration and coordination role

### API Layer

- **Pattern**: `{purpose}-api.ts` or `{purpose}-server.ts`
- **Examples**: `gemini-api.ts`, `mcp-server.ts`
- **Purpose**: Clearly indicates external interface

## Module Boundaries

### Infrastructure Layer (`lib/infrastructure/`)

- **Can import**: Node.js standard library, external process management
- **Cannot import**: Services, API handlers
- **Exports**: Base classes, executors, managers

### Core Layer (`lib/core/`)

- **Can import**: Zod, TypeScript
- **Cannot import**: Infrastructure, Services, APIs
- **Exports**: Schemas, types, interfaces

### Service Layer (`lib/services/`)

- **Can import**: Core, Infrastructure
- **Cannot import**: API handlers, presentation layer
- **Exports**: Service classes, formatters

### API Layer (`lib/*.ts` files)

- **Can import**: Services, Core
- **Cannot import**: Infrastructure directly
- **Exports**: API handlers, MCP server configuration

## Import Rules

```typescript
// ✅ ALLOWED
// Infrastructure can import from Node.js and external libraries
import { spawn } from "node:child_process";

// Core can import from Zod and TypeScript
import { z } from "zod";

// Services can import from Core and Infrastructure
import { GeminiCliExecutor } from "../infrastructure/gemini-cli-executor";
import { GoogleSearchParameters } from "../core/schemas";

// API can import from Services and Core
import { geminiService } from "./services/gemini-service";
import { TOOL_DEFINITIONS } from "./core/schemas";

// ❌ FORBIDDEN
// API cannot import Infrastructure directly
import { CliExecutor } from "./infrastructure/cli-executor"; // BAD

// Core cannot import Infrastructure
import { EnvManager } from "../infrastructure/env-manager"; // BAD in core/

// Infrastructure cannot import Services
import { geminiService } from "../services/gemini-service"; // BAD in infrastructure/
```

## File Size Guidelines

- **Infrastructure**: 100-250 lines per file
- **Core**: 50-150 lines per file (schemas and types are concise)
- **Services**: 100-200 lines per file
- **API**: 50-100 lines per file (thin wrappers)

## Current File Sizes

```
217 lib/infrastructure/cli-executor.ts       ✅ Within guidelines
122 lib/infrastructure/gemini-cli-executor.ts ✅ Within guidelines
110 lib/infrastructure/env-manager.ts         ✅ Within guidelines
 66 lib/infrastructure/gemini-cli-resolver.ts ✅ Within guidelines

 90 lib/core/schemas.ts                       ✅ Within guidelines
 42 lib/core/types.ts                         ✅ Within guidelines

146 lib/services/gemini-service.ts            ✅ Within guidelines
 55 lib/services/response-formatter.ts        ✅ Within guidelines

 91 lib/tools.ts                              ✅ Within guidelines
179 lib/gemini-api.ts                         ⚠️  Could be split further
 49 lib/mcp-server.ts                         ✅ Within guidelines
```

## Dependency Graph

```
┌─────────────────────────────────────────┐
│  Presentation Layer (CLI/API)           │
│  - cli.ts, index.ts                     │
│  - lib/mcp-server.ts, lib/gemini-api.ts │
└──────────────┬──────────────────────────┘
               │ depends on
               ▼
┌─────────────────────────────────────────┐
│  Service Layer                          │
│  - lib/services/gemini-service.ts       │
│  - lib/services/response-formatter.ts   │
└──────────────┬──────────────────────────┘
               │ depends on
               ▼
┌─────────────────────────────────────────┐
│  Core Layer                             │
│  - lib/core/schemas.ts                  │
│  - lib/core/types.ts                    │
└──────────────┬──────────────────────────┘
               │ depends on
               ▼
┌─────────────────────────────────────────┐
│  Infrastructure Layer                   │
│  - lib/infrastructure/cli-executor.ts   │
│  - lib/infrastructure/env-manager.ts    │
│  - lib/infrastructure/gemini-cli-*      │
└─────────────────────────────────────────┘
```

## Special Files

### tools.ts (Backward Compatibility Layer)

- **Purpose**: Maintains API compatibility with older code
- **Status**: Deprecated, will be removed in v1.0.0
- **Strategy**: Thin wrapper delegating to service layer
- **Migration Path**: Import from `services/gemini-service.ts` directly

### config.ts (Configuration)

- **Purpose**: Centralized configuration constants
- **Contents**: Timeout values, environment variables
- **Usage**: Imported by infrastructure and services
