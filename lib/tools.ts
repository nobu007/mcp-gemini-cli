import { spawn } from "node:child_process";
import { z } from "zod";
import { TIMEOUT_CONFIG } from "../config";

/**
 * Determines the command to execute for gemini-cli.
 * It first checks if 'gemini' is in the system's PATH. If not, and if allowNpx is true,
 * it falls back to using 'npx' to run the CLI from its GitHub repository.
 * @param allowNpx - If true, allows using npx as a fallback.
 * @returns A promise that resolves to an object containing the command and initial arguments.
 * @throws An error if 'gemini' is not found and npx is not allowed.
 */
export async function decideGeminiCliCommand(
  _allowNpx: boolean,
): Promise<{ command: string; initialArgs: string[] }> {
  return new Promise((resolve, _reject) => {
    console.log("[tools] Attempting to find 'gemini' executable...");
    const whichChild = spawn("which", ["gemini"]);
    let whichStdout = "";
    let whichStderr = "";

    whichChild.stdout.on("data", (data) => {
      whichStdout += data.toString();
    });

    whichChild.stderr.on("data", (data) => {
      whichStderr += data.toString();
    });

    whichChild.on("close", (code) => {
      if (code === 0 && whichStdout.trim().length > 0) {
        console.log(`[tools] 'gemini' found at: ${whichStdout.trim()}`);
        resolve({ command: "gemini", initialArgs: [] });
      } else {
        console.warn(
          `[tools] 'gemini' not found in PATH. which exited with code ${code}. Stderr: ${whichStderr.trim()}`,
        );
        console.log(
          "[tools] Falling back to 'npx @google-gemini/cli' as 'gemini' was not found in PATH.",
        );
        resolve({ command: "npx", initialArgs: ["@google-gemini/cli"] });
      }
    });

    whichChild.on("error", (err) => {
      console.error(`[tools] Error executing 'which gemini': ${err.message}`);
      console.log(
        "[tools] Falling back to 'npx @google-gemini/cli' due to 'which' command error.",
      );
      resolve({ command: "npx", initialArgs: ["@google-gemini/cli"] });
    });
  });
}

/**
 * Executes the gemini-cli command as a child process with a specified timeout.
 * @param geminiCliCommand - The command and initial arguments to execute.
 * @param args - The arguments to pass to the gemini-cli command.
 * @param timeoutMs - The timeout in milliseconds for the operation.
 * @param workingDirectory - The working directory to run the command in.
 * @returns A promise that resolves with the stdout of the command.
 * @throws An error if the command times out or exits with a non-zero code.
 */
export async function executeGeminiCli(
  geminiCliCommand: { command: string; initialArgs: string[] },
  args: string[],
  timeoutMs: number = TIMEOUT_CONFIG.DEFAULT_TIMEOUT_MS,
  workingDirectory?: string,
  env?: Record<string, string>,
): Promise<string> {
  const escapeShellArg = (arg: string) => `'${arg.replace(/'/g, "'\\''")}'`;

  const { command, initialArgs } = geminiCliCommand;
  const allArgs = [...initialArgs, ...args];
  const commandString = [command, ...allArgs.map(escapeShellArg)].join(" ");

  const cwd = workingDirectory || process.cwd();
  const fullEnv = { ...process.env, ...env };

  // Mask API key for logging
  const loggedEnv = { ...fullEnv };
  if (loggedEnv.GEMINI_API_KEY) {
    loggedEnv.GEMINI_API_KEY = "[MASKED]";
  }

  console.log(`[tools] Executing via bash -c: ${commandString}`);
  console.log(`[tools] Working directory: ${cwd}`);
  console.log(`[tools] Environment variables: ${JSON.stringify(loggedEnv)}`);

  return new Promise((resolve, reject) => {
    const child = spawn("bash", ["-c", commandString], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: cwd,
      env: fullEnv,
    });
    let stdout = "";
    let stderr = "";
    let isResolved = false;

    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        child.kill("SIGTERM");
        console.error(
          `[tools] Command timed out after ${timeoutMs}ms: ${commandString}`,
        );
        reject(
          new Error(`gemini-cli operation timed out after ${timeoutMs}ms`),
        );
      }
    }, timeoutMs);

    child.stdin.end();

    child.stdout.on("data", (data) => {
      stdout += data.toString();
      console.log(`[tools] STDOUT: ${data.toString().trim()}`);
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
      console.error(`[tools] STDERR: ${data.toString().trim()}`);
    });

    child.on("close", (code) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeout);
        console.log(
          `[tools] Command exited with code ${code}: ${commandString}`,
        );
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`gemini exited with code ${code}: ${stderr}`));
        }
      }
    });

    child.on("error", (err) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeout);
        console.error(
          `[tools] Failed to start command ${commandString}: ${err.message}`,
        );
        reject(err);
      }
    });
  });
}

