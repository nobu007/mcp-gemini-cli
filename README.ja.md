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

## 開発サーバーの起動

開発用にWebサーバーを起動するには、次のコマンドを実行します。

```bash
bun run web:dev
```

### プロセス管理

サーバーをバックグラウンドで永続的に実行したい場合は、`pm2`のようなプロセス管理ツールを使用できます。

```bash
# pm2をインストール（未インストールの場合）
npm install -g pm2

# アプリケーションを起動
pm2 start bun --name mcp-gemini-cli -- run web:dev
```

### ローカルサーバーへの接続 (ClaudeCode)

`bun run web:dev` で起動したローカルサーバーのAPIを `ClaudeCode` から利用するには、設定ファイルにツール定義を追記します。

以下の例では、`gemini-chat` API (`http://localhost:3000/api/gemini-chat`) を `gemini-local` という名前のツールとして定義します。

**設定例:**

```json
"gemini-local": {
  "type": "sse",
  "url": "http://localhost:3000/api/gemini-chat"
}
```

**注意:** この設定を有効にするには、APIがSSE (Server-Sent Events) 形式で応答をストリーミングする必要があります。後続のステップでAPIを改修します。

**プロンプト例:**

```text
gemini-local JavaScriptのasync/awaitとPromiseの違いを説明させて
```

同様に、`gemini-command` APIを呼び出すツールも定義できます。

**設定例:**

```json
"gemini-command-local": {
  "type": "sse",
  "url": "http://localhost:3000/api/gemini-command"
}
```

## 📚 ドキュメント

- [**利用ガイド**](./docs/USAGE.md)
- [**APIリファレンス**](./docs/API.md)
- [**アーキテクチャ**](./docs/ARCHITECTURE.md)

## 🤝 コントリビューション

コントリビューションを歓迎します！詳細は[**コントリビューションガイド**](./CONTRIBUTING.md)をご覧ください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。
