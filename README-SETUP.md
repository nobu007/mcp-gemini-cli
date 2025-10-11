# MCP Gemini CLI サーバーのセットアップ方法

## 概要

このドキュメントは、MCP Gemini CLI サーバーを事前起動する運用に変更する手順をまとめたものです。

## 変更内容

- **変更前**: `npx tsx watch index.ts` で毎回起動
- **変更後**: ビルド済みの `dist/index.js` を使用して事前起動

## セットアップ手順

### 1. プロジェクトのビルド

```bash
cd /home/jinno/mcp-gemini-cli
bun run build
```

### 2. 起動方法

#### オプションA: 手動起動（推奨）

```bash
# サーバーを起動
./start-mcp-server.sh start

# ステータス確認
./start-mcp-server.sh status

# サーバーを停止
./start-mcp-server.sh stop

# サーバーを再起動
./start-mcp-server.sh restart
```

#### オプションB: systemd による自動起動

```bash
# サービスファイルをコピー
sudo cp mcp-gemini-cli.service /etc/systemd/system/

# systemd をリロード
sudo systemctl daemon-reload

# サービスを有効化（システム起動時に自動起動）
sudo systemctl enable mcp-gemini-cli

# サービスを開始
sudo systemctl start mcp-gemini-cli

# ステータス確認
sudo systemctl status mcp-gemini-cli

# ログ確認
journalctl -u mcp-gemini-cli -f
```

### 3. Claude Code の設定

`.claude.json` の `mcpServers` セクションが以下のように設定されていることを確認:

```json
{
  "mcpServers": {
    "gemini-cli-mcp": {
      "command": "bun",
      "args": [
        "run",
        "dist/index.js"
      ],
      "cwd": "/home/jinno/mcp-gemini-cli"
    }
  }
}
```

### 4. 接続テスト

Claude Code で `/mcp` コマンドを実行して、`gemini-cli-mcp` が接続できることを確認します。

## トラブルシューティング

### 接続できない場合

1. サーバーが起動しているか確認:

   ```bash
   ./start-mcp-server.sh status
   ```

2. ログを確認:

   ```bash
   tail -f /home/jinno/mcp-gemini-cli/mcp-server.log
   ```

3. ビルドが最新か確認:

   ```bash
   bun run build
   ./start-mcp-server.sh restart
   ```

### ポートが既に使用されている場合

既存のプロセスを確認:

```bash
ps aux | grep -E "(tsx|node.*index)" | grep mcp-gemini-cli
```

不要なプロセスを終了:

```bash
killall -9 tsx
```

## ディレクトリ構造

```text
/home/jinno/mcp-gemini-cli/
├── dist/                      # ビルド出力
│   ├── index.js              # メインサーバー
│   └── cli.js                # CLI ツール
├── start-mcp-server.sh       # 起動スクリプト
├── mcp-gemini-cli.service    # systemd サービスファイル
├── mcp-server.log            # サーバーログ
└── .mcp-server.pid           # プロセスID
```

## 開発時の注意事項

コードを変更した場合は、必ずビルドして再起動してください:

```bash
bun run build
./start-mcp-server.sh restart
```

## 参考リンク

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code Documentation](https://docs.claude.com/)