/**
 * Spawns a gemini-cli command and returns the child process for streaming.
 * @param geminiCliCommand - The command and initial arguments to execute.
 * @param args - The arguments to pass to the gemini-cli command.
 * @param workingDirectory - The working directory to run the command in.
 * @param env - Environment variables to pass to the child process.
 * @returns The spawned child process instance.
 */
export function streamGeminiCli(
  geminiCliCommand: { command: string; initialArgs: string[] },
  args: string[],
  workingDirectory?: string,
  env?: Record<string, string>,
) {
  const escapeShellArg = (arg: string) => `'${arg.replace(/'/g, "'\\''")}'`;

  const { command, initialArgs } = geminiCliCommand;
  const allArgs = [...initialArgs, ...args];
  const commandString = [command, ...allArgs.map(escapeShellArg)].join(" ");

  const cwd = workingDirectory || process.cwd();
  const fullEnv = { ...process.env, ...env };

  // Mask API key for logging
  const loggedEnv = { ...fullEnv };
  if (loggedEnv.GEMINI_API_KEY) {
    loggedEnv.GEMINI_API_KEY = "[MASKED]";
  }

  console.log(`[tools] Streaming via bash -c: ${commandString}`);
  console.log(`[tools] Working directory: ${cwd}`);
  console.log(`[tools] Environment variables: ${JSON.stringify(loggedEnv)}`);

  const child = spawn("bash", ["-c", commandString], {
    stdio: ["pipe", "pipe", "pipe"],
    cwd: cwd,
    env: fullEnv,
  });

  // Close stdin immediately since we're not sending any input
  child.stdin.end();

  return child;
}

// Zod schema for googleSearch tool parameters
export const GoogleSearchParametersSchema = z.object({
  query: z.string().describe("The search query."),
  limit: z
    .number()
    .optional()
    .describe("Maximum number of results to return (optional)."),
  raw: z
    .boolean()
    .optional()
    .describe("Return raw search results with URLs and snippets (optional)."),
  sandbox: z.boolean().optional().describe("Run gemini-cli in sandbox mode."),
  yolo: z
    .boolean()
    .optional()
    .describe("Automatically accept all actions (aka YOLO mode)."),
  model: z
    .string()
    .optional()
    .describe(
      'The Gemini model to use. Recommended: "gemini-1.5-pro" (default) or "gemini-1.5-flash". Both models are confirmed to work with Google login.',
    ),
  workingDirectory: z
    .string()
    .optional()
    .describe("Working directory path for gemini-cli execution (optional)."),
  apiKey: z
    .string()
    .optional()
    .describe("Gemini API key for authentication (optional)."),
});

// Zod schema for geminiChat tool parameters
export const GeminiChatParametersSchema = z.object({
  prompt: z.string().describe("The prompt for the chat conversation."),
  sandbox: z.boolean().optional().describe("Run gemini-cli in sandbox mode."),
  yolo: z
    .boolean()
    .optional()
    .describe("Automatically accept all actions (aka YOLO mode)."),
  model: z
    .string()
    .optional()
    .describe(
      'The Gemini model to use. Recommended: "gemini-1.5-pro" (default) or "gemini-1.5-flash". Both models are confirmed to work with Google login.',
    ),
  workingDirectory: z
    .string()
    .optional()
    .describe("Working directory path for gemini-cli execution (optional)."),
  apiKey: z
    .string()
    .optional()
    .describe("Gemini API key for authentication (optional)."),
});

/**
 * Executes a Google search using the gemini-cli.
 * It constructs a detailed prompt for the AI to ensure structured output when `raw` is requested.
 * @param args - The arguments for the search, validated against GoogleSearchParametersSchema.
 * @param allowNpx - If true, allows using npx as a fallback for the gemini command.
 * @returns The search result as a string. If `raw` is true, it returns a JSON string.
 */
