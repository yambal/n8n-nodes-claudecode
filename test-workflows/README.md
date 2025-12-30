# テストワークフロー

このディレクトリには、n8n カスタムノードの動作検証用ワークフローを配置します。

## ファイル

| ファイル | 説明 |
|---------|------|
| `test-example.json` | Example ノードのテスト |
| `test-claude-code.json` | Claude Code ノードのテスト（実装後に作成） |

## 使用方法

### 方法1: スクリプトで実行

```bash
# Bash (Linux/Mac)
./scripts/dev-test.sh test

# PowerShell (Windows)
.\scripts\dev-test.ps1 test
```

### 方法2: n8n CLI で直接実行

```bash
n8n execute --file=test-workflows/test-example.json
```

### 方法3: n8n UI でインポート

1. `n8n start` でn8nを起動
2. http://localhost:5678 を開く
3. ワークフロー → インポート → JSONファイルを選択
4. 手動実行ボタンをクリック

## テストワークフローの作成

### 基本構造

```json
{
  "name": "Test Workflow Name",
  "nodes": [
    {
      "parameters": {},
      "id": "trigger",
      "name": "Start",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "param1": "value1"
      },
      "id": "test-node",
      "name": "TestNode",
      "type": "n8n-nodes-claudecode.claudeCode",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ],
  "connections": {
    "Start": {
      "main": [[{ "node": "TestNode", "type": "main", "index": 0 }]]
    }
  }
}
```

## Claude Code ノードのテスト例

```json
{
  "parameters": {
    "prompt": "Hello, Claude!",
    "model": "sonnet",
    "additionalOptions": {
      "timeout": 60
    }
  },
  "type": "n8n-nodes-claudecode.claudeCode"
}
```
