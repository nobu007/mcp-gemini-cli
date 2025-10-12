/**
 * Environment Manager
 * Centralizes environment variable handling for gemini-cli execution
 */

export interface GeminiEnvConfig {
  apiKey?: string;
  workingDirectory?: string;
  [key: string]: string | undefined;
}

/**
 * Prepares environment variables for gemini-cli execution
 * Handles API key masking, IDE integration disabling, and custom variable merging
 */
export class EnvManager {
  /**
   * Prepares a complete environment configuration for gemini-cli
   * @param customEnv - Custom environment variables to apply
   * @returns A complete environment object ready for child process spawning
   */
  static prepareEnv(
    customEnv?: Record<string, string | undefined>,
  ): Record<string, string | undefined> {
    // Create a mutable copy of the environment
    const fullEnv: Record<string, string | undefined> = { ...process.env };

    // Disable IDE integration for gemini-cli to avoid authentication issues
    EnvManager.disableIdeIntegration(fullEnv);

    // Remove GEMINI_API_KEY to use OAuth authentication by default
    delete fullEnv.GEMINI_API_KEY;

    // Apply custom environment variables
    if (customEnv) {
      EnvManager.applyCustomEnv(fullEnv, customEnv);
    }

    return fullEnv;
  }

  /**
   * Disables IDE integration environment variables
   */
  private static disableIdeIntegration(
    env: Record<string, string | undefined>,
  ): void {
    delete env.GEMINI_CLI_IDE_SERVER_PORT;
    delete env.GEMINI_CLI_IDE_WORKSPACE_PATH;
    delete env.ENABLE_IDE_INTEGRATION;
  }

  /**
   * Applies custom environment variables, handling undefined values (unset)
   */
  private static applyCustomEnv(
    env: Record<string, string | undefined>,
    customEnv: Record<string, string | undefined>,
  ): void {
    for (const [key, value] of Object.entries(customEnv)) {
      if (value === undefined) {
        // Unset the environment variable
        delete env[key];
      } else {
        // Set or overwrite the environment variable
        env[key] = value;
      }
    }
  }

  /**
   * Creates a version of the environment safe for logging (masks sensitive data)
   */
  static maskSensitiveData(
    env: Record<string, string | undefined>,
  ): Record<string, string | undefined> {
    const masked = { ...env };
    if (masked.GEMINI_API_KEY) {
      masked.GEMINI_API_KEY = "[MASKED]";
    }
    return masked;
  }

  /**
   * Builds environment variables from parsed tool arguments
   */
  static fromToolArgs(args: GeminiEnvConfig): Record<string, string> {
    const envVars: Record<string, string> = {};

    if (args.apiKey) {
      // User-specified API key takes priority over system environment variables
      envVars.GEMINI_API_KEY = args.apiKey;
    }
    // If no API key is specified, system environment variables (process.env.GEMINI_API_KEY) will be used

    return envVars;
  }

  /**
   * Resolves the working directory with fallback chain
   */
  static resolveWorkingDirectory(
    requestedDir?: string,
    envDefault?: string,
  ): string {
    return (
      requestedDir ||
      envDefault ||
      process.env.GEMINI_CLI_WORKING_DIR ||
      process.cwd()
    );
  }
}
