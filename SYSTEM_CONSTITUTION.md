# MCP Gemini CLI システム憲法 V1.0

## 🎯 **明確な技術的境界線**

### **原則: シンプルであることの厳密な定義**

## MCP Gemini CLI = Google Gemini CLIをModel Context Protocol (MCP)経由でAIアシスタントが利用できるようにする単純なラッパーサーバー

これ以外の機能は一切認めない。

### **厳格な禁止リスト（絶対）**

#### 🔒 **完全禁止カテゴリー**

- [ ] **AI機能の内包** - 独自のAI処理、推論エンジン、チャットボット
- [ ] **検索エンジン機能** - 独自のGoogle検索実装、検索結果キャッシュ、検索履歴
- [ ] **認証・認可システム** - ユーザー管理、APIキー管理、権限制御
- [ ] **データベース** - 永続化ストレージ、会話履歴、ユーザーデータ
- [ ] **複雑なUI** - リッチなWebインターフェース、管理画面、ダッシュボード
- [ ] **複数AIプロバイダ対応** - OpenAI、Anthropic、その他AIモデルのサポート
- [ ] **高度なプロンプト管理** - プロンプトテンプレート、プロンプトチェーン
- [ ] **レートリミット・クォータ管理** - 使用制限、課金、使用量監視
- [ ] **ロギング・監視** - 詳細なログ収集、パフォーマンス監視、エラートラッキング
- [ ] **セッション管理** - 会話状態の保持、コンテキスト管理

### **許可される機能（ホワイトリスト方式）**

#### ✅ **コア機能（明確に定義）**

```typescript
// 許可される処理の例：
class MCPGeminiServer {
  /**
   * MCPサーバーとしての基本的な機能
   * 入力: MCPリクエスト (tool calls)
   * 出力: Gemini CLIのレスポンス
   */
  async handleToolCall(toolCall: MCPToolCall): Promise<MCPResult> {
    // ✅ 許可される処理：
    // - MCPプロトコルのリクエスト受信
    // - Google Searchツール呼び出し (gemini google-search)
    // - Gemini Chatツール呼び出し (gemini chat)
    // - Gemini CLIプロセスの実行と結果取得
    // - MCP形式でのレスポンス返却
    // - 簡単なエラーハンドリング

    // ❌ 禁止される処理：
    // - 独自のAI処理や推論
    // - 検索結果の加工やキャッシュ
    // - 会話状態の保持
    // - 複雑なビジネスロジック
    pass
  }

  async startServer(port: number = 3000): Promise<void> {
    // ✅ 許可される処理：
    // - HTTPサーバーの起動
    // - MCPエンドポイントの設定 (/api/mcp)
    // - CORSヘッダーの基本設定
    // - シンプルなヘルスチェック

    // ❌ 禁止される処理：
    // - 複雑なミドルウェア設定
    // - 認証・認可処理
    // - リクエストの詳細なバリデーション
    pass
  }
}
```

#### ✅ **許可される依存関係**

```json
{
  "dependencies": {
    // MCPプロトコル（必須）
    "@modelcontextprotocol/sdk": "^0.4.0",

    // HTTPサーバー（最小限）
    "express": "^4.18.0",
    "cors": "^2.8.5",

    // 子プロセス実行（必須）
    "child_process": "built-in",

    // Node.js基本モジュールのみ
    // - http, https, url, path, fs, util
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "nodemon": "^3.0.0"
  }
}

// 明確に禁止する依存関係：
// - AIライブラリ (openai, anthropic, google-genai)
// - データベースライブラリ (mongodb, prisma, sequelize)
// - 認証ライブラリ (passport, jsonwebtoken, bcrypt)
// - キャッシュライブラリ (redis, node-cache)
// - ロギングライブラリ (winston, pino, morgan)
// - ORMライブラリ、OQM、複雑なデータ操作ライブラリ
```

### **実装制約（絶対遵守）**

#### 📁 **ディレクトリ構造の制約**

```text
src/
├── server/
│   ├── mcp-server.ts            # ✅ MCPサーバーの主要ロジック
│   ├── tool-handlers.ts         # ✅ ツール呼び出し処理
│   └── gemini-client.ts         # ✅ Gemini CLI呼び出しラッパー
├── tools/
│   ├── google-search.ts         # ✅ Google Searchツール
│   └── gemini-chat.ts           # ✅ Gemini Chatツール
└── utils/
    ├── mcp-utils.ts             # ✅ MCPプロトコルユーティリティ
    └── response-formatter.ts    # ✅ レスポンス整形
```

**禁止**:

