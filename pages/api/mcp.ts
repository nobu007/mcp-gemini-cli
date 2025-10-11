import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "node:crypto";
import { mcpServer } from "@/lib/mcp-server";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

// In-memory store for active transports, keyed by session ID.
// This works for a single-server development environment.
const transports: Record<string, StreamableHTTPServerTransport> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const requestId = randomUUID(); // Generate a unique ID for each request for better traceability

  console.log(
    `[MCP][${requestId}] Received ${req.method} request for session: ${sessionId || "(new)"}, URL: ${req.url}`,
  );
  console.log(
    `[MCP][${requestId}] Request headers: ${JSON.stringify(req.headers)}`,
  );
  console.log(
    `[MCP][${requestId}] Request body (partial): ${JSON.stringify(req.body).substring(0, 500)}...`,
  );

  try {
    let transport: StreamableHTTPServerTransport | undefined;

    if (sessionId && transports[sessionId]) {
      // A transport for this session already exists.
      transport = transports[sessionId];
      console.log(
        `[MCP][${requestId}] Reusing existing transport for session: ${sessionId}`,
      );
    } else if (req.method === "POST" && isInitializeRequest(req.body)) {
      // This is a request to initialize a new session.
      console.log(`[MCP][${requestId}] Initializing new session.`);

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          console.log(`[MCP] Session initialized with ID: ${newSessionId}`);
          transports[newSessionId] = transport as StreamableHTTPServerTransport;
        },
      });

      transport.onclose = () => {
        const sid = transport?.sessionId;
        if (sid && transports[sid]) {
          console.log(`[MCP] Session closed: ${sid}`);
          delete transports[sid];
        }
      };

      // Connect the transport to the shared MCP server instance.
      await mcpServer.connect(transport);
      console.log(`[MCP][${requestId}] New transport connected to mcpServer.`);
    } else {
      // No session ID was provided for a non-initialization request.
      console.error(
        `[MCP][${requestId}] Invalid request: No session ID for non-init request or not an initialization POST.`,
      );
      return res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message:
            "Bad Request: No valid session ID provided for this request or not an initialization request.",
        },
        id: null,
      });
    }

    // Pass the request to the transport to handle.
    // The SDK's transport knows how to handle req/res from Node.js/Express.
    console.log(
      `[MCP][${requestId}] Passing request to transport.handleRequest.`,
    );
    await transport.handleRequest(req, res, req.body);
    console.log(`[MCP][${requestId}] Transport.handleRequest completed.`);
  } catch (error) {
    console.error(
      `[MCP][${requestId}] Error handling request: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
}
