#!/bin/bash

# Dừng toàn bộ script nếu có lệnh nào bị lỗi
set -e

echo "========================================================"
echo "🚀 Discord-MusicBot — Update & Run Script"
echo "========================================================"

echo "📥 Đang tải mã nguồn mới nhất từ Github..."
git pull || echo "⚠️  Git pull gặp vấn đề, vẫn tiếp tục..."

# Đảm bảo config.js trỏ về 127.0.0.1 (host networking mode)
if grep -q 'host: "lavalink"' config.js 2>/dev/null; then
    sed -i 's/host: "lavalink"/host: "127.0.0.1"/g' config.js
fi
if grep -q 'host:"lavalink"' config.js 2>/dev/null; then
    sed -i 's/host:"lavalink"/host:"127.0.0.1"/g' config.js
fi

echo "🛑 Đang khởi động lại container..."
sudo docker compose down --remove-orphans 2>/dev/null || true

echo "⚙️  Đang build lại Bot để nhận code mới (nếu có)..."
if ! sudo docker compose build discordmusicbot; then
    echo "❌ Build thất bại!"
    exit 1
fi

echo "🚀 Đang khởi chạy hệ thống (Bot sẽ tự động chờ Lavalink khởi động xong)..."
if ! sudo docker compose up -d; then
    echo "❌ Khởi động container thất bại!"
    exit 1
fi

echo "========================================================"
echo "✅ Hoàn tất! Mã nguồn đã được cập nhật và Bot đang chạy."
echo "🔗 Xem log Bot: sudo docker logs -f discordmusicbot"
echo "🔗 Xem log Lavalink: sudo docker logs -f discordmusicbot-lavalink"
echo "========================================================"
