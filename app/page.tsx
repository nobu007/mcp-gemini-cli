"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import TemplateSelector from "../components/TemplateSelector";
import {
  buildGoogleSearchCommand,
  buildGeminiChatCommand,
} from "../lib/cli-preview";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [chatPrompt, setChatPrompt] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [chatResult, setChatResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [workingDirectory, setWorkingDirectory] = useState("");
  const [geminiApiKeys, setGeminiApiKeys] = useState<string[]>([]);
  const [currentApiKeyIndex, setCurrentApiKeyIndex] = useState(0);
  const [newApiKey, setNewApiKey] = useState("");
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);

  // Helper function to get current API key (wrapped in useCallback for stable reference)
  const getCurrentApiKey = useCallback(() => {
    return geminiApiKeys[currentApiKeyIndex] || "";
  }, [geminiApiKeys, currentApiKeyIndex]);

  // CLI command previews (memoized for performance)
  const searchCommandPreview = useMemo(() => {
    return buildGoogleSearchCommand({
      query: searchQuery,
      limit: 5,
      yolo: true,
      workingDirectory: workingDirectory || undefined,
      apiKey: getCurrentApiKey() || undefined,
    });
  }, [searchQuery, workingDirectory, getCurrentApiKey]);

  const chatCommandPreview = useMemo(() => {
    return buildGeminiChatCommand({
      prompt: chatPrompt,
      yolo: true,
      workingDirectory: workingDirectory || undefined,
      apiKey: getCurrentApiKey() || undefined,
    });
  }, [chatPrompt, workingDirectory, getCurrentApiKey]);

  // LocalStorageからWorking Directoryを復元
  useEffect(() => {
    const savedWorkingDirectory = localStorage.getItem(
      "mcp-gemini-working-directory",
    );
    if (savedWorkingDirectory) {
      setWorkingDirectory(savedWorkingDirectory);
    }

    // Gemini API Keysを復元
    const savedApiKeys = localStorage.getItem("mcp-gemini-api-keys");
    if (savedApiKeys) {
      try {
        const parsedKeys = JSON.parse(savedApiKeys);
        if (Array.isArray(parsedKeys) && parsedKeys.length > 0) {
          setGeminiApiKeys(parsedKeys);
        }
      } catch (error) {
        console.warn("Failed to parse saved API keys:", error);
      }
    }

    // 現在のAPI Key indexを復元
    const savedApiKeyIndex = localStorage.getItem(
      "mcp-gemini-current-api-key-index",
    );
    if (savedApiKeyIndex) {
      const index = Number.parseInt(savedApiKeyIndex, 10);
      if (!Number.isNaN(index)) {
        setCurrentApiKeyIndex(index);
      }
    }
  }, []);

  // Working Directoryが変更された時にLocalStorageに保存
  const handleWorkingDirectoryChange = (value: string) => {
    setWorkingDirectory(value);
    if (value.trim()) {
      localStorage.setItem("mcp-gemini-working-directory", value);
    } else {
      localStorage.removeItem("mcp-gemini-working-directory");
    }
  };

  // API Key管理関数
  const saveApiKeys = (keys: string[]) => {
    setGeminiApiKeys(keys);
    localStorage.setItem("mcp-gemini-api-keys", JSON.stringify(keys));
  };

  const addApiKey = () => {
    if (!newApiKey.trim()) return;
    const updatedKeys = [...geminiApiKeys, newApiKey.trim()];
    saveApiKeys(updatedKeys);
    setNewApiKey("");
  };

  const removeApiKey = (index: number) => {
    const updatedKeys = geminiApiKeys.filter((_, i) => i !== index);
    saveApiKeys(updatedKeys);

    // 現在選択中のインデックスを調整
    if (currentApiKeyIndex >= updatedKeys.length) {
      const newIndex = Math.max(0, updatedKeys.length - 1);
      setCurrentApiKeyIndex(newIndex);
      localStorage.setItem(
        "mcp-gemini-current-api-key-index",
        newIndex.toString(),
      );
    }
  };

  const switchApiKey = (index: number) => {
    setCurrentApiKeyIndex(index);
    localStorage.setItem("mcp-gemini-current-api-key-index", index.toString());
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/google-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          yolo: true,
          limit: 5,
          ...(workingDirectory && { workingDirectory }),
          ...(getCurrentApiKey() && { apiKey: getCurrentApiKey() }),
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }
      const data = await response.json();
      setSearchResult(data.success ? data.data : `Error: ${data.error}`);
    } catch (error) {
      setSearchResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatPrompt.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/gemini-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: chatPrompt,
          yolo: true,
          ...(workingDirectory && { workingDirectory }),
          ...(getCurrentApiKey() && { apiKey: getCurrentApiKey() }),
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }
      const data = await response.json();
      setChatResult(data.success ? data.data : `Error: ${data.error}`);
    } catch (error) {
      setChatResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (instruction: string) => {
    setChatPrompt(instruction);
    setShowTemplates(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
        MCP Gemini CLI Web Interface
      </h1>

      {/* Template Toggle */}
      <div className="mb-6 text-center">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
        >
          {showTemplates ? "テンプレートを閉じる" : "開発テンプレートを表示"}
        </button>
      </div>

      {/* Template Selector */}
      {showTemplates && (
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <TemplateSelector onTemplateSelect={handleTemplateSelect} />
        </div>
      )}

      {/* Working Directory Section */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <label
          htmlFor="workingDirectory"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Working Directory (Optional)
        </label>
        <input
          id="workingDirectory"
          type="text"
          value={workingDirectory}
          onChange={(e) => handleWorkingDirectoryChange(e.target.value)}
          placeholder="/path/to/working/directory"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Specify a working directory for gemini-cli execution. Values are
            automatically saved.
          </p>
          {workingDirectory && (
            <button
              type="button"
              onClick={() => handleWorkingDirectoryChange("")}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Gemini API Key Manager */}
      <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Gemini API Keys Management
          </h3>
          <button
            type="button"
            onClick={() => setShowApiKeyManager(!showApiKeyManager)}
            className="text-sm text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 underline"
          >
            {showApiKeyManager ? "Hide" : "Manage Keys"}
          </button>
        </div>

        {geminiApiKeys.length > 0 && (
          <div className="mb-3">
            <label
              htmlFor="api-key-selector"
              className="block text-xs text-gray-600 dark:text-gray-400 mb-1"
            >
              Current API Key ({geminiApiKeys.length} keys available):
            </label>
            <select
              id="api-key-selector"
              value={currentApiKeyIndex}
              onChange={(e) => switchApiKey(Number.parseInt(e.target.value))}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {geminiApiKeys.map((key, index) => (
                <option
                  key={`api-key-${key.substring(0, 8)}-${index}`}
                  value={index}
                >
                  Key #{index + 1}: {key.substring(0, 8)}...
                  {key.substring(key.length - 4)}
                </option>
              ))}
            </select>
          </div>
        )}

        {showApiKeyManager && (
          <div className="space-y-3 border-t border-yellow-200 dark:border-yellow-700 pt-3">
            <div className="flex gap-2">
              <input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter new Gemini API Key..."
                className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                onKeyPress={(e) => e.key === "Enter" && addApiKey()}
              />
              <button
                type="button"
                onClick={addApiKey}
                disabled={!newApiKey.trim()}
                className="px-4 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {geminiApiKeys.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Saved API Keys:
                </p>
                {geminiApiKeys.map((key, index) => (
                  <div
                    key={`api-key-item-${key.substring(0, 8)}-${index}`}
                    className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border"
                  >
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      #{index + 1}: {key.substring(0, 8)}...
                      {key.substring(key.length - 4)}
                      {index === currentApiKeyIndex && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                          Current
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeApiKey(index)}
                      className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {geminiApiKeys.length === 0
            ? "No API keys configured. Add keys to enable Gemini chat functionality."
            : `Using Key #${currentApiKeyIndex + 1}. Switch keys when rate limits are reached.`}
        </p>
      </div>

      {/* CLI Command Preview Section */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          CLI Command Preview
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Search Command Preview */}
          <div>
            <div className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Google Search Command:
            </div>
            <div className="p-3 bg-white dark:bg-gray-700 rounded border font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {searchCommandPreview.fullCommand}
              </pre>
            </div>
          </div>

          {/* Chat Command Preview */}
          <div>
            <div className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Gemini Chat Command:
            </div>
            <div className="p-3 bg-white dark:bg-gray-700 rounded border font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {chatCommandPreview.fullCommand}
              </pre>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          These commands show what will be executed when you click the Search or
          Chat buttons. API keys are shown as [CONFIGURED] for security.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Google Search Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Google Search
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search query..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="w-full bg-primary-500 text-white p-3 rounded-lg hover:bg-primary-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Searching..." : "Search"}
            </button>
            <div className="min-h-[200px] p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
              <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
                Search Result:
              </h3>
              <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-60 text-gray-600 dark:text-gray-300">
                {searchResult || "No search performed yet"}
              </pre>
            </div>
          </div>
        </div>

        {/* Gemini Chat Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Gemini Chat
          </h2>
          <div className="space-y-3">
            <textarea
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="Enter your prompt or select a template above..."
              rows={5}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button
              type="button"
              onClick={handleChat}
              disabled={loading || !chatPrompt.trim()}
              className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? "Chatting..."
                : `Send to Gemini${getCurrentApiKey() ? ` (Key #${currentApiKeyIndex + 1})` : " (No API Key)"}`}
            </button>
            <div className="min-h-[200px] p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
              <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
                Chat Response:
              </h3>
              <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-60 text-gray-600 dark:text-gray-300">
                {chatResult || "No chat performed yet"}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* CLI Command Preview Section */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          CLI Command Preview
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Search Command Preview */}
          <div>
            <div className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Google Search Command:
            </div>
            <div className="p-3 bg-white dark:bg-gray-700 rounded border font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {searchCommandPreview.fullCommand}
              </pre>
            </div>
          </div>

          {/* Chat Command Preview */}
          <div>
            <div className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Gemini Chat Command:
            </div>
            <div className="p-3 bg-white dark:bg-gray-700 rounded border font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {chatCommandPreview.fullCommand}
              </pre>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          These commands show the equivalent shell commands that represent the backend execution.
          Environment variables are set programmatically via Node.js spawn(), but shown as export commands for clarity.
          API keys are shown as [CONFIGURED] for security.
        </p>
      </div>

      <div className="mt-8 p-4 bg-primary-50 dark:bg-gray-800 rounded-lg border border-primary-200 dark:border-gray-700">
        <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
          API Endpoints:
        </h3>
        <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
          <li>
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
              POST /api/google-search
            </code>{" "}
            - Perform Google search
          </li>
          <li>
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
              POST /api/gemini-chat
            </code>{" "}
            - Chat with Gemini (supports custom API key)
          </li>
          <li>
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
              GET /api/google-search?query=...
            </code>{" "}
            - Search via GET
          </li>
          <li>
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
              GET /api/gemini-chat?prompt=...
            </code>{" "}
            - Chat via GET (supports apiKey parameter)
          </li>
        </ul>
        {geminiApiKeys.length > 0 && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            ✓ {geminiApiKeys.length} Gemini API key(s) configured
          </p>
        )}
      </div>
    </div>
  );
}
