# API Reference

The server provides RESTful API endpoints for interacting with Gemini services. These are available when running in Web Mode (`npm run web:dev`).

## Endpoints

### 1. Google Search

- **Endpoint**: `/api/google-search`
- **Method**: `POST`, `GET`
- **Description**: Performs a Google search using Gemini.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | Yes | The search query. |
| `limit` | number | No | Maximum number of results. |
| `raw` | boolean | No | If `true`, returns structured JSON results. |
| `sandbox` | boolean | No | Run in sandbox mode. |
| `yolo` | boolean | No | Skip confirmation prompts. |
| `model` | string | No | Gemini model to use (e.g., "gemini-1.5-pro"). |

**Example (cURL):**

```bash
curl -X POST http://localhost:3000/api/google-search \
  -H "Content-Type: application/json" \
  -d '{"query": "TypeScript best practices", "limit": 5}'
```

### 2. Gemini Chat

- **Endpoint**: `/api/gemini-chat`
- **Method**: `POST`, `GET`
- **Description**: Engages in a direct conversation with Gemini.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `prompt` | string | Yes | The prompt to send to Gemini. |
| `sandbox` | boolean | No | Run in sandbox mode. |
| `yolo` | boolean | No | Skip confirmation prompts. |
| `model` | string | No | Gemini model to use (e.g., "gemini-1.5-pro"). |

**Example (cURL):**

```bash
curl -X POST http://localhost:3000/api/gemini-chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain quantum computing in simple terms"}'
```
