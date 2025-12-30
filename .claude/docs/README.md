# 開発ドキュメント

このディレクトリには、n8n-nodes-claudecode プロジェクトの開発に必要なドキュメントが含まれています。

## ドキュメント一覧

| ファイル | 説明 |
|---------|------|
| [local-development-setup.md](local-development-setup.md) | **ローカル開発環境セットアップ（推奨）** |
| [project-structure.md](project-structure.md) | プロジェクト構造ガイド |
| [development-guide.md](development-guide.md) | n8nカスタムノード開発ガイド |
| [n8n-v2-security.md](n8n-v2-security.md) | n8n v2.0 セキュリティ変更点 |
| [implementation-checklist.md](implementation-checklist.md) | 実装チェックリスト |
| [claude-cli-reference.md](claude-cli-reference.md) | Claude Code CLI リファレンス |

## クイックスタート

### 1. 開発環境セットアップ

詳細は [local-development-setup.md](local-development-setup.md) を参照。

```bash
# n8n グローバルインストール
npm install n8n -g

# プロジェクトでビルド＆リンク
npm run build
npm link

# n8n カスタムディレクトリにリンク
mkdir -p ~/.n8n/custom && cd ~/.n8n/custom
npm init -y
npm link n8n-nodes-claudecode

# n8n 起動
n8n start
```

#### 代替方法（簡易）

```bash
npm install
npm run dev
```

### 2. 実装の流れ

1. **仕様確認**: `.kiro/specs/n8n-claude-node/` の仕様ドキュメントを確認
2. **タスク確認**: `tasks.md` で実装タスクを確認
3. **実装**: `nodes/ClaudeCode/` にノードを実装
4. **テスト**: `npm run dev` でローカルテスト
5. **品質確認**: `npm run lint` でコード品質チェック

### 3. 主要参照先

- **要件定義**: `.kiro/specs/n8n-claude-node/requirements.md`
- **設計書**: `.kiro/specs/n8n-claude-node/design.md`
- **タスク**: `.kiro/specs/n8n-claude-node/tasks.md`
- **調査メモ**: `.kiro/specs/n8n-claude-node/research.md`

## 外部リソース

### n8n公式ドキュメント
- [カスタムノード作成](https://docs.n8n.io/integrations/creating-nodes/)
- [コミュニティノード](https://docs.n8n.io/integrations/community-nodes/)
- [v2.0変更点](https://docs.n8n.io/2-0-breaking-changes/)

### Claude Code
- [CLI リファレンス](https://code.claude.com/docs/en/cli-reference)

### テンプレート
- [n8n-nodes-starter](https://github.com/n8n-io/n8n-nodes-starter)
