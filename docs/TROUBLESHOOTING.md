# Troubleshooting & FAQ

## Q: I'm getting a timeout error

**A**: The default timeout is 60 seconds. You can increase it by setting the `GEMINI_CLI_TIMEOUT_MS` environment variable. For search-specific timeouts, use `GEMINI_CLI_SEARCH_TIMEOUT_MS`.

```bash
export GEMINI_CLI_TIMEOUT_MS=120000 # 120 seconds
```

## Q: How do I use a specific Gemini model?

**A**: You can specify the model using the `model` parameter in your API calls or tool usage.

```typescript
geminiChat({
  prompt: "Write a haiku about programming",
  model: "gemini-1.5-flash"
});
```

## Q: Where can I find more detailed API documentation?

**A**: Check out the [API Reference](./API.md).

## Q: How do I contribute to the project?

**A**: Please see our [Contributing Guide](../CONTRIBUTING.md) and [Development Guide](./DEVELOPMENT.md).
