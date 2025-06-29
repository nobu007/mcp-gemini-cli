# Quick Start Guide

This guide provides instructions for setting up and running the MCP Gemini CLI.

## Prerequisites

- [Node.js](https://nodejs.org) or [Bun](https://bun.sh)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) (optional if using the `--allow-npx` flag)

## 🚀 Installation & Usage

There are two main ways to use the server:

### 1. With `npx` (Recommended)

This method requires no local installation.

**For MCP Clients (e.g., Claude Code):**

```bash
claude mcp add -s project gemini-cli -- npx @nobu007/mcp-gemini-cli --allow-npx
```

**Example Prompts:**

- **Search**: `Use Google to search for the latest TypeScript 5.0 features`
- **Chat**: `Ask Gemini to explain the difference between JavaScript async/await and promises`

### 2. Local Development

**1. Clone the repository:**

```bash
git clone https://github.com/nobu007/mcp-gemini-cli.git
cd mcp-gemini-cli
```

**2. Install dependencies:**

```bash
npm install
```

**3. Run the server:**

- **MCP Server Mode**: `npm run dev`
- **Web UI Mode**: `npm run web:dev` (Access at `http://localhost:3000`)

## ⚙️ Configuration

You can configure timeout values and the working directory using environment variables.

- `GEMINI_CLI_TIMEOUT_MS`: Default timeout for all operations (default: 60s).
- `GEMINI_CLI_SEARCH_TIMEOUT_MS`: Timeout for Google Search (default: 30s).
- `GEMINI_CLI_WORKING_DIR`: Default working directory for `gemini-cli`.

**Example:**

```bash
export GEMINI_CLI_TIMEOUT_MS=120000
```
