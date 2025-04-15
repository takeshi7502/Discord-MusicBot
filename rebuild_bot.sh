#!/bin/bash

echo "🔧 Đang build lại Docker image bocchibot..."
if ! sudo docker build . -t bocchibot; then
  echo "❌ Build thất bại. Dừng quá trình."
  exit 1
fi

echo "🛑 Dừng container cũ bocchibot_container (nếu có)..."
sudo docker stop bocchibot_container 2>/dev/null

echo "🧹 Xoá container cũ bocchibot_container..."
sudo docker rm bocchibot_container 2>/dev/null

echo "🚀 Khởi chạy container mới với --restart=always..."
sudo docker run -d --name bocchibot_container --restart=always bocchibot

echo "✅ Hoàn tất!"
