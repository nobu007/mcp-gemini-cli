/**
 * CLI command preview utility functions
 */

export interface CliCommandPreview {
  command: string;
  fullCommand: string;
  args: string[];
  workingDirectory?: string;
  environment?: Record<string, string>;
}

/**
 * Builds the CLI command preview for Google Search
 */
export function buildGoogleSearchCommand(params: {
  query: string;
  limit?: number;
  raw?: boolean;
  sandbox?: boolean;
  yolo?: boolean;
  model?: string;
  workingDirectory?: string;
  apiKey?: string;
}): CliCommandPreview {
  const { query, limit, raw, sandbox, yolo, model, workingDirectory, apiKey } = params;

  if (!query.trim()) {
    return {
      command: "# No search query specified",
      fullCommand: "# No search query specified",
      args: [],
    };
  }

  // Determine the base command (simplified for preview)
  const baseCommand = "gemini"; // We'll show 'gemini' for simplicity, actual execution might use npx

  // Build prompt based on options
  let prompt: string;

  if (raw) {
    const limitText = limit ? ` Limit to ${limit} sources.` : "";
    prompt = `Perform a web search for "${query}". Synthesize the findings and provide a list of sources. Return the entire output as a single, valid JSON object with the following structure: { "summary": "...", "sources": [{ "url": "...", "title": "...", "snippet": "..." }] }.${limitText}`;
  } else {
    prompt = `Search for: ${query}`;
    if (limit) {
      prompt += ` (return up to ${limit} results)`;
    }
  }

  const args = ["-p", prompt];

  if (sandbox) {
    args.push("-s");
  }
  if (yolo) {
    args.push("-y");
  }
  if (model) {
    args.push("-m", model);
  }

  // Build environment variables
  const environment: Record<string, string> = {};
  if (apiKey) {
    environment.GEMINI_API_KEY = "[CONFIGURED]";
  }

  // Build the full command string for display
  const envPrefix = Object.keys(environment).length > 0
    ? `${Object.entries(environment).map(([key, value]) => `${key}=${value}`).join(" ")} `
    : "";

  const cdPrefix = workingDirectory ? `cd "${workingDirectory}" && ` : "";
  const escapedArgs = args.map(arg => arg.includes(" ") ? `"${arg}"` : arg);
  const fullCommand = `${cdPrefix}${envPrefix}${baseCommand} ${escapedArgs.join(" ")}`;

  return {
    command: baseCommand,
    fullCommand,
    args,
    workingDirectory,
    environment: Object.keys(environment).length > 0 ? environment : undefined,
  };
}

/**
 * Builds the CLI command preview for Gemini Chat
 */
export function buildGeminiChatCommand(params: {
  prompt: string;
  sandbox?: boolean;
  yolo?: boolean;
  model?: string;
  workingDirectory?: string;
  apiKey?: string;
}): CliCommandPreview {
  const { prompt, sandbox, yolo, model, workingDirectory, apiKey } = params;

  if (!prompt.trim()) {
    return {
      command: "# No prompt specified",
      fullCommand: "# No prompt specified",
      args: [],
    };
  }

  // Determine the base command (simplified for preview)
  const baseCommand = "gemini"; // We'll show 'gemini' for simplicity, actual execution might use npx

  const args = ["-p", prompt];

  if (sandbox) {
    args.push("-s");
  }
  if (yolo) {
    args.push("-y");
  }
  if (model) {
    args.push("-m", model);
  }

  // Build environment variables
  const environment: Record<string, string> = {};
  if (apiKey) {
    environment.GEMINI_API_KEY = "[CONFIGURED]";
  }

  // Build the full command string for display
  const envPrefix = Object.keys(environment).length > 0
    ? `${Object.entries(environment).map(([key, value]) => `${key}=${value}`).join(" ")} `
    : "";

  const cdPrefix = workingDirectory ? `cd "${workingDirectory}" && ` : "";
  const escapedArgs = args.map(arg => arg.includes(" ") ? `"${arg}"` : arg);
  const fullCommand = `${cdPrefix}${envPrefix}${baseCommand} ${escapedArgs.join(" ")}`;

  return {
    command: baseCommand,
    fullCommand,
    args,
    workingDirectory,
    environment: Object.keys(environment).length > 0 ? environment : undefined,
  };
}