export async function executeGoogleSearch(args: unknown, allowNpx = false) {
  const parsedArgs = GoogleSearchParametersSchema.parse(args);
  const geminiCliCmd = await decideGeminiCliCommand(allowNpx);

  // Use provided working directory or environment variable default
  const workingDir =
    parsedArgs.workingDirectory || process.env.GEMINI_CLI_WORKING_DIR;

  // Prepare environment variables
  const envVars: Record<string, string> = {};
  if (parsedArgs.apiKey) {
    // User-specified API key takes priority over system environment variables
    envVars.GEMINI_API_KEY = parsedArgs.apiKey;
  }
  // If no API key is specified, system environment variables (process.env.GEMINI_API_KEY) will be used

  // Build prompt based on options
  let prompt: string;

  if (parsedArgs.raw) {
    const limitText = parsedArgs.limit
      ? ` Limit to ${parsedArgs.limit} sources.`
      : "";
    // A clearer instruction for the model to generate JSON
    prompt = `Perform a web search for "${parsedArgs.query}". Synthesize the findings and provide a list of sources. Return the entire output as a single, valid JSON object with the following structure: { "summary": "...", "sources": [{ "url": "...", "title": "...", "snippet": "..." }] }.${limitText}`;
  } else {
    // Natural language search
    prompt = `Search for: ${parsedArgs.query}`;
    if (parsedArgs.limit) {
      prompt += ` (return up to ${parsedArgs.limit} results)`;
    }
  }

  const cliArgs = ["-p", prompt];

  if (parsedArgs.sandbox) {
    cliArgs.push("-s");
  }
  if (parsedArgs.yolo) {
    cliArgs.push("-y");
  }
  if (parsedArgs.model) {
    cliArgs.push("-m", parsedArgs.model);
  }

  // Google検索用のタイムアウト設定（環境変数で変更可能）
  const searchTimeout = TIMEOUT_CONFIG.SEARCH_TIMEOUT_MS;
  const result = await executeGeminiCli(
    geminiCliCmd,
    cliArgs,
    searchTimeout,
    workingDir,
    envVars,
  );

  // For raw requests, attempt to clean up and parse the JSON
  if (parsedArgs.raw) {
    try {
      // The model might wrap the JSON in markdown backticks
      const jsonString = result.replace(/^```json\n|```$/g, "").trim();
      // This will throw if the JSON is invalid, which is fine.
      // We just return the pretty-printed valid JSON.
      const jsonResult = JSON.parse(jsonString);
      return JSON.stringify(jsonResult, null, 2);
    } catch (_error) {
      // If parsing fails, return the raw output as a fallback.
      // The client might still be able to make sense of it.
      return result;
    }
  }

  return result;
}

/**
 * Executes a chat conversation using the gemini-cli.
 * @param args - The arguments for the chat, validated against GeminiChatParametersSchema.
 * @param allowNpx - If true, allows using npx as a fallback for the gemini command.
 * @returns The chat response as a string.
 */
export async function executeGeminiChat(args: unknown, allowNpx = false) {
  const parsedArgs = GeminiChatParametersSchema.parse(args);
  const geminiCliCmd = await decideGeminiCliCommand(allowNpx);

  // Use provided working directory or environment variable default
  const workingDir =
    parsedArgs.workingDirectory || process.env.GEMINI_CLI_WORKING_DIR;

  // Prepare environment variables
  const envVars: Record<string, string> = {};
  if (parsedArgs.apiKey) {
    // User-specified API key takes priority over system environment variables
    envVars.GEMINI_API_KEY = parsedArgs.apiKey;
  }
  // If no API key is specified, system environment variables (process.env.GEMINI_API_KEY) will be used

  const cliArgs = ["-p", parsedArgs.prompt];
  if (parsedArgs.sandbox) {
    cliArgs.push("-s");
  }
  if (parsedArgs.yolo) {
    cliArgs.push("-y");
  }
  if (parsedArgs.model) {
    cliArgs.push("-m", parsedArgs.model);
  }
  const result = await executeGeminiCli(
    geminiCliCmd,
    cliArgs,
    TIMEOUT_CONFIG.CHAT_TIMEOUT_MS,
    workingDir,
    envVars,
  );
  return result;
}
