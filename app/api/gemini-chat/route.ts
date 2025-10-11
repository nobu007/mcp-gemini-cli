import type { NextRequest } from "next/server";
import { handleGeminiChatStream } from "@/lib/gemini-api";
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
    console.log(
      `[gemini-chat/route] POST request received. Body: ${JSON.stringify(body)}`,
    );
    const validatedData = ChatRequestSchema.parse(body);
    console.log("[gemini-chat/route] Request body validated successfully.");

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
      console.error(
        `[gemini-chat/route] Validation error: ${JSON.stringify(error.errors)}`,
      );
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[gemini-chat/route] Internal server error: ${errorMessage}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
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
  console.log(
    `[gemini-chat/route] GET request received. Prompt: "${prompt ? `${prompt.substring(0, 100)}...` : ""}", SearchParams: ${searchParams.toString()}`,
  );

  if (!prompt) {
    console.error(
      "[gemini-chat/route] GET request failed: Prompt parameter is required.",
    );
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[gemini-chat/route] Internal server error for GET request: ${errorMessage}`,
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
