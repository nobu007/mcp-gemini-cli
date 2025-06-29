"use client";

import { useState } from "react";
import {
  customInstructionTemplates,
  type CustomInstructionTemplate,
} from "./templates";

interface TemplateSelectorProps {
  onTemplateSelect: (instruction: string) => void;
}

const categoryColors = {
  "ci-cd": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  testing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "code-review":
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  security: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  optimization:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  documentation:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
};

export default function TemplateSelector({
  onTemplateSelect,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const categories = Array.from(
    new Set(customInstructionTemplates.map((t) => t.category)),
  );

  const filteredTemplates =
    selectedCategory === "all"
      ? customInstructionTemplates
      : customInstructionTemplates.filter(
          (t) => t.category === selectedCategory,
        );

  const handleTemplateSelect = (template: CustomInstructionTemplate) => {
    onTemplateSelect(template.instruction);
  };

  const toggleExpanded = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          カスタムインストラクション テンプレート
        </h3>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-primary-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            すべて
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-primary-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 leading-tight">
                  {template.title}
                </h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[template.category]}`}
                >
                  {template.category}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {template.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded">
                    +{template.tags.length - 3}
                  </span>
                )}
              </div>

              {/* Expanded content */}
              {expandedTemplate === template.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {template.instruction}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className="flex-1 bg-primary-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  このテンプレートを使用
                </button>
                <button
                  type="button"
                  onClick={() => toggleExpanded(template.id)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {expandedTemplate === template.id ? "閉じる" : "詳細"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
