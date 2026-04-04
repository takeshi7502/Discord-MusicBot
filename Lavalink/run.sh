#!/bin/bash

# Màu sắc cho menu
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Không màu

show_menu() {
    clear
    echo -e "${CYAN}====================================================${NC}"
    echo -e "${GREEN}       BỘ CÔNG CỤ CÀI ĐẶT LAVALINK + TAILSCALE      ${NC}"
    echo -e "${CYAN}====================================================${NC}"
    echo -e "1. Cài đặt Java 17 (Bắt buộc cho Lavalink V4)"
    echo -e "2. Cài đặt/Cập nhật yt-dlp_linux (Cho YouTube)"
    echo -e "3. Cài đặt hệ thống màng lọc Tailscale (VPN)"
    echo -e "4. Kích hoạt Tailscale Exit Node (Nhập IP Điện thoại)"
    echo -e "5. Tạm Tắt Tailscale (Phục hồi IP gốc để tải file)"
    echo -e "6. Tải file Lavalink.jar (V4 mới nhất)"
    echo -e "7. Chạy trực tiếp Lavalink (Xem Log Console)"
    echo -e "8. Khởi chạy Lavalink qua Docker Compose (Tự check & cài Docker)"
    echo -e "9. Xem Log Lavalink trên Docker Compose"
    echo -e "10. Restart Lavalink (Docker Compose)"
    echo -e "0. Thoát chương trình"
    echo -e "${CYAN}====================================================${NC}"
    read -p "Nhập số (0-10) để thực hiện lệnh: " choice
}

install_java() {
    echo -e "${YELLOW}Đang tiến hành cài đặt OpenJDK 17...${NC}"
    sudo apt update
    sudo apt install -y openjdk-17-jre-headless curl wget screen
    echo -e "${GREEN}Cài đặt Java hoàn tất! Kiểm tra mã phiên bản:${NC}"
    java -version
    read -p "Nhấn Enter để quay lại menu..."
}

install_ytdlp() {
    echo -e "${YELLOW}Đang tải yt-dlp_linux (Mới nhất) về thư mục Lavalink...${NC}"
    wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -O yt-dlp_linux
    chmod +x yt-dlp_linux
    echo -e "${GREEN}Thành công! Kiểm tra phiên bản yt-dlp_linux:${NC}"
    ./yt-dlp_linux --version
    read -p "Nhấn Enter để quay lại menu..."
}

install_tailscale() {
    echo -e "${YELLOW}Đang tải bộ cài tự động Tailscale...${NC}"
    curl -fsSL https://tailscale.com/install.sh | sh
    echo -e "${GREEN}Cài đặt hoàn tất! Lần đầu, VPS cần được phê duyệt:${NC}"
    echo -e "${YELLOW}Vui lòng CHÉP ĐƯỜNG LINK dán vào trình duyệt để chứng thực VPS của bạn:${NC}"
    sudo tailscale up
    read -p "Nhấn Enter sau khi bạn đã dán link trên trình duyệt và chứng thực xong..."
}

config_exitnode() {
    echo -e "${CYAN}BƯỚC QUAN TRỌNG: Mở App Tailscale trên điện thoại, bấm vào dấu 3 chấm góc phải, chọn 'Run as exit node'.${NC}"
    read -p "Hãy nhập địa chỉ IP Tailscale của chiếc điện thoại đó (VD: 100.123...): " exit_ip
    echo -e "${YELLOW}Tiến hành liên kết với trạm trung chuyển $exit_ip...${NC}"
    sudo tailscale up --exit-node=$exit_ip
    echo -e "${GREEN}Kích hoạt thành công! VPS bây giờ đã 'Tàng hình' qua đường mạng điện thoại của bạn.${NC}"
    read -p "Nhấn Enter để quay lại menu..."
}

disable_exitnode() {
    echo -e "${YELLOW}Tháo gỡ mạng Exit Node...${NC}"
    sudo tailscale up --exit-node=
    echo -e "${GREEN}Chế độ Exit Node đã tắt! Mạng VPS trở về trạng thái xuất xưởng bình thường.${NC}"
    read -p "Nhấn Enter để quay lại menu..."
}

