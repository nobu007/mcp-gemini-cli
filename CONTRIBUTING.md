# Contributing to MCP Gemini CLI

First off, thank you for considering contributing to MCP Gemini CLI! Your help is greatly appreciated.

This document provides guidelines for contributing to the project. Please read it carefully to ensure a smooth and effective contribution process.

## How Can I Contribute?

- **Reporting Bugs**: If you find a bug, please open an issue with a clear description and steps to reproduce it.
- **Suggesting Enhancements**: If you have an idea for a new feature or an improvement, open an issue to discuss it.
- **Pull Requests**: If you want to contribute code, please submit a pull request.

## Development Setup

1. **Fork & Clone**: Fork the repository and clone it to your local machine.

    ```bash
    git clone https://github.com/YOUR_USERNAME/mcp-gemini-cli.git
    cd mcp-gemini-cli
    ```

2. **Install Dependencies**: We use `npm` for package management.

    ```bash
    npm install
    ```

3. **Run in Development Mode**:
    - **MCP Server**: `npm run dev`
    - **Web App**: `npm run web:dev`

## Coding Style

- **Language**: TypeScript
- **Code Formatting**: We use [Biome](https://biomejs.dev/) for formatting and linting. Please format your code before committing.

  ```bash
  npm run format
  npm run lint
  ```

- **Naming Conventions**: Follow standard TypeScript/JavaScript naming conventions (e.g., `camelCase` for variables and functions, `PascalCase` for classes and types).

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This makes the commit history easier to read and allows for automated changelog generation.

Each commit message consists of a **header**, a **body**, and a **footer**.

```xml
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

- **Type**: Must be one of the following:
  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation only changes
  - `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
  - `refactor`: A code change that neither fixes a bug nor adds a feature
  - `perf`: A code change that improves performance
  - `test`: Adding missing tests or correcting existing tests
  - `chore`: Changes to the build process or auxiliary tools and libraries
- **Scope** (optional): The part of the codebase affected by the change (e.g., `api`, `web`, `mcp`).
- **Subject**: A concise description of the change.

**Example:**

```txt
feat(api): add support for streaming responses
```

## Pull Request Process

1. Ensure your code adheres to the coding style.
2. Make sure all tests pass (`npm test`).
3. Update the `README.md` and any other relevant documentation if your changes require it.
4. Create a pull request from your fork to the `main` branch of the original repository.
5. Provide a clear description of your changes in the pull request.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

Thank you for your contribution!
