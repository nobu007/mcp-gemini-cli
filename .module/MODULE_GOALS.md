# MCP Gemini CLI - Module Goals

## Purpose

Provide a clean, maintainable MCP server wrapper for Google's Gemini CLI with dual-mode operation (stdio MCP server + HTTP web server).

## KPI Targets

- **Code Duplication**: Reduce from ~40% to <5%
- **Module Cohesion**: Achieve single responsibility per module
- **Test Coverage**: Increase to >80%
- **Response Time**: Maintain <100ms overhead for API routing
- **Error Handling**: 100% of external calls wrapped with proper error handling

## Success Criteria

- [ ] Eliminate schema duplication (currently in cli.ts and tools.ts)
- [ ] Establish clear layer separation (Infrastructure → Service → API → Presentation)
- [ ] Extract environment handling to a dedicated configuration module
- [ ] Create base classes for common CLI execution patterns
- [ ] Implement consistent error response structure
- [ ] Add comprehensive tests for all refactored modules
- [ ] Maintain backward compatibility with existing API contracts

## Current State Issues

1. Zod schemas duplicated across 2 files (16 definitions total)
2. MCP server setup duplicated in cli.ts and lib/mcp-server.ts
3. Environment variable handling code duplicated in executeGeminiCli and streamGeminiCli
4. tools.ts has 433 lines mixing multiple concerns
5. No service layer between API routes and tool execution
6. Inconsistent working directory default strategies