- `auth/`, `users/`, `sessions/` ディレクトリ
- `database/`, `cache/`, `storage/` ディレクトリ
- `ui/`, `dashboard/`, `admin/` ディレクトリ
- `logging/`, `monitoring/`, `analytics/` ディレクトリ
- `prompts/`, `ai/`, `intelligence/` ディレクトリ

#### 🔄 **処理フローの制約**

```typescript
// 許可される単純な処理フロー：
1. MCPクライアントからツール呼び出しリクエスト受信
2. ツールタイプを判定 (google-search or gemini-chat)
3. Gemini CLIプロセスを起動し、引数を渡して実行
4. 標準出力から結果を取得
5. MCPプロトコル形式でレスポンスを返却
6. プロセスを終了

// 禁止される処理：
- 独自のAI処理や内容の分析
- 検索結果の永続化やキャッシュ
- 会話コンテキストの保持
- 複数のリクエストを連携させる処理
- ユーザーの特定や認証
```

#### 📏 **コード規模の制約**

```text
制限:
- 総ファイル数: 10ファイル以下
- 総コード行数: 800行以下
- 1ファイルあたり: 150行以下
- 1関数あたり: 30行以下
- 1クラスあたり: 120行以下
```

### **厳格なレビュープロセス**

#### ✅ **全機能追加は以下のチェックに通過必須**

1. **単一目的テスト**: この機能はMCPブリッジにのみ使用されるか？
2. **シンプル性テスト**: この機能は単一関数で実装可能か？
3. **プロキシテスト**: Gemini CLIへの単純なプロキシ機能か？
4. **独立性テスト**: 独自の処理ロジックを含まないか？
5. **MCP準拠テスト**: MCPプロトコル仕様に準拠しているか？

#### ❌ **自動リジェクト条件**

- `ai/`, `intelligence/`, `llm/` などのAI機能名前
- `auth/`, `user/`, `session/` などの認証関連名前
- `database/`, `cache/`, `storage/` などの永続化名前
- `ui/`, `dashboard/`, `admin/` などのUI関連名前
- 1ファイルが150行を超える実装
- 独自のAI処理や推論ロジック
- データの永続化やキャッシュ機能
- 複雑なエラーハンドリングやリトライ処理

### **監視と強制**

#### 🔍 **自動違反検出**

```bash
# CI/CDで実行する憲法違反チェック：
find src/ -name "*.ts" | xargs wc -l | awk '$1 > 150 && $2 != "total"' && exit 1  # ファイルサイズ制限
find src/ -name "*ai*" -o -name "*intelligence*" -o -name "*llm*" && exit 1  # AI機能禁止
find src/ -name "*auth*" -o -name "*user*" -o -name "*session*" && exit 1  # 認証機能禁止
find src/ -name "*database*" -o -name "*cache*" -o -name "*storage*" && exit 1  # 永続化禁止
grep -r "openai\|anthropic\|google-genai" src/ && exit 1  # 外部AIライブラリ禁止
grep -r "mongodb\|redis\|sqlite" src/ && exit 1  # データベースライブラリ禁止
```

#### 📊 **メトリクス監視**

- **ファイル数**: 10ファイルを超えたら警告
- **コード行数**: 800行を超えたら警告
- **依存関係**: 8ライブラリを超えたら警告
- **レスポンスタイム**: MCPリクエストが30秒を超えたら警告

### **歴史的経緯と教訓**

#### ⚠️ **肥大化の予防**

多くのMCPサーバーが以下の機能追加により複雑化した：

1. **AI機能の内包**: 独自の推論エンジン、チャットボット機能
2. **認証システム**: ユーザー管理、APIキー管理、権限制御
3. **データベース**: 会話履歴、キャッシュ、設定の永続化
4. **複雑なUI**: 管理画面、ダッシュボード、モニタリング機能
5. **複数AIプロバイダ**: OpenAI、Anthropicなど多様なAIモデル対応
6. **高度な機能**: レートリミット、ロギング、監視

#### 🎯 **本来の目的に固執**

MCPブリッジという本来の目的に徹し、Gemini CLIへの単純なプロキシ機能に集中する。

## 違反時の対応

### 🚨 **違反検出時の即時対応**

1. 該当コードの即時削除
2. 憲法違反レポートの提出
3. 再発防止策の策定

### ⚡ **即時修正**

違反は記録せず、即時修正する。肥大化を招く記録は禁止。

---

**この憲法は、MCP Gemini CLIが永遠にシンプルで単一目的なMCPブリッジであり続けることを保証する。**

*制定日: 2025-12-13*
*改正: V1.0 - MCPブリッジとしてのシンプルさを維持*
