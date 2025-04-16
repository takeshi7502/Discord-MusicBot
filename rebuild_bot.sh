#!/bin/bash

echo "⚙️ Đang build lại Docker image discordmusicbot..."
if ! sudo docker build . -t discordmusicbot; then
  echo "❌ Build thất bại. Dừng quá trình."
  exit 1
fi

echo "🛑 Dừng container cũ (nếu có)..."
sudo docker stop discordmusicbot_container 2>/dev/null

echo "🧹 Xoá container cũ..."
sudo docker rm discordmusicbot_container 2>/dev/null

echo "🚀 Khởi chạy container mới với --restart=always..."
sudo docker run -d --name discordmusicbot_container --restart=always discordmusicbot

echo "✅ Hoàn tất! BOT đã sẵn sàng hoạt động."
echo "🔗 Để xem log, bạn có thể sử dụng lệnh sau: sudo docker logs -f discordmusicbot_container"

