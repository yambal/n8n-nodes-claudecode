# Implementation Tasks

## Overview
- **Total Tasks**: 16
- **Estimated Complexity**: Medium-High
- **Dependencies**: child_process (Node.js built-in), n8n-workflow

## Task Hierarchy

### Task 1: プロジェクト構造セットアップ
- **Requirements**: 12.6
- **Preconditions**: None
- **Outputs**: ディレクトリ構造、アイコンファイル

#### Subtasks
- [ ] 1.1 `nodes/ClaudeCode/` ディレクトリと `nodes/ClaudeCode/utils/` サブディレクトリを作成
- [ ] 1.2 `icons/claude.svg` にClaude/Anthropicアイコンを作成

---

### Task 2: 型定義ファイル作成 [Parallel: 3, 4]
- **Requirements**: 1.1-1.6, 10.1-10.6, 11.1-11.5
- **Preconditions**: Task 1完了
- **Outputs**: `nodes/ClaudeCode/types.ts`

#### Subtasks
- [ ] 2.1 `CommandBuilderParams` インターフェース定義（モデル、プロンプト、セッション、ツール設定等）
- [ ] 2.2 `CommandBuilderResult` インターフェース定義（args配列、errors配列）
- [ ] 2.3 `ProcessOptions` インターフェース定義（cwd、timeout、env）
- [ ] 2.4 `ProcessResult` インターフェース定義（stdout、stderr、exitCode、timedOut）
- [ ] 2.5 `ParsedOutput` インターフェース定義（result、sessionId、messages、usage、raw、parseError）

---

### Task 3: ProcessRunner実装 [Parallel: 2, 4]
- **Requirements**: 1.1-1.6, 7.1-7.4, 11.1-11.5
- **Preconditions**: Task 1完了
- **Outputs**: `nodes/ClaudeCode/utils/processRunner.ts`

#### Subtasks
- [ ] 3.1 `runProcess()` 関数のシグネチャ定義（INode, args, options）
- [ ] 3.2 `child_process.spawn` を使用した Claude CLI 実行ロジック
- [ ] 3.3 stdout/stderr のストリーミングキャプチャ実装
- [ ] 3.4 タイムアウト処理の実装（timeout event + process.kill）
- [ ] 3.5 エラーハンドリング実装
  - [ ] 3.5.1 CLI_NOT_FOUND エラー（ENOENT検出 → NodeOperationError）
  - [ ] 3.5.2 TIMEOUT エラー（タイムアウト時 → NodeOperationError + partialOutput）
  - [ ] 3.5.3 EXECUTION_ERROR エラー（exitCode != 0 → NodeOperationError）

---

### Task 4: CommandBuilder実装 [Parallel: 2, 3]
- **Requirements**: 3.1-3.4, 4.1-4.4, 5.1-5.5, 6.1-6.6, 8.1-8.4, 9.1-9.3, 13.1-13.6
- **Preconditions**: Task 1完了
- **Outputs**: `nodes/ClaudeCode/utils/commandBuilder.ts`

#### Subtasks
- [ ] 4.1 `buildCommand()` 関数のシグネチャ定義
- [ ] 4.2 基本引数の構築（`-p`, `--output-format json`, prompt）
- [ ] 4.3 モデル設定の引数構築（`--model`）
- [ ] 4.4 システムプロンプト引数構築
  - [ ] 4.4.1 `--append-system-prompt` 対応
  - [ ] 4.4.2 `--system-prompt` 対応
  - [ ] 4.4.3 相互排他チェック
- [ ] 4.5 セッション管理引数構築
  - [ ] 4.5.1 `-c`（continue）対応
  - [ ] 4.5.2 `--resume` / `--session-id` 対応
  - [ ] 4.5.3 `--fork-session` 対応
- [ ] 4.6 ツール制御引数構築
  - [ ] 4.6.1 `--tools` 対応（preset/custom）
  - [ ] 4.6.2 `--allowedTools` 対応
  - [ ] 4.6.3 `--disallowedTools` 対応
- [ ] 4.7 エージェント制御引数構築（`--max-turns`, `--agents`, `--verbose`）
- [ ] 4.8 MCP設定引数構築（`--mcp-config`, `--permission-mode`）
- [ ] 4.9 高度なオプション引数構築
  - [ ] 4.9.1 `--debug`, `--fallback-model`, `--json-schema` 対応
  - [ ] 4.9.2 `--betas`, `--add-dir` 対応
  - [ ] 4.9.3 `--dangerously-skip-permissions` 対応（警告ログ出力）
  - [ ] 4.9.4 extraFlags のパース・追加

---

### Task 5: OutputParser実装
- **Requirements**: 10.1-10.6
- **Preconditions**: Task 2完了（型定義）
- **Outputs**: `nodes/ClaudeCode/utils/outputParser.ts`

