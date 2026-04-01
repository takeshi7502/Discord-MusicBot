#!/bin/bash

# Dừng toàn bộ script nếu có lệnh nào bị lỗi
set -e

echo "========================================================"
echo "🔧 Discord-MusicBot — Docker Build & Deploy Script"
echo "========================================================"

# Bước 1: Kiểm tra Docker đã cài chưa
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt! Vui lòng cài Docker trước."
    echo "   Chạy: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose chưa được cài đặt!"
    exit 1
fi

echo "✅ Docker & Docker Compose đã sẵn sàng."

# Bước 2: Kiểm tra config.js
if [ ! -f config.js ]; then
    echo "⚠️  Không tìm thấy config.js! Đang tạo từ config_example.js..."
    cp config_example.js config.js
    echo "❌ Vui lòng điền token vào file config.js trước khi chạy lại build.sh!"
    exit 1
fi

# Bước 3: Tự động sửa host thành "lavalink" cho Docker networking trong file config.js
if grep -q '"host": "127.0.0.1"' config.js 2>/dev/null; then
    echo "⚠️  Phát hiện host đang là '127.0.0.1', tự động đổi sang 'lavalink' cho Docker..."
    sed -i 's/"host": "127.0.0.1"/"host": "lavalink"/g' config.js
    echo "✅ Đã cập nhật host thành 'lavalink'."
fi

if grep -q '"host":"127.0.0.1"' config.js 2>/dev/null; then
    sed -i 's/"host":"127.0.0.1"/"host":"lavalink"/g' config.js
fi

# Bước 4: Chuyển đổi line endings
echo "📝 Đang chuyển đổi line endings cho các file cấu hình..."
if command -v sed &> /dev/null; then
    sed -i 's/\r$//' ./Lavalink/application.yml 2>/dev/null || true
    echo "✅ Đã chuyển đổi line endings."
fi

# Bước 5: Phân quyền thư mục Lavalink cho container
if [ -d "./Lavalink" ]; then
    echo "🔒 Đang phân quyền thư mục Lavalink..."
    mkdir -p ./Lavalink/plugins

    # Tải plugin
    echo "🔌 Kiểm tra và tải plugin Lavalink..."
    PLUGINS_DIR="./Lavalink/plugins"
    MAVEN_RELEASE="https://maven.lavalink.dev/releases"
    MAVEN_SNAPSHOT="https://maven.lavalink.dev/snapshots"
    JITPACK="https://jitpack.io"

    download_plugin() {
        local url="$1"
        local filename="$2"
        if [ ! -f "$PLUGINS_DIR/$filename" ]; then
            echo "   ⬇️  Đang tải $filename..."
            curl -sL "$url" -o "$PLUGINS_DIR/$filename" || echo "   ⚠️  Không thể tải $filename"
        else
            echo "   ✅ $filename đã có sẵn."
        fi
    }

    # youtube-source plugin
    download_plugin "https://github.com/lavalink-devs/youtube-source/releases/download/1.18.0/youtube-plugin-1.18.0.jar" "youtube-plugin-1.18.0.jar"
    
    echo "✅ Plugin check hoàn tất."

    if [ -f "./Lavalink/application.yml" ]; then
        sed -i 's/\r$//' ./Lavalink/application.yml
    fi

    sudo chown -R 322:322 ./Lavalink 2>/dev/null || true
fi

# Bước 6: Dừng container cũ
echo "🛑 Đang dừng các container cũ..."
sudo docker compose --profile lavalink down --remove-orphans 2>/dev/null || true

# Bước 7: Build image
echo "⚙️  Đang build docker image cho bot..."
if ! sudo docker compose build discordmusicbot; then
    echo "❌ Build thất bại!"
    exit 1
fi

# Bước 8: Khởi động container
echo "🚀 Đang khởi động Bot và Lavalink..."
if ! sudo docker compose --profile lavalink up -d; then
    echo "❌ Khởi động container thất bại!"
    exit 1
fi

echo "⏳ Đang chờ container khởi động (5 giây)..."
sleep 5

echo "📋 Trạng thái:"
sudo docker ps -a --filter "name=discordmusicbot" --format "table {{.Names}}\t{{.Status}}"

echo "========================================================"
echo "✅ Hoàn tất! Bot đang chạy."
echo "🔗 Xem log Bot: sudo docker logs -f discordmusicbot"
echo "🔗 Xem log Lavalink: sudo docker logs -f discordmusicbot-lavalink"
echo "========================================================"
