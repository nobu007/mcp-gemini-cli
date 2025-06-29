import { executeGoogleSearch, executeGeminiChat } from "../index";

export async function handleGoogleSearch(
  query: string,
  options: {
    limit?: number;
    raw?: boolean;
    sandbox?: boolean;
    yolo?: boolean;
    model?: string;
  } = {},
) {
  try {
    const result = await executeGoogleSearch(
      {
        query,
        ...options,
      },
      true,
    );

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}

export async function handleGeminiChat(
  prompt: string,
  options: {
    sandbox?: boolean;
    yolo?: boolean;
    model?: string;
  } = {},
) {
  try {
    const result = await executeGeminiChat(
      {
        prompt,
        ...options,
      },
      true,
    );

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}
