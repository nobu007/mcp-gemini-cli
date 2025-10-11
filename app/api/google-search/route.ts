import { type NextRequest, NextResponse } from "next/server";
import { handleGoogleSearch } from "@/lib/gemini-api";
import { z } from "zod";

const SearchRequestSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().optional(),
  raw: z.boolean().optional(),
  sandbox: z.boolean().optional(),
  yolo: z.boolean().optional(),
  model: z.string().optional(),
  workingDirectory: z.string().optional(),
  apiKey: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SearchRequestSchema.parse(body);

    const result = await handleGoogleSearch(validatedData.query, {
      limit: validatedData.limit,
      raw: validatedData.raw,
      sandbox: validatedData.sandbox,
      yolo: validatedData.yolo,
      model: validatedData.model,
      workingDirectory: validatedData.workingDirectory,
      apiKey: validatedData.apiKey,
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
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { success: false, error: "Query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const result = await handleGoogleSearch(query, {
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
      raw: searchParams.get("raw") === "true",
      sandbox: searchParams.get("sandbox") === "true",
      yolo: searchParams.get("yolo") === "true",
      model: searchParams.get("model") || undefined,
      workingDirectory: searchParams.get("workingDirectory") || undefined,
      apiKey: searchParams.get("apiKey") || undefined,
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
