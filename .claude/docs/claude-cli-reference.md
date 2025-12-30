# Claude Code CLI リファレンス

## 基本構文

```bash
claude [options] [prompt]
```

## 主要オプション

### 実行モード

| オプション | 説明 |
|-----------|------|
| `-p, --print` | 非対話モード（標準出力に結果を出力） |
| `--output-format <format>` | 出力形式（`text`, `json`, `stream-json`） |

### モデル設定

| オプション | 説明 |
|-----------|------|
| `--model <model>` | 使用するモデル（sonnet, opus, haiku, または完全なモデルID） |
| `--fallback-model <model>` | フォールバックモデル |

### システムプロンプト

| オプション | 説明 |
|-----------|------|
| `--system-prompt <prompt>` | システムプロンプトを置き換え |
| `--append-system-prompt <prompt>` | システムプロンプトに追加 |

### セッション管理

| オプション | 説明 |
|-----------|------|
| `-c, --continue` | 最新の会話を継続 |
| `--resume <session>` | 指定したセッションを再開 |
| `--session-id <id>` | セッションIDを指定 |
| `--fork-session` | セッションをフォークして新しいIDを生成 |

### ツール制御

| オプション | 説明 |
|-----------|------|
| `--tools <tools>` | 使用可能なツールをカンマ区切りで指定 |
| `--allowedTools <patterns>` | 許可するツールパターン |
| `--disallowedTools <patterns>` | 禁止するツールパターン |

### エージェント制御

| オプション | 説明 |
|-----------|------|
| `--max-turns <n>` | 最大ターン数 |
| `--agents <json>` | カスタムサブエージェント定義 |
| `--verbose` | 詳細ログを有効化 |

### MCP設定

| オプション | 説明 |
|-----------|------|
| `--mcp-config <path>` | MCP設定ファイルのパス |
| `--permission-mode <mode>` | パーミッションモード（`plan`など） |

### 高度なオプション

| オプション | 説明 |
|-----------|------|
| `--debug <filter>` | デバッグモード（例: `api,mcp`） |
| `--json-schema <schema>` | 構造化出力のJSONスキーマ |
| `--betas <features>` | ベータ機能を有効化 |
| `--add-dir <path>` | 追加の作業ディレクトリ |
| `--dangerously-skip-permissions` | パーミッションチェックをスキップ（危険） |

## JSON出力形式

### `--output-format json` の出力構造

```json
{
  "type": "result",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "レスポンステキスト"
      }
    ]
  },
  "session_id": "abc123...",
  "usage": {
    "input_tokens": 100,
    "output_tokens": 200
  }
}
```

### 主要フィールド

| フィールド | 説明 |
|-----------|------|
| `result` | メインレスポンス |
| `result.content[].text` | テキスト出力 |
| `session_id` | セッション識別子 |
| `usage` | トークン使用量 |

## 使用例

### 基本実行

```bash
claude -p --output-format json "Hello, Claude!"
```

### モデル指定

```bash
claude -p --output-format json --model opus "複雑なタスク"
```

### セッション継続

```bash
claude -p --output-format json -c "前の続きから"
```

### ツール制限

```bash
claude -p --output-format json --tools "Read,Glob,Grep" "コードを調査して"
```

### 作業ディレクトリ指定

```bash
# cwdオプションではなく、実行時のカレントディレクトリで制御
cd /path/to/project && claude -p --output-format json "このプロジェクトについて"
```

## n8n Node での実装

### CommandBuilder での引数構築

```typescript
function buildCommand(params: CommandBuilderParams): string[] {
  const args: string[] = ['-p', '--output-format', 'json'];

  // プロンプト（最後に追加）
  args.push(params.prompt);

  // モデル
  if (params.model && params.model !== 'default') {
    args.push('--model', params.model);
  }

  // システムプロンプト
  if (params.systemPromptMode === 'append' && params.systemPrompt) {
    args.push('--append-system-prompt', params.systemPrompt);
  } else if (params.systemPromptMode === 'replace' && params.systemPrompt) {
    args.push('--system-prompt', params.systemPrompt);
  }

  // セッション
  if (params.sessionMode === 'continue') {
    args.push('-c');
  } else if (params.sessionMode === 'resume' && params.sessionId) {
    args.push('--resume', params.sessionId);
    if (params.forkSession) {
      args.push('--fork-session');
    }
  }

  // ツール制御
  if (params.toolControl === 'custom' && params.tools) {
    args.push('--tools', params.tools);
  } else if (params.toolControl === 'allow' && params.allowedTools) {
    args.push('--allowedTools', params.allowedTools);
  } else if (params.toolControl === 'deny' && params.disallowedTools) {
    args.push('--disallowedTools', params.disallowedTools);
  } else if (params.toolControl === 'none') {
    args.push('--tools', '');
  }

  return args;
}
```

### ProcessRunner での実行

```typescript
import { spawn } from 'child_process';

function runProcess(args: string[], options: ProcessOptions): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error('TIMEOUT'));
    }, options.timeout);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      resolve({ stdout, stderr, exitCode: code, timedOut: false });
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      if (err.code === 'ENOENT') {
        reject(new Error('CLI_NOT_FOUND'));
      } else {
        reject(err);
      }
    });
  });
}
```
