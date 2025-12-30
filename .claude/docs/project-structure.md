# プロジェクト構造ガイド

## ディレクトリ構成

```
n8n-nodes-claudecode/
├── .claude/                          # Claude Code設定・コマンド
│   ├── commands/kiro/                # Kiroスキル定義
│   └── docs/                         # 開発ドキュメント（このフォルダ）
├── .kiro/                            # AI-DLC仕様管理
│   ├── settings/                     # 設定・テンプレート
│   └── specs/                        # 機能仕様
├── .vscode/                          # VS Code設定
├── credentials/                      # 認証情報定義
├── icons/                            # ノードアイコン（SVG）
├── nodes/                            # n8nノード実装
│   ├── Example/                      # シンプルな例（命令型）
│   └── GithubIssues/                 # 本格的な例（宣言型）
├── dist/                             # ビルド出力（.gitignore対象）
├── package.json                      # npm設定・n8nノード登録
├── tsconfig.json                     # TypeScript設定
├── eslint.config.mjs                 # ESLint設定
└── .prettierrc.js                    # Prettier設定
```

## 主要ファイルの役割

### package.json - n8n設定セクション

```json
{
  "n8n": {
    "n8nNodesApiVersion": 1,
    "strict": true,
    "credentials": [
      "dist/credentials/*.credentials.js"
    ],
    "nodes": [
      "dist/nodes/**/*.node.js"
    ]
  }
}
```

| 項目 | 説明 |
|-----|------|
| `n8nNodesApiVersion` | APIバージョン（現在は1を推奨） |
| `strict` | 厳密モード有効化 |
| `credentials` | 認証情報ファイルのパス |
| `nodes` | ノードファイルのパス |

### tsconfig.json - TypeScript設定

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "commonjs",
    "target": "es2019",
    "outDir": "./dist/",
    "declaration": true,
    "sourceMap": true
  }
}
```

### .prettierrc.js - コード整形ルール

| 設定 | 値 | 説明 |
|-----|-----|------|
| `useTabs` | true | タブ使用 |
| `tabWidth` | 2 | タブ幅2スペース |
| `singleQuote` | true | シングルクォート |
| `printWidth` | 100 | 行最大幅 |
| `trailingComma` | 'all' | 末尾コンマ |

## サンプルノードの解説

### Example ノード（命令型スタイル）

**用途**: CLI実行など、細かい制御が必要な場合

```typescript
// nodes/Example/Example.node.ts
class Example implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Example',
    name: 'example',
    properties: [/* パラメータ定義 */]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // 実行ロジックを直接記述
  }
}
```

### GithubIssues ノード（宣言型スタイル）

**用途**: REST API統合など、HTTP呼び出しが主体の場合

```typescript
// nodes/GithubIssues/GithubIssues.node.ts
{
  routing: {
    request: {
      method: 'GET',
      url: '=/repos/{{$parameter.owner}}/issues',
    },
  }
}
```

## Claude Code Nodeの実装方針

Claude Code CLIはローカルプロセス実行が必要なため、**命令型スタイル**を採用:

```
nodes/ClaudeCode/
├── ClaudeCode.node.ts      # メインノード（INodeType実装）
├── ClaudeCode.node.json    # n8nメタデータ
├── utils/
│   ├── commandBuilder.ts   # CLI引数構築
│   ├── processRunner.ts    # child_process.spawn実行
│   └── outputParser.ts     # JSON出力パース
└── types.ts                # 型定義
```
