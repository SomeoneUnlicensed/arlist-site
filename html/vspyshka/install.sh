#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${VSPYSHKA_DOWNLOAD_BASE:-https://arlist.ru/dl/vspyshka}"
INSTALL_DIR="${VSPYSHKA_INSTALL_DIR:-$HOME/.local/bin}"

os="$(uname -s)"
arch="$(uname -m)"

case "$os" in
  Linux)
    case "$arch" in
      x86_64) archive="vspyshka-linux-x64.tar.gz" ;;
      aarch64|arm64) archive="vspyshka-linux-arm64.tar.gz" ;;
      *) echo "Неподдерживаемая архитектура: $arch" >&2; exit 1 ;;
    esac
    ;;
  Darwin)
    case "$arch" in
      x86_64) archive="vspyshka-darwin-x64.tar.gz" ;;
      arm64) archive="vspyshka-darwin-arm64.tar.gz" ;;
      *) echo "Неподдерживаемая архитектура: $arch" >&2; exit 1 ;;
    esac
    ;;
  *)
    echo "Неподдерживаемая ОС: $os. Для Windows используйте install.ps1." >&2
    exit 1
    ;;
esac

echo "Скачиваю Вспышку ($archive)..."
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
curl -fsSL "$BASE_URL/latest/$archive" -o "$tmp_dir/$archive"

mkdir -p "$INSTALL_DIR"
tar -C "$tmp_dir" -xzf "$tmp_dir/$archive"
install -m 0755 "$tmp_dir/vsp" "$INSTALL_DIR/vsp"
ln -sf "$INSTALL_DIR/vsp" "$INSTALL_DIR/vspyshka"

case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *) echo "Добавьте $INSTALL_DIR в PATH (например, в ~/.bashrc или ~/.zshrc)." ;;
esac

echo "Готово. Запустите: vsp"