#### Subtasks
- [ ] 5.1 `parseOutput()` 関数のシグネチャ定義
- [ ] 5.2 JSON.parse によるメイン解析ロジック
- [ ] 5.3 主要フィールド抽出（result, sessionId, messages, usage）
- [ ] 5.4 フォールバック処理（パース失敗時は raw + parseError を返す）

---

### Task 6: ClaudeCodeNode パラメータ定義
- **Requirements**: 2.1-2.4, 3.1-3.4, 4.1-4.4, 5.1-5.5, 6.1-6.6, 7.1-7.4, 8.1-8.4, 9.1-9.3, 12.1-12.6, 13.1-13.6
- **Preconditions**: Task 2完了（型定義）
- **Outputs**: `nodes/ClaudeCode/ClaudeCode.node.ts`（properties部分）

#### Subtasks
- [ ] 6.1 基本設定パラメータ定義
  - [ ] 6.1.1 prompt（required, string, rows: 4）
  - [ ] 6.1.2 workingDirectory（string）
- [ ] 6.2 モデル設定パラメータ定義
  - [ ] 6.2.1 model（options: Default/Sonnet/Opus/Haiku/Custom）
  - [ ] 6.2.2 customModel（displayOptions連動）
- [ ] 6.3 システムプロンプトパラメータ定義
  - [ ] 6.3.1 systemPromptMode（options: none/append/replace）
  - [ ] 6.3.2 systemPrompt（displayOptions連動）
- [ ] 6.4 セッション設定パラメータ定義
  - [ ] 6.4.1 sessionMode（options: new/continue/resume）
  - [ ] 6.4.2 sessionId, forkSession（displayOptions連動）
- [ ] 6.5 ツール制御パラメータ定義
  - [ ] 6.5.1 toolControl（options: default/preset/custom/allow/deny/none）
  - [ ] 6.5.2 toolPreset（5種類のプリセット）
  - [ ] 6.5.3 tools, allowedTools, disallowedTools（displayOptions連動）
- [ ] 6.6 エージェント制御パラメータ定義（maxTurns, customAgents）
- [ ] 6.7 MCP設定パラメータ定義（mcpConfigPath, permissionMode）
- [ ] 6.8 高度な設定（additionalOptions collection）
  - [ ] 6.8.1 timeout, verbose, debug
  - [ ] 6.8.2 fallbackModel, jsonSchema, betas
  - [ ] 6.8.3 additionalDirs, skipPermissions, extraFlags

---

### Task 7: ClaudeCodeNode メイン実装
- **Requirements**: 1.1-1.6, 11.1-11.5, 12.1-12.6
- **Preconditions**: Task 3, 4, 5, 6完了
- **Outputs**: `nodes/ClaudeCode/ClaudeCode.node.ts`（execute部分）

#### Subtasks
- [ ] 7.1 INodeTypeDescription メタデータ定義
  - [ ] 7.1.1 displayName, name, icon, group, version
  - [ ] 7.1.2 description, defaults, inputs, outputs
  - [ ] 7.1.3 usableAsTool: true
- [ ] 7.2 `execute()` メソッド実装
  - [ ] 7.2.1 入力データ取得（getInputData, getNodeParameter）
  - [ ] 7.2.2 パラメータからCommandBuilderParams構築
  - [ ] 7.2.3 buildCommand() 呼び出し
  - [ ] 7.2.4 runProcess() 呼び出し
  - [ ] 7.2.5 parseOutput() 呼び出し
  - [ ] 7.2.6 INodeExecutionData[] 形式で結果返却
- [ ] 7.3 エラーハンドリング統合
  - [ ] 7.3.1 try-catch でNodeOperationErrorをキャッチ
  - [ ] 7.3.2 continueOnFail() パターン実装
- [ ] 7.4 複数入力アイテム対応（forループ処理）

---

### Task 8: ノードメタデータファイル作成
- **Requirements**: 12.5, 12.6
- **Preconditions**: Task 7完了
- **Outputs**: `nodes/ClaudeCode/ClaudeCode.node.json`

#### Subtasks
- [ ] 8.1 n8n codex メタデータJSON作成
  - [ ] 8.1.1 node (name), nodeVersion, codexVersion
  - [ ] 8.1.2 categories, resources (primaryDocumentation)
  - [ ] 8.1.3 subcategories, alias

---

### Task 9: package.json更新
- **Requirements**: 12.6
- **Preconditions**: Task 7, 8完了
- **Outputs**: `package.json` 更新

#### Subtasks
- [ ] 9.1 n8n.nodes 配列に `dist/nodes/ClaudeCode/ClaudeCode.node.js` を追加
- [ ] 9.2 keywords に適切なタグ追加（claude, anthropic, ai, cli等）

