// Default timeout values in milliseconds
const DEFAULT_TIMEOUTS = {
  CHAT: 600000,    // 10 minutes
  SEARCH: 60000,   // 1 minute  
  DEFAULT: 60000,  // 1 minute
} as const;

// Timeout configuration constants
export const TIMEOUT_CONFIG = {
  // Chat timeout: 10 minutes (600 seconds)
  CHAT_TIMEOUT_MS: Number.parseInt(
    process.env.GEMINI_CLI_CHAT_TIMEOUT_MS || DEFAULT_TIMEOUTS.CHAT.toString(),
  ),
  
  // Search timeout: 1 minute (60 seconds)  
  SEARCH_TIMEOUT_MS: Number.parseInt(
    process.env.GEMINI_CLI_SEARCH_TIMEOUT_MS || DEFAULT_TIMEOUTS.SEARCH.toString(),
  ),
  
  // General operations timeout: 1 minute (60 seconds)
  DEFAULT_TIMEOUT_MS: Number.parseInt(
    process.env.GEMINI_CLI_TIMEOUT_MS || DEFAULT_TIMEOUTS.DEFAULT.toString(),
  ),
} as const;