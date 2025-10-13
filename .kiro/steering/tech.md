# Technology Stack and Conventions

This document outlines the technology stack, architectural patterns, and development conventions for the `mcp-gemini-cli` project.

## 1. Architecture

The project follows a layered architecture to ensure a clear separation of concerns:

- **Presentation Layer**: A Next.js web application (`/app`) and a command-line interface (`cli.ts`) serve as the primary entry points for users and other clients.
- **Application/Service Layer**: Core business logic is encapsulated in services within `/lib/services`. These services orchestrate the application's functionality.
- **Infrastructure Layer**: External-facing concerns, such as interacting with the Gemini CLI, file system, or environment variables, are handled by components in `/lib/infrastructure`.
- **Core Domain Layer**: Shared data structures, types, and schemas are defined in `/lib/core`.

## 2. Technology Stack

### Backend & Core Logic
- **Language**: TypeScript
- **Runtime**: Bun / Node.js
- **Key Libraries**:
  - `@google/generative-ai`: Official Google library for interacting with the Gemini API.
  - `@modelcontextprotocol/sdk`: For implementing the Model Context Protocol server.
  - `zod`: For schema declaration and validation.

### Frontend
- **Framework**: Next.js / React
- **Styling**: Tailwind CSS

## 3. Development Environment

- **Package Manager**: `bun` is used for dependency management and script execution.
- **Linting & Formatting**: `Biome` is used for code linting and formatting to maintain a consistent style.
- **Testing**: The project uses `bun test` for running unit and integration tests. `Playwright` is configured for end-to-end testing.

## 4. Common Commands

The following commands are defined in `package.json`:

- `bun dev`: Starts the development server for the core application.
- `bun web:dev`: Starts the Next.js development server for the web UI on port 3000.
- `bun build`: Builds the production-ready application.
- `bun test`: Runs the test suite.
- `bun lint`: Lints the codebase for errors and style issues.
- `bun format`: Formats the entire codebase using Biome.

## 5. Environment & Configuration

- **Environment Variables**: All sensitive information, such as API keys for the Google Gemini service, must be managed through environment variables and should not be hard-coded.
- **Port Configuration**: The Next.js web application runs on port `3000` in development mode.