---

### Task 10: CommandBuilder ユニットテスト
- **Requirements**: 3.1-3.4, 4.1-4.4, 5.1-5.5, 6.1-6.6
- **Preconditions**: Task 4完了
- **Outputs**: テストファイル

#### Subtasks
- [ ] 10.1 基本引数生成テスト（prompt, -p, --output-format）
- [ ] 10.2 モデル設定テスト（各モデルオプション）
- [ ] 10.3 システムプロンプトテスト（append/replace/相互排他エラー）
- [ ] 10.4 セッション管理テスト（new/continue/resume）
- [ ] 10.5 ツール制御テスト（preset/custom/allow/deny）
- [ ] 10.6 高度なオプションテスト

---

### Task 11: OutputParser ユニットテスト
- **Requirements**: 10.1-10.6
- **Preconditions**: Task 5完了
- **Outputs**: テストファイル

#### Subtasks
- [ ] 11.1 正常JSON解析テスト
- [ ] 11.2 不正JSON解析テスト（フォールバック確認）
- [ ] 11.3 空出力テスト
- [ ] 11.4 主要フィールド抽出テスト（result, sessionId, usage）

---

### Task 12: ProcessRunner ユニットテスト
- **Requirements**: 1.1-1.6, 11.1-11.5
- **Preconditions**: Task 3完了
- **Outputs**: テストファイル

#### Subtasks
- [ ] 12.1 正常実行テスト（モックCLI）
- [ ] 12.2 CLI_NOT_FOUND エラーテスト
- [ ] 12.3 タイムアウトテスト
- [ ] 12.4 EXECUTION_ERROR テスト（非ゼロ終了コード）

---

### Task 13: 統合テスト
- **Requirements**: 全要件
- **Preconditions**: Task 10, 11, 12完了
- **Outputs**: テストファイル

#### Subtasks
- [ ] 13.1 Node全体の実行フローテスト（モックCLI）
- [ ] 13.2 エラー伝播テスト
- [ ] 13.3 continueOnFail パターンテスト

---

### Task 14: ビルド・リント確認
- **Requirements**: 12.6
- **Preconditions**: Task 9完了
- **Outputs**: ビルド成功

#### Subtasks
- [ ] 14.1 `npm run build` 実行・エラー修正
- [ ] 14.2 `npm run lint` 実行・エラー修正
- [ ] 14.3 `npm run lintfix` で自動修正可能な問題を解決

---

### Task 15: 手動E2Eテスト
- **Requirements**: 全要件
- **Preconditions**: Task 14完了、Claude CLIインストール済み
- **Outputs**: 動作確認結果

#### Subtasks
- [ ] 15.1 実際のClaude CLIでの基本実行確認
- [ ] 15.2 各パラメータグループの動作確認
- [ ] 15.3 セッション継続・再開の動作確認
- [ ] 15.4 エラーケースの動作確認

---

### Task 16: ドキュメント更新
- **Requirements**: 12.6
- **Preconditions**: Task 15完了
- **Outputs**: README更新

#### Subtasks
- [ ] 16.1 README.md にノード使用方法を追記
- [ ] 16.2 必要な前提条件（Claude CLIインストール）を記載
- [ ] 16.3 パラメータ説明・サンプルワークフローを記載

---

## Dependency Graph

```
Task 1 (プロジェクト構造)
    ├─→ Task 2 (型定義) ─┬─→ Task 5 (OutputParser)
    ├─→ Task 3 (ProcessRunner) ─┤
    └─→ Task 4 (CommandBuilder) ─┘
                              ↓
                        Task 6 (パラメータ定義)
                              ↓
                        Task 7 (メイン実装)
                              ↓
                        Task 8 (メタデータ)
                              ↓
                        Task 9 (package.json)
                              ↓
             ┌────────────────┼────────────────┐
             ↓                ↓                ↓
        Task 10 (Cmd Test)  Task 11 (Out Test)  Task 12 (Proc Test)
             └────────────────┼────────────────┘
                              ↓
                        Task 13 (統合テスト)
                              ↓
                        Task 14 (ビルド・リント)
                              ↓
                        Task 15 (手動E2E)
                              ↓
                        Task 16 (ドキュメント)
```

## Parallel Execution Notes
- **Task 2, 3, 4**: 型定義、ProcessRunner、CommandBuilder は並列実装可能
- **Task 10, 11, 12**: ユニットテストは並列実行可能

## Implementation Priority
1. **Critical Path**: 1 → 2/3/4 → 5 → 6 → 7 → 8 → 9 → 14
2. **Quality Gates**: 10-13（テスト）、15（E2E）
3. **Documentation**: 16（最終段階）
