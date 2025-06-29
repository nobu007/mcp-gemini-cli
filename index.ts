import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { spawn } from "node:child_process";
import { z } from "zod";

// Function to determine the gemini-cli command and its initial arguments
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

// Function to execute gemini-cli command
export async function executeGeminiCli(
  geminiCliCommand: { command: string; initialArgs: string[] },
  args: string[],
  timeoutMs: number = Number.parseInt(
    process.env.GEMINI_CLI_TIMEOUT_MS || "60000",
  ), // 環境変数で設定可能、デフォルト60秒
  workingDirectory?: string,
): Promise<string> {
  const { command, initialArgs } = geminiCliCommand;
  const commandArgs = [...initialArgs, ...args];

  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: workingDirectory || process.cwd(),
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
});

// Extracted tool execution functions for testing
export async function executeGoogleSearch(args: unknown, allowNpx = false) {
  const parsedArgs = GoogleSearchParametersSchema.parse(args);
  const geminiCliCmd = await decideGeminiCliCommand(allowNpx);

  // Use provided working directory or environment variable default
  const workingDir =
    parsedArgs.workingDirectory || process.env.GEMINI_CLI_WORKING_DIR;

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
  const searchTimeout = Number.parseInt(
    process.env.GEMINI_CLI_SEARCH_TIMEOUT_MS || "30000",
  );
  const result = await executeGeminiCli(
    geminiCliCmd,
    cliArgs,
    searchTimeout,
    workingDir,
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

export async function executeGeminiChat(args: unknown, allowNpx = false) {
  const parsedArgs = GeminiChatParametersSchema.parse(args);
  const geminiCliCmd = await decideGeminiCliCommand(allowNpx);

  // Use provided working directory or environment variable default
  const workingDir =
    parsedArgs.workingDirectory || process.env.GEMINI_CLI_WORKING_DIR;

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
    60000,
    workingDir,
  );
  return result;
}

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
