# Project Structure and Organization

This document defines the file and directory structure conventions for the `mcp-gemini-cli` project.

## 1. Root Directory Organization

The top-level directory is organized as follows:

- **/app/**: Contains the Next.js frontend application, including pages, components, and API routes specific to the web UI.
- **/lib/**: The core application logic, separated into distinct layers.
- **/tests/**: Contains all automated tests, mirroring the structure of the `/lib` directory.
- **/.kiro/**: Houses the spec-driven development framework files, including specifications (`/specs`) and project-wide steering documents (`/steering`).
- **/components/**: Shared React components for the Next.js frontend.
- **/docs/**: Project documentation.
- **/pages/**: API routes for the Next.js application.
- **cli.ts**: The main entry point for the command-line interface.
- **package.json**: Project metadata and dependencies.
- **tsconfig.json**: TypeScript configuration.

## 2. Subdirectory Structures

### `/lib` Directory

- **/lib/core/**: Contains shared TypeScript types, interfaces, and Zod schemas that are used across the application.
- **/lib/infrastructure/**: Includes modules that interact with external systems. This layer contains wrappers for the Gemini CLI, file system access, and environment variable management.
- **/lib/services/**: Holds the core business logic of the application. Services in this layer orchestrate tasks by coordinating calls to infrastructure components.

### `/.kiro` Directory

- **/.kiro/specs/**: Contains all feature specifications. Each feature has its own subdirectory with `requirements.md`, `design.md`, and `tasks.md`.
- **/.kiro/steering/**: Contains project-wide steering documents (`product.md`, `tech.md`, `structure.md`) that provide context to the AI agent for development tasks.

## 3. Code Organization Patterns

The project adheres to a layered architecture to enforce separation of concerns:

1. **Presentation Layer (UI/CLI)**: The `app/` and `cli.ts` files. This layer is responsible for user interaction and should not contain business logic.
2. **Service Layer (`lib/services`)**: This layer contains the application's business logic. It is called by the presentation layer and orchestrates data flow.
3. **Infrastructure Layer (`lib/infrastructure`)**: This layer handles all communication with external systems (e.g., file system, external CLIs). It is called by the service layer.
4. **Core Domain (`lib/core`)**: This layer contains shared data structures and types used by all other layers.

## 4. File Naming Conventions

- **Files**: Use `kebab-case` for all filenames (e.g., `gemini-service.ts`).
- **Tests**: Test files should mirror the name of the file they are testing, with the suffix `.test.ts` (e.g., `gemini-service.test.ts`).

## 5. Key Architectural Principles

- **Separation of Concerns**: Each module and layer has a distinct responsibility. Business logic should remain separate from UI and infrastructure concerns.
- **Dependency Inversion**: Higher-level modules (like services) should not depend on lower-level implementation details. They should depend on abstractions (interfaces).
- **Spec-Driven Development**: All new features are to be developed following the Kiro framework, ensuring that requirements, design, and tasks are defined and approved before implementation begins.
