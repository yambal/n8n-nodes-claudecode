# n8n v2.0 セキュリティ変更点

## 概要

n8n v2.0（2024年後半〜2025年）では、セキュリティ強化のため重要な変更が行われました。カスタムノード開発時に考慮すべき点をまとめます。

## 主要な変更点

### 1. Task Runners（デフォルト有効）

**変更内容**:
- Code ノードの実行が分離環境で行われるようになりました
- メモリリークや無限ループがn8nインスタンス全体に影響しなくなりました

**影響**:
- カスタムノードには直接影響なし
- ただし、Code ノードとの連携時は動作確認が必要

### 2. 無効化されたノード

**デフォルトで無効化**:
- `ExecuteCommand` ノード（任意コマンド実行リスク）
- `LocalFileTrigger` ノード（ファイルシステムアクセスリスク）

**制御方法**:
```bash
# 環境変数で制御
NODES_EXCLUDE=n8n-nodes-base.executeCommand
```

**Claude Code Nodeへの影響**:
- ExecuteCommand が無効化されているため、カスタムノードでのCLI実行は有効な選択
- ユーザーは明示的にノードをインストールするため、リスクを理解している前提

### 3. 環境変数アクセス制限

**変更内容**:
- Code ノードからのデフォルト環境変数アクセスが遮断されました

**Claude Code Nodeへの影響**:
- `child_process.spawn` での環境変数引き継ぎは可能
- 必要な環境変数は明示的に渡す設計を推奨

### 4. OAuth認証の強制化

**変更内容**:
- `N8N_SKIP_AUTH_ON_OAUTH_CALLBACK` のデフォルトが `false` に変更
- OAuth コールバックエンドポイントに認証が必要

**Claude Code Nodeへの影響**:
- Claude Code CLIはローカル認証を使用するため影響なし

## セキュリティベストプラクティス

### 1. 警告表示

危険なオプションには警告を含める:

```typescript
{
  displayName: 'Skip Permissions',
  name: 'skipPermissions',
  type: 'boolean',
  default: false,
  description: '⚠️ パーミッションチェックをスキップ（危険）',
}
```

### 2. ノード説明にセキュリティ警告

```typescript
description: INodeTypeDescription = {
  description: 'Claude Code CLIを実行します。このノードはローカルでコマンドを実行するため、信頼できるワークフローでのみ使用してください。',
}
```

### 3. 入力の検証

```typescript
// 作業ディレクトリの存在確認
if (workingDirectory && !fs.existsSync(workingDirectory)) {
  throw new NodeOperationError(
    this.getNode(),
    `ディレクトリが存在しません: ${workingDirectory}`
  );
}
```

### 4. タイムアウト設定

長時間実行を防ぐためのタイムアウト:

```typescript
{
  displayName: 'Timeout (seconds)',
  name: 'timeout',
  type: 'number',
  default: 300,  // 5分
  description: '実行タイムアウト（秒）',
}
```

## エラーハンドリングの注意点

### 既知の問題

`NodeOperationError` または `NodeApiError` をスローすると、n8nインスタンス全体がクラッシュする可能性があります。

### 推奨される対応

1. **標準Error を使用**（クラッシュ回避）:
```typescript
throw new Error('エラーメッセージ');
```

2. **または慎重に NodeOperationError を使用**:
```typescript
// n8nコアが適切にキャッチすることを期待
throw new NodeOperationError(this.getNode(), 'メッセージ');
```

3. **continueOnFail のサポートを徹底**:
```typescript
if (this.continueOnFail()) {
  returnData.push({ json: { error: error.message } });
  continue;
}
```

## 参考リンク

- [n8n v2.0 Breaking Changes](https://docs.n8n.io/2-0-breaking-changes/)
- [n8n Error Handling](https://docs.n8n.io/flow-logic/error-handling/)