download_lavalink() {
    echo -e "${YELLOW}Đang tải xuống Lavalink.jar (Bản ổn định nhất V4.0.8)...${NC}"
    wget https://github.com/lavalink-devs/Lavalink/releases/download/4.2.2/Lavalink.jar -O Lavalink.jar
    echo -e "${GREEN}Đã tải xong Lavalink.jar! (Lưu ý: đừng quên đưa file application.yml vào cùng folder này)${NC}"
    read -p "Nhấn Enter để quay lại menu..."
}

run_lavalink() {
    if [ ! -f "Lavalink.jar" ]; then
        echo -e "${RED}[LỖI] Không tìm thấy Lavalink.jar! Hãy quay lại chọn phím 6 để tải về trước.${NC}"
    elif [ ! -f "application.yml" ] && [ ! -f "application_server.yml" ]; then
        echo -e "${RED}[LỖI] Không có file cấu hình application.yml! Mời chép file từ máy tính lên VPS.${NC}"
    else
        CONFIG_FILE="application.yml"
        if [ -f "application_server.yml" ]; then CONFIG_FILE="application_server.yml"; fi
        
        echo -e "${GREEN}Khởi động Lavalink với file cấu hình $CONFIG_FILE... (Bấm Ctrl+C để thoát Log)${NC}"
        java -Dlavalink.server.config.path=$CONFIG_FILE -jar Lavalink.jar
    fi
    read -p "Nhấn Enter để quay lại menu..."
}

install_docker_if_needed() {
    if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
        echo -e "${YELLOW}Chưa có Docker/Docker Compose! Tiến hành tự động cài đặt...${NC}"
        curl -fsSL https://get.docker.com | sh
        echo -e "${GREEN}Cài đặt Docker hoàn tất!${NC}"
    else
        echo -e "${GREEN}Docker/Docker Compose đã được cài đặt sẵn! Bỏ qua bước cài đặt.${NC}"
    fi
}

run_docker_compose() {
    install_docker_if_needed
    
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${YELLOW}Không tìm thấy docker-compose.yml! Đang tự động tạo mẫu chuẩn...${NC}"
        cat <<EOF > docker-compose.yml
version: "3"
services:
  lavalink:
    image: ghcr.io/lavalink-devs/lavalink:4
    container_name: lavalink
    network_mode: "host"
    environment:
      - _JAVA_OPTIONS=-Xmx1024m
    volumes:
      - ./application.yml:/opt/Lavalink/application.yml:ro
      - ./plugins:/opt/Lavalink/plugins
      # Bỏ comment dòng dưới nếu dùng yt-dlp_linux qua hệ điều hành chạy được
      # - ./yt-dlp_linux:/opt/Lavalink/yt-dlp_linux:ro
EOF
        echo -e "${GREEN}Tạo mẫu docker-compose.yml thành công!${NC}"
    fi

    echo -e "${YELLOW}Khởi động Lavalink qua Docker Compose...${NC}"
    docker compose up -d
    echo -e "${GREEN}Chạy thành công! Đang trực tiếp mở Log ngay bây giờ... (Bấm Ctrl+C để thoát Log)${NC}"
    docker compose logs -f
    read -p "Nhấn Enter để quay lại menu..."
}

view_docker_logs() {
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}[LỖI] Không tìm thấy docker-compose.yml! Vui lòng chọn số 8 trước.${NC}"
    else
        echo -e "${CYAN}Đang xem Log của Docker Compose... (Bấm Ctrl+C để thoát)${NC}"
        docker compose logs -f
    fi
    read -p "Nhấn Enter để quay lại menu..."
}

restart_docker() {
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}[LỖI] Không tìm thấy docker-compose.yml!${NC}"
    else
        echo -e "${YELLOW}Đang khởi động lại hệ thống Docker...${NC}"
        docker compose restart
        echo -e "${GREEN}Khởi động lại thành công!${NC}"
    fi
    read -p "Nhấn Enter để quay lại menu..."
}

while true; do
    show_menu
    case $choice in
        1) install_java ;;
        2) install_ytdlp ;;
        3) install_tailscale ;;
        4) config_exitnode ;;
        5) disable_exitnode ;;
        6) download_lavalink ;;
        7) run_lavalink ;;
        8) run_docker_compose ;;
        9) view_docker_logs ;;
        10) restart_docker ;;
        0) echo -e "${GREEN}Đã thoát công cụ quản lý Lavalink!${NC}"; exit 0 ;;
        *) echo -e "${RED}Vui lòng chọn từ 1 đến 10!${NC}"; sleep 1 ;;
    esac
done
