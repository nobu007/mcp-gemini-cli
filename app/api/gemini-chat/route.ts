import { type NextRequest, NextResponse } from "next/server";
import { handleGeminiChat } from "../../../lib/gemini-api";
import { z } from "zod";

const ChatRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  sandbox: z.boolean().optional(),
  yolo: z.boolean().optional(),
  model: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ChatRequestSchema.parse(body);

    const result = await handleGeminiChat(validatedData.prompt, {
      sandbox: validatedData.sandbox,
      yolo: validatedData.yolo,
      model: validatedData.model,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get("prompt");

  if (!prompt) {
    return NextResponse.json(
      { success: false, error: "Prompt parameter is required" },
      { status: 400 },
    );
  }

  try {
    const result = await handleGeminiChat(prompt, {
      sandbox: searchParams.get("sandbox") === "true",
      yolo: searchParams.get("yolo") === "true",
      model: searchParams.get("model") || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
