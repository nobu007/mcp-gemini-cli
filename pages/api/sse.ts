import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { NextApiRequest, NextApiResponse } from "next";
import { mcpServer } from "@/lib/mcp-server";

// In-memory store for active SSE transports, keyed by session ID.
export const sseTransports: Record<string, SSEServerTransport> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method Not Allowed: SSE endpoint only accepts GET requests",
      },
      id: null,
    });
  }

  console.log("[SSE] Received GET request to establish SSE connection");

  try {
    // Create a new SSE transport with the messages endpoint
    const transport = new SSEServerTransport("/api/messages", res);

    // Store the transport by session ID
    sseTransports[transport.sessionId] = transport;
    console.log(`[SSE] Session initialized with ID: ${transport.sessionId}`);

    // Clean up when the connection is closed
    res.on("close", () => {
      console.log(
        `[SSE] Connection closed for session: ${transport.sessionId}`,
      );
      delete sseTransports[transport.sessionId];
    });

    // Connect the transport to the MCP server
    await mcpServer.connect(transport);
    console.log(
      `[SSE] Transport connected to mcpServer for session: ${transport.sessionId}`,
    );
  } catch (error) {
    console.error(
      `[SSE] Error establishing SSE connection: ${error instanceof Error ? error.message : String(error)}`,
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
