import type { NextRequest } from "next/server";
import { handleGeminiChatStream } from "../../../lib/gemini-api";
import { z } from "zod";

const ChatRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  sandbox: z.boolean().optional(),
  yolo: z.boolean().optional(),
  model: z.string().optional(),
  workingDirectory: z.string().optional(),
  apiKey: z.string().optional(),
});

const sseHeaders = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ChatRequestSchema.parse(body);

    const stream = handleGeminiChatStream(validatedData.prompt, {
      sandbox: validatedData.sandbox,
      yolo: validatedData.yolo,
      model: validatedData.model,
      workingDirectory: validatedData.workingDirectory,
      apiKey: validatedData.apiKey,
    });

    return new Response(stream, { headers: sseHeaders });
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get("prompt");

  if (!prompt) {
    return new Response(
      JSON.stringify({ success: false, error: "Prompt parameter is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const stream = handleGeminiChatStream(prompt, {
      sandbox: searchParams.get("sandbox") === "true",
      yolo: searchParams.get("yolo") === "true",
      model: searchParams.get("model") || undefined,
      workingDirectory: searchParams.get("workingDirectory") || undefined,
      apiKey: searchParams.get("apiKey") || undefined,
    });

    return new Response(stream, { headers: sseHeaders });
  } catch (error) {
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
