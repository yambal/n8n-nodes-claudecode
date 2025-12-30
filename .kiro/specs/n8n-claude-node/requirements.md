# Requirements Document

## Introduction
本ドキュメントはn8nワークフロー自動化プラットフォーム向けのClaude Code CLI統合ノード（n8n-nodes-claudecode）の要件を定義します。このノードは、ローカルにインストールされたClaude Code CLI（`claude`コマンド）をn8nワークフローから実行し、AIエージェント機能をワークフロー自動化に統合します。

**注意**: このノードはAnthropic APIを直接呼び出すのではなく、ローカルのClaude Code CLIを`child_process`経由で実行します。

## Requirements

### Requirement 1: Claude Code CLI実行基盤
**Objective:** As a n8nユーザー, I want n8nワークフローからClaude Code CLIを実行したい, so that AIエージェント機能をワークフロー自動化に組み込める

#### Acceptance Criteria
1. The Claude Code Node shall `child_process.spawn`または`child_process.exec`を使用してローカルの`claude`コマンドを実行する
2. The Claude Code Node shall `-p`（print mode）フラグを使用して非対話モードで実行する
3. The Claude Code Node shall `--output-format json`でJSON形式の出力を取得する
4. When CLIの実行が完了した場合, the Claude Code Node shall JSON出力をパースしてn8nデータとして返す
5. If `claude`コマンドが見つからない場合, the Claude Code Node shall 明確なエラーメッセージを表示する
6. The Claude Code Node shall CLIの実行タイムアウトを設定するオプションを提供する

### Requirement 2: プロンプト入力
**Objective:** As a n8nユーザー, I want プロンプトを柔軟に入力したい, so that 様々なタスクをClaude Codeに依頼できる

#### Acceptance Criteria
1. The Claude Code Node shall テキストプロンプトを入力するフィールドを提供する
2. The Claude Code Node shall 前のノードからの入力データを動的に参照できる式入力をサポートする
3. The Claude Code Node shall 複数行のプロンプト入力をサポートする
4. When プロンプトが空の場合, the Claude Code Node shall バリデーションエラーを表示する

### Requirement 3: システムプロンプト設定
**Objective:** As a n8nユーザー, I want システムプロンプトをカスタマイズしたい, so that Claude Codeの振る舞いを制御できる

#### Acceptance Criteria
1. The Claude Code Node shall `--append-system-prompt`オプションでシステムプロンプトを追加する機能を提供する
2. The Claude Code Node shall `--system-prompt`オプションでシステムプロンプトを完全に置き換える機能を提供する
3. The Claude Code Node shall システムプロンプトモード（追加/置換/なし）を選択するオプションを提供する
4. If 両方のシステムプロンプトオプションが指定された場合, the Claude Code Node shall エラーを表示する（相互排他的）

### Requirement 4: モデル選択
**Objective:** As a n8nユーザー, I want 使用するモデルを選択したい, so that タスクに応じて適切なモデルを使い分けられる

#### Acceptance Criteria
1. The Claude Code Node shall `--model`オプションでモデルを指定する機能を提供する
2. The Claude Code Node shall モデル選択のドロップダウン（sonnet, opus, haiku等）を提供する
3. The Claude Code Node shall カスタムモデル名を直接入力するオプションを提供する
4. The Claude Code Node shall モデル未指定時はCLIのデフォルトを使用する

### Requirement 5: ツール制御
**Objective:** As a n8nユーザー, I want Claude Codeが使用できるツールを制御したい, so that セキュリティとタスクの範囲を管理できる

#### Acceptance Criteria
1. The Claude Code Node shall `--tools`オプションで使用可能なツールを制限する機能を提供する
2. The Claude Code Node shall `--allowedTools`オプションで許可するツールパターンを指定する機能を提供する
3. The Claude Code Node shall `--disallowedTools`オプションで禁止するツールパターンを指定する機能を提供する
4. The Claude Code Node shall よく使うツールセット（Read, Edit, Bash等）のプリセットを提供する
5. The Claude Code Node shall カスタムツールリストを直接入力するオプションを提供する

### Requirement 6: セッション管理
**Objective:** As a n8nユーザー, I want 会話セッションを管理したい, so that 継続的な対話やコンテキストの再利用ができる

#### Acceptance Criteria
1. The Claude Code Node shall `-c`オプションで最新の会話を継続する機能を提供する
2. The Claude Code Node shall `--resume`オプションで特定のセッションを再開する機能を提供する
3. The Claude Code Node shall `--session-id`オプションでセッションIDを指定する機能を提供する
4. The Claude Code Node shall `--fork-session`オプションでセッションをフォークする機能を提供する
5. The Claude Code Node shall セッションモード（新規/継続/再開）を選択するオプションを提供する
6. When セッション再開が指定された場合, the Claude Code Node shall セッションIDまたはセッション名の入力フィールドを表示する

