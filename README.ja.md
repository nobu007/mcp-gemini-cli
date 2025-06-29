# MCP Gemini CLI

GoogleのGemini CLIをラップするシンプルなMCPサーバーです。AIアシスタントがModel Context Protocolを通じてGeminiの機能を利用できるようにします。

## ✨ 主な機能

- **Google検索**: Geminiを使用してGoogle検索を実行します。
- **Geminiチャット**: Geminiと直接対話します。
- **デュアルモード**: MCPサーバーと、UIおよびAPIを備えた標準的なWebサーバーの両方として動作します。

## 🚀 クイックスタート

`npx` を使って、ローカルにインストールすることなくサーバーを実行できます。

```bash
claude mcp add -s project gemini-cli -- npx @nobu007/mcp-gemini-cli --allow-npx
```

**プロンプト例:**

- **検索**: `Googleで最新のTypeScript 5.0の機能について検索して`
- **チャット**: `JavaScriptのasync/awaitとPromiseの違いをGeminiに説明させて`

ローカルでのセットアップなど、より詳細な手順については、[**利用ガイド**](./docs/USAGE.md)をご覧ください。

## 📚 ドキュメント

- [**利用ガイド**](./docs/USAGE.md)
- [**APIリファレンス**](./docs/API.md)
- [**アーキテクチャ**](./docs/ARCHITECTURE.md)

## 🤝 コントリビューション

コントリビューションを歓迎します！詳細は[**コントリビューションガイド**](./CONTRIBUTING.md)をご覧ください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。
