# n8n カスタムノード開発ガイド

## 開発環境セットアップ

### 必要条件
- Node.js v22以上
- npm
- Claude Code CLI（ローカルインストール済み）

### 初期セットアップ
```bash
# 依存関係インストール
npm install

# 開発モードでn8nを起動（ホットリロード対応）
npm run dev
```

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発モードでn8n起動（http://localhost:5678） |
| `npm run build` | TypeScript → JavaScript コンパイル |
| `npm run build:watch` | ビルド監視モード |
| `npm run lint` | ESLintでコード品質チェック |
| `npm run lint:fix` | ESLint自動修正 |

## INodeType インターフェース

### 基本構造

```typescript
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
} from 'n8n-workflow';

export class MyNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'My Node',
    name: 'myNode',
    icon: 'file:myicon.svg',
    group: ['transform'],
    version: 1,
    description: 'ノードの説明',
    defaults: {
      name: 'My Node',
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    properties: [
      // パラメータ定義
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // 実行ロジック
  }
}
```

### 重要な属性

| 属性 | 説明 |
|-----|------|
| `displayName` | UIに表示される名前 |
| `name` | 内部識別子（キャメルケース） |
| `icon` | アイコンファイルパス |
| `group` | ノードカテゴリ |
| `version` | ノードバージョン |
| `inputs` / `outputs` | 接続タイプ |
| `properties` | パラメータ定義配列 |
| `usableAsTool` | AI Tool として使用可能か |

## パラメータ定義（INodeProperties）

### 基本的なプロパティ

```typescript
{
  displayName: 'Prompt',
  name: 'prompt',
  type: 'string',
  typeOptions: { rows: 4 },
  default: '',
  required: true,
  description: 'Claude Codeに送信するプロンプト',
}
```

### 条件付き表示（displayOptions）

```typescript
{
  displayName: 'Custom Model',
  name: 'customModel',
  type: 'string',
  default: '',
  displayOptions: {
    show: {
      model: ['custom'],  // modelが'custom'の時のみ表示
    },
  },
}
```

### プロパティタイプ一覧

| タイプ | 説明 |
|-------|------|
| `string` | 文字列入力 |
| `number` | 数値入力 |
| `boolean` | チェックボックス |
| `options` | ドロップダウン選択 |
| `collection` | オプショングループ |
| `json` | JSON入力 |
| `resourceLocator` | 動的検索付き入力 |

## execute() メソッド実装

### 基本パターン

```typescript
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      // パラメータ取得
      const prompt = this.getNodeParameter('prompt', i) as string;

      // 処理実行
      const result = await someProcess(prompt);

      // 結果追加
      returnData.push({
        json: { result },
        pairedItem: i,
      });
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push({
          json: { error: error.message },
          pairedItem: i,
        });
        continue;
      }
      throw error;
    }
  }

  return [returnData];
}
```

### 重要なルール

1. **入力データを直接変更しない**
   - `this.getInputData()` の戻り値は共有オブジェクト
   - 変更が必要な場合はクローンする

2. **pairedItem を設定する**
   - 入力と出力の対応関係を維持
   - デバッグ・追跡に重要

3. **continueOnFail() をサポート**
   - ユーザーが「エラー時に継続」を選択できるように

## エラーハンドリング

### NodeOperationError

```typescript
import { NodeOperationError } from 'n8n-workflow';

throw new NodeOperationError(
  this.getNode(),
  'エラーメッセージ',
  { description: '詳細説明' }
);
```

### 注意点（n8n v2.0+）
- `NodeOperationError` をスローするとn8nインスタンスがクラッシュする既知の問題あり
- 回避策: 標準の `Error` オブジェクトを使用

### continueOnFail パターン

```typescript
if (this.continueOnFail()) {
  returnData.push({
    json: { error: error.message },
    pairedItem: i,
  });
  continue;
}
throw error;
```

## ノードメタデータファイル

### ClaudeCode.node.json

```json
{
  "node": "n8n-nodes-claudecode.claudeCode",
  "nodeVersion": "1.0",
  "codexVersion": "1.0",
  "categories": ["AI", "Development"],
  "resources": {
    "primaryDocumentation": [
      {
        "url": "https://claude.ai/docs"
      }
    ]
  },
  "subcategories": {
    "AI": ["Language Models"]
  },
  "alias": ["claude", "anthropic", "ai"]
}
```

## package.json への登録

```json
{
  "n8n": {
    "nodes": [
      "dist/nodes/ClaudeCode/ClaudeCode.node.js"
    ]
  }
}
```