### Requirement 7: 作業ディレクトリ設定
**Objective:** As a n8nユーザー, I want Claude Codeの作業ディレクトリを指定したい, so that 特定のプロジェクトに対してタスクを実行できる

#### Acceptance Criteria
1. The Claude Code Node shall 作業ディレクトリ（cwd）を指定する機能を提供する
2. The Claude Code Node shall `--add-dir`オプションで追加のディレクトリを指定する機能を提供する
3. The Claude Code Node shall 複数の追加ディレクトリを指定する機能を提供する
4. If 指定されたディレクトリが存在しない場合, the Claude Code Node shall 明確なエラーメッセージを表示する

### Requirement 8: エージェント・ターン制御
**Objective:** As a n8nユーザー, I want エージェントの動作を制御したい, so that 実行時間とコストを管理できる

#### Acceptance Criteria
1. The Claude Code Node shall `--max-turns`オプションでエージェントの最大ターン数を設定する機能を提供する
2. The Claude Code Node shall `--agents`オプションでカスタムサブエージェントを定義する機能を提供する
3. The Claude Code Node shall `--verbose`オプションで詳細ログを有効にする機能を提供する
4. The Claude Code Node shall エージェント定義をJSON形式で入力する機能を提供する

### Requirement 9: MCP（Model Context Protocol）設定
**Objective:** As a n8nユーザー, I want MCP設定を指定したい, so that 外部ツールやサービスと連携できる

#### Acceptance Criteria
1. The Claude Code Node shall `--mcp-config`オプションでMCP設定ファイルパスを指定する機能を提供する
2. The Claude Code Node shall `--permission-mode`オプションでパーミッションモードを設定する機能を提供する
3. Where MCPサーバーが設定されている場合, the Claude Code Node shall MCP経由のツールを利用可能にする

### Requirement 10: 出力形式とパース
**Objective:** As a n8nユーザー, I want 出力を使いやすい形式で受け取りたい, so that 後続のノードでデータを簡単に処理できる

#### Acceptance Criteria
1. The Claude Code Node shall `--output-format json`の出力をパースして構造化データとして返す
2. The Claude Code Node shall レスポンステキスト（result）を出力に含める
3. The Claude Code Node shall セッションID（session_id）を出力に含める
4. The Claude Code Node shall 使用トークン数や実行統計を出力に含める（利用可能な場合）
5. The Claude Code Node shall `--output-format stream-json`でストリーミング出力を処理するオプションを提供する
6. If JSON出力のパースに失敗した場合, the Claude Code Node shall 生の出力とエラー情報を返す

### Requirement 11: エラーハンドリング
**Objective:** As a n8nユーザー, I want エラー時に適切な情報を得たい, so that 問題を診断・解決できる

#### Acceptance Criteria
1. The Claude Code Node shall CLIの終了コードを確認してエラーを検出する
2. The Claude Code Node shall stderr出力をキャプチャしてエラーメッセージとして提供する
3. The Claude Code Node shall タイムアウトエラーを明確に報告する
4. If CLIがクラッシュした場合, the Claude Code Node shall スタックトレースや診断情報を出力に含める
5. The Claude Code Node shall n8nの「エラー時に継続」オプションをサポートする

### Requirement 12: n8n統合とUX
**Objective:** As a n8nユーザー, I want 直感的なUIでノードを設定したい, so that 効率的にワークフローを構築できる

#### Acceptance Criteria
1. The Claude Code Node shall n8nの標準的なノードUIパターンに従ったパラメータ入力フォームを提供する
2. The Claude Code Node shall パラメータを論理的なグループ（基本設定、セッション、ツール、高度な設定）に整理する
3. The Claude Code Node shall 各パラメータに説明文（description）を含める
4. The Claude Code Node shall 条件付き表示（displayOptions）で関連パラメータのみを表示する
5. The Claude Code Node shall 適切なノードアイコン（Claude/Anthropicブランド）を提供する
6. The Claude Code Node shall n8nコミュニティノード規約に準拠したパッケージ構成とする

### Requirement 13: 高度なCLIオプション
**Objective:** As a n8nユーザー, I want 高度なCLIオプションにアクセスしたい, so that 特殊なユースケースに対応できる

#### Acceptance Criteria
1. The Claude Code Node shall `--debug`オプションでデバッグモードを有効にする機能を提供する
2. The Claude Code Node shall `--dangerously-skip-permissions`オプションを提供する（警告付き）
3. The Claude Code Node shall `--fallback-model`オプションでフォールバックモデルを指定する機能を提供する
4. The Claude Code Node shall `--json-schema`オプションで構造化出力スキーマを指定する機能を提供する
5. The Claude Code Node shall `--betas`オプションでベータ機能を有効にする機能を提供する
6. The Claude Code Node shall 任意の追加CLIフラグを直接入力するフィールドを提供する

