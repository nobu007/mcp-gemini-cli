import type { NextRequest } from "next/server";
import { z } from "zod";
import { spawn } from "node:child_process";

const CommandRequestSchema = z.object({
  command: z.string().min(1, "Command is required"),
});

// Helper to format SSE messages
const formatSse = (data: object) => `data: ${JSON.stringify(data)}\n\n`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CommandRequestSchema.parse(body);

    if (!validatedData.command.trim().startsWith("gemini ")) {
      const errorPayload = {
        success: false,
        error: "Invalid command. Only 'gemini' commands are allowed.",
      };
      return new Response(JSON.stringify(errorPayload), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = new ReadableStream({
      start(controller) {
        const commandParts = validatedData.command.split(" ");
        const child = spawn(commandParts[0], commandParts.slice(1), {
          cwd: process.cwd(),
          shell: false, // More secure to avoid shell injection
        });

        child.stdout.on("data", (data: Buffer) => {
          controller.enqueue(
            formatSse({ type: "stdout", content: data.toString() }),
          );
        });

        child.stderr.on("data", (data: Buffer) => {
          controller.enqueue(
            formatSse({ type: "stderr", content: data.toString() }),
          );
        });

        child.on("close", (code) => {
          controller.enqueue(
            formatSse({
              type: "close",
              content: `Process exited with code ${code}`,
            }),
          );
          controller.close();
        });

        child.on("error", (err) => {
          controller.enqueue(
            formatSse({ type: "error", content: err.message }),
          );
          controller.error(err);
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation error",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
