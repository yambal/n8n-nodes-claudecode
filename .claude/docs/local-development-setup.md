# ローカル開発環境セットアップ

## 前提条件

- Node.js v22以上
- npm
- n8n（グローバルインストール済み）
- Claude Code CLI（ローカルインストール済み）

## クイックスタート（推奨）

```bash
# ビルド＆n8n起動（一発）
npm run dev:start

# または PowerShell スクリプト
.\scripts\dev-test.ps1 start
```

## ステップ1: n8n のグローバルインストール

```bash
npm install n8n -g
```

### トラブルシューティング: n8n 再インストール

動作がおかしい場合:

```bash
# 1. アンインストール
npm uninstall n8n -g

# 2. 設定ディレクトリを削除
rm -rf ~/.n8n

# 3. 再インストール
npm install n8n -g

# 4. 起動すると ~/.n8n が再生成される
n8n start
```

## ステップ2: カスタムノードのビルドとリンク

開発プロジェクト直下で実行:

```bash
# ビルド
npm run build

# グローバルリンクを作成
npm link
```

> **重要**: ソースコードを変更するたびに `npm run build` を実行すること

## ステップ3: n8n にカスタムノードをリンク

### カスタムノード用ディレクトリの作成

```bash
# ~/.n8n/custom を作成（なければ）
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom

# package.json を初期化
npm init -y
```

> **補足**: チュートリアルでは `~/.n8n/nodes` や任意フォルダを使う例もあるが、
> 特に理由がなければ `~/.n8n/custom` がシンプルで推奨。
> 複数フォルダや共有が必要な場合は `N8N_CUSTOM_EXTENSIONS` 環境変数を使用。

### リンクの作成

```bash
cd ~/.n8n/custom
npm link n8n-nodes-claudecode
```

## ステップ4: 起動して確認

```bash
n8n start
```

1. ブラウザで http://localhost:5678 を開く
2. ワークフローエディタでノード名（例: "Claude Code"）を検索
3. ノードを追加して動作確認

## 開発ワークフロー

```
┌─────────────────────────────────────────────────────────┐
│  開発サイクル                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. コード編集                                           │
│     └─→ nodes/ClaudeCode/*.ts を編集                    │
│                                                         │
│  2. ビルド                                               │
│     └─→ npm run build                                   │
│                                                         │
│  3. n8n 再起動（または既に起動中なら自動リロード）         │
│     └─→ n8n start                                       │
│                                                         │
│  4. ブラウザで動作確認                                   │
│     └─→ http://localhost:5678                           │
│                                                         │
│  5. 問題があれば 1 に戻る                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## コマンドまとめ

| コマンド | 説明 |
|---------|------|
| `npm run build` | TypeScriptをコンパイル |
| `npm run dev:start` | ビルド＆n8n起動 |
| `npm run dev:link` | ビルド＆npm link |
| `npm run test:workflow` | テストワークフロー実行 |
| `n8n start` | n8nを起動 |

### 自動化スクリプト

| スクリプト | 説明 |
|-----------|------|
| `.\scripts\dev-test.ps1 build` | ビルドのみ |
| `.\scripts\dev-test.ps1 link` | ビルド + リンク設定（初回のみ） |
| `.\scripts\dev-test.ps1 unlink` | リンク削除（終了時） |
| `.\scripts\dev-test.ps1 start` | ビルド + n8n起動 |
| `.\scripts\dev-test.ps1 test` | ビルド + テスト実行 |

### 開発ワークフロー

```
1. 初回セットアップ:  .\scripts\dev-test.ps1 link
2. 開発中:           .\scripts\dev-test.ps1 start （繰り返し）
3. 終了時:           .\scripts\dev-test.ps1 unlink
```

## 代替方法: npm run dev

`npm run dev` を使用すると、n8nが開発モードで起動し、ホットリロードが有効になります:

```bash
# プロジェクト直下で
npm run dev
```

この方法では `npm link` の手順が不要ですが、n8nのグローバルインストールとは別のインスタンスが起動します。

## ディレクトリ構成の確認

```
~/.n8n/
├── config                    # n8n設定
├── database.sqlite           # ワークフローDB
├── custom/                   # カスタムノード用
│   ├── package.json
│   └── node_modules/
│       └── n8n-nodes-claudecode -> (リンク先)
└── ...
```

## トラブルシューティング

### ノードが表示されない

1. ビルドが完了しているか確認: `npm run build`
2. リンクが正しいか確認: `ls -la ~/.n8n/custom/node_modules/`
3. n8nを再起動: `n8n start`
4. ブラウザのキャッシュをクリア

### ビルドエラー

```bash
# 依存関係を再インストール
rm -rf node_modules
npm install
npm run build
```

### リントエラー

```bash
# 自動修正
npm run lint:fix
```
