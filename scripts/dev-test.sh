#!/bin/bash
# n8n カスタムノード開発・テスト自動化スクリプト
# 使用方法: ./scripts/dev-test.sh [command]
#   build    - ビルドのみ
#   link     - ビルド + リンク設定（初回のみ）
#   unlink   - リンク削除
#   start    - ビルド + n8n起動
#   test     - ビルド + ワークフローテスト実行
#   all      - フルサイクル（ビルド→リンク→テスト）

set -e

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# プロジェクトルート
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
N8N_CUSTOM_DIR="$HOME/.n8n/custom"
PACKAGE_NAME="n8n-nodes-claudecode"

# ログ関数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ビルド
do_build() {
    log_info "ビルド開始..."
    cd "$PROJECT_ROOT"

    # リント（エラーがあっても続行）
    npm run lint || log_warn "リントエラーがありますが続行します"

    # ビルド
    npm run build
    log_success "ビルド完了"
}

# リンク設定（ビルド後に実行）
do_link() {
    log_info "リンク設定..."
    cd "$PROJECT_ROOT"

    # グローバルリンク作成
    npm link
    log_success "npm link 完了"

    # n8n カスタムディレクトリの準備
    if [ ! -d "$N8N_CUSTOM_DIR" ]; then
        log_info "~/.n8n/custom を作成..."
        mkdir -p "$N8N_CUSTOM_DIR"
        cd "$N8N_CUSTOM_DIR"
        npm init -y
    fi

    # リンク
    cd "$N8N_CUSTOM_DIR"
    npm link "$PACKAGE_NAME"
    log_success "n8n へのリンク完了"

    cd "$PROJECT_ROOT"
}

# リンク削除
do_unlink() {
    log_info "リンク削除..."

    # n8n カスタムディレクトリからリンク削除
    if [ -d "$N8N_CUSTOM_DIR" ]; then
        cd "$N8N_CUSTOM_DIR"
        npm unlink "$PACKAGE_NAME" 2>/dev/null && log_success "n8n からのリンクを削除しました" || log_warn "n8n リンクが存在しないか、既に削除されています"
    fi

    # グローバルリンク削除
    cd "$PROJECT_ROOT"
    npm unlink 2>/dev/null && log_success "グローバルリンクを削除しました" || log_warn "グローバルリンクが存在しないか、既に削除されています"

    cd "$PROJECT_ROOT"
}

# リンク状態確認
check_link_exists() {
    [ -L "$N8N_CUSTOM_DIR/node_modules/$PACKAGE_NAME" ]
}

# n8n 起動
do_start() {
    log_info "n8n を起動..."
    log_info "ブラウザで http://localhost:5678 を開いてください"
    log_info "終了するには Ctrl+C"
    n8n start
}

# ワークフローテスト実行
do_test() {
    local workflow_file="$PROJECT_ROOT/test-workflows/test-example.json"

    if [ ! -f "$workflow_file" ]; then
        log_warn "テストワークフローが見つかりません: $workflow_file"
        log_info "テストワークフローを作成してください"
        return 1
    fi

    log_info "ワークフローテスト実行..."
    n8n execute --file="$workflow_file"
    log_success "テスト完了"
}

# ヘルプ
show_help() {
    echo "n8n カスタムノード開発・テスト自動化スクリプト"
    echo ""
    echo "使用方法: $0 [command]"
    echo ""
    echo "コマンド:"
    echo "  build    ビルドのみ"
    echo "  link     ビルド + リンク設定（初回セットアップ用）"
    echo "  unlink   リンク削除（クリーンアップ用）"
    echo "  start    ビルド + n8n起動（リンク済みの場合）"
    echo "  test     ビルド + ワークフローテスト実行"
    echo "  all      フルサイクル（ビルド→リンク→テスト）"
    echo "  help     このヘルプを表示"
    echo ""
    echo "ワークフロー:"
    echo "  1. 初回: $0 link"
    echo "  2. 開発中: $0 start"
    echo "  3. 終了時: $0 unlink"
    echo ""
    echo "例:"
    echo "  $0 link    # 初回セットアップ"
    echo "  $0 start   # 開発中のビルド＆起動"
    echo "  $0 unlink  # リンク削除"
}

# メイン
case "${1:-help}" in
    build)
        do_build
        ;;
    link)
        do_build
        do_link
        ;;
    unlink)
        do_unlink
        ;;
    start)
        do_build
        if ! check_link_exists; then
            log_warn "リンクが設定されていません。先に 'link' を実行してください。"
            log_info "$0 link"
            exit 1
        fi
        do_start
        ;;
    test)
        do_build
        if ! check_link_exists; then
            log_warn "リンクが設定されていません。先に 'link' を実行してください。"
            exit 1
        fi
        do_test
        ;;
    all)
        do_build
        do_link
        do_test
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "不明なコマンド: $1"
        show_help
        exit 1
        ;;
esac
