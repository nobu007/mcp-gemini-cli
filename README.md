# MCP Gemini CLI

A simple MCP server wrapper for Google's Gemini CLI, enabling AI assistants to use Gemini's capabilities through the Model Context Protocol.

## ✨ Features

- **Google Search**: Perform Google searches using Gemini.
- **Gemini Chat**: Engage in direct conversations with Gemini.
- **Dual Mode**: Operates as both an MCP server and a standard web server with a UI and API.

## 🚀 Quick Start

Run the server with `npx` without a local installation.

```bash
claude mcp add -s project gemini-cli -- npx @nobu007/mcp-gemini-cli --allow-npx
```

**Example Prompts:**

- **Search**: `Use Google to search for the latest TypeScript 5.0 features`
- **Chat**: `Ask Gemini to explain the difference between JavaScript async/await and promises`

For more detailed instructions, including local setup, see the [**Usage Guide**](./docs/USAGE.md).

## ⚙️ Configuration

### Running the Web Server

Start the development server:

```bash
npm run web:dev
```

The server will start at `http://localhost:3000` and the MCP endpoint will be available at `http://localhost:3000/api/mcp`.

### Connecting from MCP Clients

To use this server with a compatible MCP client (like Claude Code), you need to configure the server endpoint. Add the following configuration to your client's settings file (e.g., `~/.claude.json`):

```json
{
  "mcpServers": {
    "gemini-cli-mcp": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

**Important**: Make sure to:

1. Start the server with `npm run web:dev` before connecting from your MCP client
2. Set the `GEMINI_API_KEY` environment variable or configure Gemini CLI authentication
3. The MCP client must send `Accept: application/json, text/event-stream` header

## 📚 Documentation

- [**Usage Guide**](./docs/USAGE.md)
- [**API Reference**](./docs/API.md)
- [**Architecture**](./docs/ARCHITECTURE.md)

## 🤝 Contributing

We welcome contributions! Please see our [**Contributing Guide**](./CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the MIT License.
