# 実装チェックリスト

## Claude Code Node 実装手順

### Phase 1: 基盤構築

- [ ] **1.1 ディレクトリ作成**
  ```
  nodes/ClaudeCode/
  nodes/ClaudeCode/utils/
  ```

- [ ] **1.2 アイコン作成**
  - `icons/claude.svg` を作成
  - Claude/Anthropicブランドに準拠

- [ ] **1.3 型定義ファイル作成**
  - `nodes/ClaudeCode/types.ts`
  - 全インターフェース定義

### Phase 2: ユーティリティ実装

- [ ] **2.1 ProcessRunner**
  - `nodes/ClaudeCode/utils/processRunner.ts`
  - `child_process.spawn` でCLI実行
  - タイムアウト処理
  - エラーハンドリング（CLI_NOT_FOUND, TIMEOUT, EXECUTION_ERROR）

- [ ] **2.2 CommandBuilder**
  - `nodes/ClaudeCode/utils/commandBuilder.ts`
  - パラメータからCLI引数配列を構築
  - `-p`, `--output-format json` は必須
  - オプション引数の条件付き追加

- [ ] **2.3 OutputParser**
  - `nodes/ClaudeCode/utils/outputParser.ts`
  - JSON出力のパース
  - フォールバック処理（パース失敗時）

### Phase 3: ノード実装

- [ ] **3.1 パラメータ定義**
  - 基本設定（prompt, workingDirectory）
  - モデル設定（model, customModel）
  - システムプロンプト（systemPromptMode, systemPrompt）
  - セッション設定（sessionMode, sessionId, forkSession）
  - ツール制御（toolControl, toolPreset, tools, allowedTools, disallowedTools）
  - エージェント制御（maxTurns, customAgents）
  - MCP設定（mcpConfigPath, permissionMode）
  - 高度な設定（additionalOptions collection）

- [ ] **3.2 execute() メソッド**
  - 入力データ取得
  - パラメータ取得
  - CommandBuilder呼び出し
  - ProcessRunner呼び出し
  - OutputParser呼び出し
  - 結果返却

- [ ] **3.3 エラーハンドリング**
  - try-catch でエラーキャッチ
  - continueOnFail() パターン実装
  - 適切なエラーメッセージ

### Phase 4: 統合・登録

- [ ] **4.1 メタデータファイル**
  - `nodes/ClaudeCode/ClaudeCode.node.json`

- [ ] **4.2 package.json 更新**
  - `n8n.nodes` に追加

### Phase 5: テスト・品質

- [ ] **5.1 ビルド確認**
  ```bash
  npm run build
  ```

- [ ] **5.2 リント確認**
  ```bash
  npm run lint
  npm run lint:fix
  ```

- [ ] **5.3 ローカルテスト**
  ```bash
  npm run dev
  ```
  - ブラウザで http://localhost:5678 を開く
  - Claude Code ノードを検索・追加
  - 各パラメータの動作確認
  - 実際のCLI実行テスト

### Phase 6: ドキュメント

- [ ] **6.1 README.md 更新**
  - インストール方法
  - 前提条件（Claude CLI必要）
  - 使用方法
  - パラメータ説明

---

## コード品質チェックリスト

### TypeScript
- [ ] `strict: true` でエラーなし
- [ ] `any` 型の使用を最小限に
- [ ] すべての関数に適切な型定義

### n8n規約
- [ ] クラス名とファイル名が一致
- [ ] `displayName` と `name` が適切
- [ ] `description` に説明文を含む
- [ ] `displayOptions` で条件付き表示

### セキュリティ
- [ ] 危険なオプションに警告表示
- [ ] 入力値のバリデーション
- [ ] タイムアウト設定

### エラーハンドリング
- [ ] すべてのエラーパスをカバー
- [ ] `continueOnFail()` をサポート
- [ ] 明確なエラーメッセージ

---

## テストケース

### 基本機能
- [ ] シンプルなプロンプト実行
- [ ] 日本語プロンプト
- [ ] 複数行プロンプト

### オプション
- [ ] モデル選択（sonnet, opus, haiku, custom）
- [ ] システムプロンプト（append, replace）
- [ ] ツール制御（各モード）
- [ ] セッション管理（new, continue, resume）

### エラーケース
- [ ] 空のプロンプト → バリデーションエラー
- [ ] claudeコマンド未インストール → CLI_NOT_FOUND
- [ ] タイムアウト → TIMEOUT エラー
- [ ] 無効な作業ディレクトリ → エラー

### n8n統合
- [ ] 前ノードからのデータ参照（式入力）
- [ ] 複数入力アイテムの処理
- [ ] 後続ノードへのデータ渡し
