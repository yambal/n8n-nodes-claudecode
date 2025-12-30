# Research & Design Decisions

## Summary
- **Feature**: `n8n-claude-node`
- **Discovery Scope**: New Feature（新規機能開発）
- **Key Findings**:
  - n8nノードは命令的（Imperative）スタイルで`execute()`メソッドを実装する方式が最適
  - Claude Code CLIは`-p --output-format json`で構造化JSON出力を返す
  - n8n v2.0以降、Execute Commandノードはセキュリティ上の理由でデフォルト無効化されているため、カスタムノードでの実装が有効

## Research Log

### n8nノード実装パターン
- **Context**: n8nカスタムノードの実装方式を調査
- **Sources Consulted**:
  - 既存テンプレートコード（Example.node.ts, GithubIssues.node.ts）
  - [n8n Custom Node Documentation](https://docs.n8n.io/integrations/creating-nodes/overview/)
  - [n8n Community Nodes Guide](https://docs.n8n.io/integrations/community-nodes/build-community-nodes/)
- **Findings**:
  - **命令的（Imperative）スタイル**: `execute()`メソッドで完全な制御が可能、Example.node.tsがサンプル
  - **宣言的（Declarative）スタイル**: `requestDefaults`と`routing`で定義、GithubIssues.node.tsがサンプル
  - CLIプロセス実行には命令的スタイルが必須
  - `INodeType`インターフェース、`INodeTypeDescription`、`IExecuteFunctions`が主要型
  - `this.getNodeParameter()`でパラメータ取得、`this.getInputData()`で入力データ取得
  - エラーハンドリングは`NodeOperationError`と`continueOnFail()`パターン
- **Implications**:
  - Claude Code Nodeは命令的スタイルで実装
  - Example.node.tsのパターンをベースに拡張

### Claude Code CLI出力形式
- **Context**: CLIのJSON出力形式を調査してパース設計に反映
- **Sources Consulted**:
  - [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference)
  - [ClaudeLog FAQ](https://claudelog.com/faqs/what-is-output-format-in-claude-code/)
- **Findings**:
  - `--output-format json`: 完了後に構造化JSONを出力
  - `--output-format stream-json`: リアルタイムストリーミングJSON
  - JSON出力構造（推定）:
    ```json
    {
      "messages": [...],
      "result": {
        "content": [{"type": "text", "text": "..."}]
      },
      "session_id": "..."
    }
    ```
  - 正確なスキーマは公式ドキュメントに明記されていない
  - 実行時に動的にフィールドを抽出する設計が必要
- **Implications**:
  - 出力パースは柔軟性を持たせる設計
  - 主要フィールド（result, session_id）を優先的に抽出
  - 不明なフィールドも保持して後続ノードに渡す

### Node.js child_process実装
- **Context**: CLIプロセス実行の最適な方法を調査
- **Sources Consulted**:
  - [Node.js child_process Documentation](https://nodejs.org/api/child_process.html)
  - [n8n-nodes-custom-exec](https://libraries.io/npm/n8n-nodes-custom-exec)
  - [n8n-nodes-powershell](https://github.com/StarfallProjects/n8n-nodes-powershell)
- **Findings**:
  - `spawn`: ストリーミング出力に適する、大量出力に対応
  - `exec`: バッファリング出力、シンプルだが出力サイズ制限あり
  - `execPromise`: n8n内部でも使用されるPromise化されたexec
  - タイムアウト設定が重要（Claude Codeは長時間実行の可能性）
  - n8n v2.0でExecute Commandがデフォルト無効化された背景
- **Implications**:
  - `spawn`を使用してストリーミング出力に対応
  - stdoutとstderrを別々にキャプチャ
  - タイムアウトはユーザー設定可能（デフォルト5分）

### n8n v2.0セキュリティ考慮
- **Context**: n8n v2.0でのコマンド実行ノードの変更を調査
- **Sources Consulted**:
  - [n8n Community Forum](https://community.n8n.io/)
  - [n8n Execute Command Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executecommand/)
- **Findings**:
  - Execute Commandノードはv2.0でデフォルト無効
  - セキュリティリスク（任意コマンド実行）が理由
  - カスタムノードとして実装することで明示的なインストールが必要
  - ユーザーは意図的にノードをインストールするため、リスクを理解している前提
- **Implications**:
  - セキュリティ警告をノードの説明に含める
  - `--dangerously-skip-permissions`オプションには追加警告

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 命令的スタイル（Imperative） | execute()でchild_process実行 | 完全な制御、ストリーミング対応可能 | コード量が多い | **選択** |
| 宣言的スタイル（Declarative） | routing定義でHTTPリクエスト | コード量少ない | CLI実行に不適、ストリーミング不可 | 却下 |
| n8n Execute Command利用 | 既存ノードをラップ | 実装簡単 | v2.0でデフォルト無効、依存性 | 却下 |

## Design Decisions

### Decision: 命令的スタイルでの実装
- **Context**: Claude Code CLIを実行するための最適な実装方式
- **Alternatives Considered**:
  1. 命令的スタイル — execute()メソッドでchild_process.spawn実行
  2. 宣言的スタイル — HTTP APIを前提としたrouting定義
  3. Execute Commandラッパー — 既存ノードへの依存
- **Selected Approach**: 命令的スタイルでchild_process.spawnを使用
- **Rationale**:
  - CLI実行にはプロセス制御が必要
  - ストリーミング出力の将来対応が可能
  - 既存のExample.node.tsパターンを踏襲
- **Trade-offs**: コード量は増えるが、完全な制御と拡張性を確保
- **Follow-up**: ストリーミング出力対応は将来拡張として検討

### Decision: spawn vs exec
- **Context**: child_processのどのメソッドを使用するか
- **Alternatives Considered**:
  1. spawn — ストリーミング出力、大量データ対応
  2. exec — シンプル、バッファ制限あり
  3. execFile — ファイル実行専用
- **Selected Approach**: spawnを使用
- **Rationale**:
  - Claude Codeの出力は大量になる可能性（長文生成、ツール使用ログ等）
  - ストリーミング出力への将来対応を見据える
  - 終了コードとstderrの分離キャプチャが容易
- **Trade-offs**: execより若干複雑だが、柔軟性が高い
- **Follow-up**: 出力バッファの最大サイズ検討

### Decision: パラメータグループ構成
- **Context**: UIでのパラメータ整理方法
- **Alternatives Considered**:
  1. フラット構成 — 全パラメータを1レベルで表示
  2. グループ構成 — 論理的なカテゴリでグループ化
  3. リソース/オペレーション方式 — GithubIssuesスタイル
- **Selected Approach**: グループ構成（基本/セッション/ツール/高度な設定）
- **Rationale**:
  - パラメータ数が多い（13要件×複数パラメータ）
  - displayOptionsで条件付き表示が可能
  - ユーザーは必要なグループのみ展開
- **Trade-offs**: 若干の実装複雑性増加
- **Follow-up**: n8nのcollectionタイプを活用

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Claude CLIが見つからない | 高 | 中 | 明確なエラーメッセージ、インストール手順へのリンク |
| 長時間実行でタイムアウト | 中 | 中 | タイムアウト設定をユーザー設定可能に（デフォルト5分） |
| JSON出力パース失敗 | 中 | 低 | 生出力をフォールバックとして返す |
| セキュリティリスク | 高 | 低 | ノード説明に警告、危険オプションに追加警告 |
| n8n APIバージョン互換性 | 中 | 低 | n8nNodesApiVersion: 1を維持、peerDependenciesで互換性確保 |

## References
- [n8n Custom Node Documentation](https://docs.n8n.io/integrations/creating-nodes/overview/)
- [n8n Community Nodes Guide](https://docs.n8n.io/integrations/community-nodes/build-community-nodes/)
- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference)
- [Node.js child_process Documentation](https://nodejs.org/api/child_process.html)
- [n8n-nodes-custom-exec](https://libraries.io/npm/n8n-nodes-custom-exec) - 参考実装
- [n8n-nodes-powershell](https://github.com/StarfallProjects/n8n-nodes-powershell) - PowerShell実行ノード参考

