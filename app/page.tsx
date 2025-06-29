"use client";

import { useState } from "react";
import TemplateSelector from "../components/TemplateSelector";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [chatPrompt, setChatPrompt] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [chatResult, setChatResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [workingDirectory, setWorkingDirectory] = useState("");

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
          onChange={(e) => setWorkingDirectory(e.target.value)}
          placeholder="/path/to/working/directory"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Specify a working directory for gemini-cli execution. Leave empty to
          use the default directory.
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
              {loading ? "Chatting..." : "Send to Gemini"}
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
            - Chat with Gemini
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
            - Chat via GET
          </li>
        </ul>
      </div>
    </div>
  );
}
