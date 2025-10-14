# Usage Guide

This guide provides complete instructions for setting up, using, and developing the MCP Gemini CLI.

## 🚀 Quick Start (Recommended)

The easiest way to use the server is with `npx`, which requires no local installation.

**For MCP Clients (e.g., Claude):**

```bash
claude mcp add -s project gemini-cli -- npx @nobu007/mcp-gemini-cli --allow-npx
```

**Example Prompts:**

- **Search**: `Use Google to search for the latest TypeScript 5.0 features`
- **Chat**: `Ask Gemini to explain the difference between JavaScript async/await and promises`

## 🛠️ Local Development Setup

For those who want to contribute or run the server locally.

### Prerequisites

- [Node.js](https://nodejs.org) or [Bun](https://bun.sh)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) (optional if using the `--allow-npx` flag)

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/nobu007/mcp-gemini-cli.git
    cd mcp-gemini-cli
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

### Running the Application

- **MCP Server Mode**: `npm run dev`
- **Web Development Mode**: `npm run web:dev` (Access at `http://localhost:3000`)

### Development Scripts

- `npm test`: Run tests.
- `npm run build`: Create a development build.
- `npm run build:prod`: Create a minified production build.
- `npm run lint`: Lint the code.
- `npm run format`: Format the code.

## ⚙️ Configuration

Configure timeouts and the working directory via environment variables.

- `GEMINI_CLI_TIMEOUT_MS`: Default timeout for all operations (default: 60s).
- `GEMINI_CLI_SEARCH_TIMEOUT_MS`: Timeout for Google Search (default: 30s).
- `GEMINI_CLI_WORKING_DIR`: Default working directory for `gemini-cli`.

**Example:**

```bash
export GEMINI_CLI_TIMEOUT_MS=120000
```

## ❓ Troubleshooting & FAQ

### Q: I'm getting a timeout error

**A**: The default timeout is 60 seconds. You can increase it by setting the `GEMINI_CLI_TIMEOUT_MS` environment variable. For search-specific timeouts, use `GEMINI_CLI_SEARCH_TIMEOUT_MS`.

```bash
export GEMINI_CLI_TIMEOUT_MS=120000 # 120 seconds
```

### Q: How do I use a specific Gemini model?

**A**: Specify the model using the `model` parameter in your API calls or tool usage.

```typescript
geminiChat({
  prompt: "Write a haiku about programming",
  model: "gemini-2.5-pro" // or "gemini-2.5-flash" as fallback
});
```
