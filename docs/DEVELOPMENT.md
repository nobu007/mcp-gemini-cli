# Development Guide

This guide covers the development setup, coding standards, and build process for the project.

## Development Setup

1. **Fork & Clone**: Fork the repository and clone it.
2. **Install Dependencies**: Run `npm install`.

## Running the Application

- **MCP Server Mode**: `npm run dev`
- **Web Development Mode**: `npm run web:dev`

## Scripts

- `npm test`: Run tests.
- `npm run build`: Create a development build.
- `npm run build:prod`: Create a minified production build.
- `npm run lint`: Lint the code.
- `npm run format`: Format the code.

## Coding Style

- **Language**: TypeScript
- **Formatting/Linting**: We use [Biome](https://biomejs.dev/). Please run `npm run format` and `npm run lint` before committing.

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

**Example:** `feat(api): add support for streaming responses`
