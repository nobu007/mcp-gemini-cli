import { executeGoogleSearch, executeGeminiChat } from "../index";

/**
 * Handles a Google search request by executing the `executeGoogleSearch` function.
 * This function is designed to be used by the Next.js API route.
 * @param query The search query string.
 * @param options Optional parameters for the search.
 * @returns A result object with success status, data or error, and a timestamp.
 */
export async function handleGoogleSearch(
  query: string,
  options: {
    limit?: number;
    raw?: boolean;
    sandbox?: boolean;
    yolo?: boolean;
    model?: string;
    workingDirectory?: string;
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

/**
 * Handles a Gemini chat request by executing the `executeGeminiChat` function.
 * This function is designed to be used by the Next.js API route.
 * @param prompt The chat prompt string.
 * @param options Optional parameters for the chat.
 * @returns A result object with success status, data or error, and a timestamp.
 */
export async function handleGeminiChat(
  prompt: string,
  options: {
    sandbox?: boolean;
    yolo?: boolean;
    model?: string;
    workingDirectory?: string;
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
