import type { NextApiRequest, NextApiResponse } from "next";
import { sseTransports } from "./sse";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message:
          "Method Not Allowed: Messages endpoint only accepts POST requests",
      },
      id: null,
    });
  }

  const sessionId = req.query.sessionId as string | undefined;

  console.log(`[Messages] Received POST request for session: ${sessionId}`);

  if (!sessionId) {
    console.error("[Messages] No sessionId provided in query parameters");
    return res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: sessionId query parameter is required",
      },
      id: null,
    });
  }

  const transport = sseTransports[sessionId];

  if (!transport) {
    console.error(`[Messages] No transport found for sessionId: ${sessionId}`);
    return res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: `Bad Request: No active SSE session found for sessionId: ${sessionId}`,
      },
      id: null,
    });
  }

  try {
    console.log(`[Messages] Handling message for session: ${sessionId}`);
    await transport.handlePostMessage(req, res, req.body);
    console.log(
      `[Messages] Message handled successfully for session: ${sessionId}`,
    );
  } catch (error) {
    console.error(
      `[Messages] Error handling message for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
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
