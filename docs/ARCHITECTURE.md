# Architecture

This project runs in two distinct modes: as an MCP server for AI assistants and as a standard web server with a UI and API.

```mermaid
graph TD
    subgraph "User Interaction"
        direction LR
        A[AI Assistant / Claude]
        B[Browser / HTTP Client]
    end

    subgraph "mcp-gemini-cli Server"
        direction LR
        C{Dual Mode Server}
        D[MCP Server Logic]
        E[Next.js Web Server]
    end

    subgraph "Core Logic"
        direction LR
        F[Gemini API Handlers]
        G[Gemini CLI]
    end

    subgraph "External Services"
        direction LR
        H[Google Gemini API]
    end

    A -- MCP --> C
    B -- HTTP/S --> C

    C --"MCP Mode"--> D
    C --"Web Mode"--> E

    D --"Executes"--> F
    E --"Calls"--> F
    F --"Wraps"--> G
    G --"Communicates"--> H

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#ccf,stroke:#333,stroke-width:2px
    style H fill:#cff,stroke:#333,stroke-width:2px
```

- **MCP Server Mode**: An AI assistant (e.g., Claude) sends requests to the MCP server, which are processed by the core Gemini API handlers.
- **Web API / UI Mode**: Users can interact with a Next.js-powered web interface or send requests to the API endpoints. The Next.js server handles these requests, utilizing the same core API handlers.
- **Core Logic**: Both modes share the same underlying logic for interacting with the Gemini CLI, ensuring consistent behavior.
