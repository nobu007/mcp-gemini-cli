import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { spawn } from "node:child_process";
import { z } from "zod";
import { TIMEOUT_CONFIG } from "./config";

/**
 * Determines the command to execute for gemini-cli.
 * It first checks if 'gemini' is in the system's PATH. If not, and if allowNpx is true,
 * it falls back to using 'npx' to run the CLI from its GitHub repository.
 * @param allowNpx - If true, allows using npx as a fallback.
 * @returns A promise that resolves to an object containing the command and initial arguments.
 * @throws An error if 'gemini' is not found and npx is not allowed.
 */
export async function decideGeminiCliCommand(
  allowNpx: boolean,
): Promise<{ command: string; initialArgs: string[] }> {
  return new Promise((resolve, reject) => {
    const child = spawn("which", ["gemini"]);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ command: "gemini", initialArgs: [] });
      } else if (allowNpx) {
        resolve({
          command: "npx",
          initialArgs: ["https://github.com/google-gemini/gemini-cli"],
        });
      } else {
        reject(
          new Error(
            "gemini not found globally and --allow-npx option not specified.",
          ),
        );
      }
    });
    child.on("error", (err) => {
      reject(err);
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
  const { command, initialArgs } = geminiCliCommand;
  const commandArgs = [...initialArgs, ...args];

  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: workingDirectory || process.cwd(),
      env: { ...process.env, ...env },
    });
    let stdout = "";
    let stderr = "";
    let isResolved = false;

    // タイムアウト処理
    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        child.kill("SIGTERM");
        reject(
          new Error(`gemini-cli operation timed out after ${timeoutMs}ms`),
        );
      }
    }, timeoutMs);

    // Close stdin immediately since we're not sending any input
    child.stdin.end();

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeout);
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
        reject(err);
      }
    });
  });
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
      'The Gemini model to use. Recommended: "gemini-2.5-pro" (default) or "gemini-2.5-flash". Both models are confirmed to work with Google login.',
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
      'The Gemini model to use. Recommended: "gemini-2.5-pro" (default) or "gemini-2.5-flash". Both models are confirmed to work with Google login.',
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
    prompt = `Perform a web search for \"${parsedArgs.query}\". Synthesize the findings and provide a list of sources. Return the entire output as a single, valid JSON object with the following structure: { \"summary\": \"...\", \"sources\": [{ \"url\": \"...\", \"title\": \"...\", \"snippet\": \"...\" }] }.${limitText}`;
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

/**
 * The main function of the MCP server.
 * It initializes the McpServer, registers the `googleSearch` and `geminiChat` tools,
 * and connects the server to a StdioServerTransport.
 */
async function main() {
  // Check for --allow-npx argument
  const allowNpx = process.argv.includes("--allow-npx");

  // Check if gemini-cli is available at startup
  try {
    await decideGeminiCliCommand(allowNpx);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(
      "Please install gemini-cli globally or use --allow-npx option.",
    );
    process.exit(1);
  }

  const server = new McpServer({
    name: "mcp-gemini-cli",
    version: "0.2.0",
  });

  // Register googleSearch tool
  server.registerTool(
    "googleSearch",
    {
      description:
        "Performs a Google search using gemini-cli and returns structured results.",
      inputSchema: GoogleSearchParametersSchema.shape,
    },
    async (args) => {
      const result = await executeGoogleSearch(args, allowNpx);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    },
  );

  // Register geminiChat tool
  server.registerTool(
    "geminiChat",
    {
      description: "Engages in a chat conversation with gemini-cli.",
      inputSchema: GeminiChatParametersSchema.shape,
    },
    async (args) => {
      const result = await executeGeminiChat(args, allowNpx);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    },
  );

  // Connect the server to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only run main if this file is being executed directly
if (import.meta.main) {
  main().catch(console.error);
}
