#!/bin/bash

# Màu sắc hiển thị
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Hàm báo lỗi và dừng script
die() {
    echo -e "${RED}❌ LỖI: $1${NC}"
    exit 1
}

echo -e "${CYAN}===================================================${NC}"
echo -e "${GREEN}🎵 Lavalink Auto-Deploy Script - Kèm tính năng chống IP-Ban 🎵${NC}"
echo -e "${CYAN}===================================================${NC}"

# Chế độ Menu
echo "Vui lòng chọn tính năng:"
echo "1. Cài đặt Lavalink (Dùng file nội bộ có sẵn, có báo cáo tổng kết)"
echo "2. Khởi động lại Lavalink (Systemctl Restart)"
echo "3. Xem Log trực tiếp của Lavalink (Journalctl)"
read -p "Lựa chọn của bạn [1-3]: " MENU_CHOICE

# -----------------------------------------------------
# MENU 2: RESTART
if [ "$MENU_CHOICE" == "2" ]; then
    echo -e "${YELLOW}Đang khởi động lại Lavalink...${NC}"
    sudo systemctl restart lavalink || die "Không thể khởi động lại lavalink service"
    echo -e "${GREEN}Xong!${NC}"
    exit 0
fi

# -----------------------------------------------------
# MENU 3: XEM LOG
if [ "$MENU_CHOICE" == "3" ]; then
    sudo journalctl -u lavalink -f -n 100
    exit 0
fi

# -----------------------------------------------------
# MENU 1: SETUP (CẢI TIẾN)
if [ "$MENU_CHOICE" != "1" ]; then
    die "Lựa chọn không hợp lệ! Thoát!"
fi

echo -e "\n${YELLOW}[1] Kiểm tra điều kiện đầu vào...${NC}"
if [ "$EUID" -ne 0 ]; then
    die "Vui lòng chạy script này dưới quyền Root (thêm sudo ở trước)!"
fi

if [ ! -f "Lavalink.jar" ]; then
    die "Không tìm thấy file 'Lavalink.jar' trong thư mục hiện tại. Vui lòng tải về hoặc copy vào trước!"
fi

if [ ! -f "example.vps.application.yml" ]; then
    die "Không tìm thấy file 'example.vps.application.yml' trong thư mục hiện tại."
fi

# Nhận diện hãng VPS
ORG_INFO=$(curl -s ipinfo.io/org || echo "Unknown")
if [[ "$ORG_INFO" == *"Contabo"* ]]; then
    VPS_TYPE="Contabo"
elif [[ "$ORG_INFO" == *"Vultr"* || "$ORG_INFO" == *"Choopa"* ]]; then
    VPS_TYPE="Vultr"
else
    VPS_TYPE="Khác ($ORG_INFO)"
fi

# Tự động dò IPv6
MAC_IFACE=$(ip route get 8.8.8.8 2>/dev/null | awk -- '{printf $5}')
IPV6_PREFIX=$(ip -6 addr show scope global | grep inet6 | awk '{print $2}' | cut -d: -f1,2,3,4 | head -n1)
if [ -n "$IPV6_PREFIX" ]; then
    DEFAULT_IPV6="${IPV6_PREFIX}::/64"
else
    DEFAULT_IPV6=""
fi

echo -e "\n${YELLOW}[2] Thu thập thông tin cấu hình...${NC}"

# Nhập Port
read -p "Nhập Port cho Lavalink [Mặc định: 3333]: " LAVA_PORT
LAVA_PORT=${LAVA_PORT:-3333}

# Nhập Pass
read -p "Nhập mật khẩu cho Lavalink [Mặc định: takeshi]: " LAVA_PASS
LAVA_PASS=${LAVA_PASS:-takeshi}

# Nhập IPv6 nếu không dò được hoặc muốn đổi
if [ -n "$DEFAULT_IPV6" ]; then
    read -p "Dải IPv6 được tự động dò là [$DEFAULT_IPV6]. Nhấn Enter để dùng dải này hoặc nhập dải khác: " IPV6_BLOCK
    IPV6_BLOCK=${IPV6_BLOCK:-$DEFAULT_IPV6}
else
    read -p "Không dò được IPv6 tự động. Vui lòng nhập dải IPv6/64 của bạn (VD: 2401:c080::/64): " IPV6_BLOCK
fi
if [ -z "$IPV6_BLOCK" ]; then die "Bạn không được để trống dải IPv6!"; fi

# Nhập YouTube OAuth2 Token (Nếu đã có)
echo -e "\n${CYAN}--- Cấu hình YouTube OAuth2 ---${NC}"
echo "Nếu bạn LÀM MỚI TỪ ĐẦU, hãy để trống ấn Enter, script sẽ tự kích hoạt Java để xin mã Google."
echo "Nếu bạn ĐÃ CÓ MÃ REFRESH TOKEN (bắt đầu bằng 1//...), hãy dán luôn vào đây để bỏ qua bước xin mã:"
read -p "Nhập YouTube Refresh Token (Nhấn Enter để tự động tạo mã): " YOUTUBE_TOKEN

# Nhập Spotify (Tùy chọn)
echo -e "\n${CYAN}--- Cấu hình Spotify (Tùy chọn) ---${NC}"
read -p "Nhập Spotify Client ID (Nhấn Enter để bỏ qua): " SPOTIFY_ID
read -p "Nhập Spotify Client Secret (Nhấn Enter để bỏ qua): " SPOTIFY_SECRET

# ==========================================
# BẢNG TỔNG KẾT TRƯỚC KHI CHẠY (CONFIRMATION)
# ==========================================
echo -e "\n${CYAN}===================================================${NC}"
echo -e "${GREEN}📋 BẢNG TỔNG KẾT THÔNG TIN TRƯỚC KHI THỰC THI 📋${NC}"
echo -e "${CYAN}===================================================${NC}"
echo -e "▶ Loại VPS:        ${YELLOW}$VPS_TYPE${NC}"
echo -e "▶ Dải IPv6:        ${YELLOW}$IPV6_BLOCK${NC}"
echo -e "▶ Port Lavalink:   ${YELLOW}$LAVA_PORT${NC}"
echo -e "▶ Pass Lavalink:   ${YELLOW}$LAVA_PASS${NC}"

if [ -n "$YOUTUBE_TOKEN" ]; then
    echo -e "▶ YouTube Token:   ${GREEN}Đã nhập sẵn (Sẽ bỏ qua bước xin mã rút gọn)${NC}"
else
    echo -e "▶ YouTube Token:   ${YELLOW}Chưa có (Sẽ chạy ngầm Lavalink để sinh code xác thực)${NC}"
fi

if [ -n "$SPOTIFY_ID" ]; then
    echo -e "▶ Spotify ID:      ${YELLOW}$SPOTIFY_ID${NC}"
else
    echo -e "▶ Spotify:         ${RED}Bỏ qua (Trống)${NC}"
fi
echo -e "▶ File Lavalink:   ${YELLOW}Có sẵn (Không download)${NC}"
echo -e "▶ File Mẫu (YML):  ${YELLOW}Sẽ copy từ example.vps.application.yml${NC}"
echo -e "${CYAN}===================================================${NC}"

read -p "❓ Bạn có chắc chắn mọi thông tin trên đã chính xác và muốn cấu hình? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo -e "${RED}Đã hủy quá trình cài đặt!${NC}"
    exit 0
fi

# ==========================================
# THỰC THI (BÁO LỖI NẾU CÓ DỪNG NGAY)
# ==========================================
echo -e "\n${YELLOW}[3] Kiểm tra công cụ cần thiết...${NC}"
for cmd in java docker docker-compose jq ufw curl wget; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}Chưa cài đặt $cmd. Đang tiến hành cài...${NC}"
        apt-get update -y || die "Update apt hệ thống thất bại"
        # Chỉ cài những phần tử cần thiết
        apt-get install -y default-jre docker.io docker-compose jq ufw curl wget || die "Cài đặt gói $cmd thất bại"
        break
    fi
done

echo -e "\n${YELLOW}[4] Cấu hình file application.yml...${NC}"
cp example.vps.application.yml application.yml || die "Copy file cấu hình thất bại"

# Đổi thông tin IP, pass, port
sed -i "s|\[IP_ADDRESS\]|$IPV6_BLOCK|g" application.yml || die "Lỗi ghi IPv6 vào file config"
sed -i "s|port: 3333|port: $LAVA_PORT|g" application.yml || die "Lỗi ghi port vào file config"
sed -i "s|password: \"takeshi\"|password: \"$LAVA_PASS\"|g" application.yml || die "Lỗi ghi pass vào config"

# Ghi Spotify
if [ -n "$SPOTIFY_ID" ]; then
    sed -i "s|clientId: \"\"|clientId: \"$SPOTIFY_ID\"|g" application.yml
fi
if [ -n "$SPOTIFY_SECRET" ]; then
    sed -i "s|clientSecret: \"\"|clientSecret: \"$SPOTIFY_SECRET\"|g" application.yml
fi

# Ghi Youtube Token nếu đã có nhập thủ công
if [ -n "$YOUTUBE_TOKEN" ]; then
    sed -i "s|refreshToken: \"\"|refreshToken: \"$YOUTUBE_TOKEN\"|g" application.yml || die "Lỗi ghi YouTube Token vào config"
fi

echo -e "\n${YELLOW}[5] Thiết lập YT-Cipher qua Docker...${NC}"
if [ ! -d "yt-cipher" ]; then
    git clone https://github.com/kikkia/yt-cipher.git || die "Lỗi Clone YT-Cipher"
fi
cd yt-cipher || die "Không vào được thư mục yt-cipher"
docker compose up -d || die "Chạy Docker cho YT-Cipher thất bại"
cd ..

echo -e "\n${YELLOW}[6] Tối ưu mạng IPv6...${NC}"
sysctl -w net.ipv6.ip_nonlocal_bind=1 || die "Lỗi bật ip_nonlocal_bind"
grep -q "net.ipv6.ip_nonlocal_bind" /etc/sysctl.conf || echo 'net.ipv6.ip_nonlocal_bind=1' >> /etc/sysctl.conf

if [[ "$VPS_TYPE" == *"Vultr"* ]]; then
    if ! command -v ndppd &> /dev/null; then
        apt-get install -y ndppd || die "Lỗi cài đặt ndppd"
    fi
    cat <<EOF > /etc/ndppd.conf
route-ttl 30000
proxy $MAC_IFACE {
    router yes
    timeout 500
    ttl 30000
    rule $IPV6_BLOCK {
        static
    }
}
EOF
    systemctl restart ndppd || die "Lỗi khởi động ndppd"
    systemctl enable ndppd
fi

ip -6 route replace local $IPV6_BLOCK dev lo 2>/dev/null || echo "Bỏ qua... Route IPv6 đã tồn tại."

echo -e "\n${YELLOW}[7] Mở cổng Firewall (UFW) cho Port $LAVA_PORT...${NC}"
ufw allow $LAVA_PORT/tcp || echo "Cảnh báo: Không thể nới port bằng UFW"

echo -e "\n${YELLOW}[8] Cấu hình Token Youtube (OAuth)...${NC}"
fuser -k $LAVA_PORT/tcp 2>/dev/null || true

if [ -n "$YOUTUBE_TOKEN" ]; then
    echo -e "${GREEN}=> Đã có Token ($YOUTUBE_TOKEN), bỏ qua phần chạy thử Lavalink!${NC}"
else
    echo -e "${CYAN}Chưa có Token! Đang khởi động Lavalink (Vui lòng chờ. Quá trình có thể mất lên tới 1 phút)...${NC}"
    stdbuf -oL java -jar Lavalink.jar | while IFS= read -r line; do
        echo "$line"
        if [[ "$line" == *"OAUTH INTEGRATION: To give youtube-source access"* ]]; then
            echo -e "\n${RED}========================================================================${NC}"
            echo -e "${GREEN}🚨🚨🚨 HÀNH ĐỘNG CẦN THIẾT 🚨🚨🚨${NC}"
            echo -e "${YELLOW}=> VUI LÒNG MỞ TRÌNH DUYỆT CỦA BẠN VÀ NHẬP MÃ BÊN TRÊN ĐỂ XÁC THỰC!${NC}"
            echo -e "${RED}========================================================================${NC}\n"
        fi
        if [[ "$line" == *"Store your refresh token"* ]]; then
            TOKEN=$(echo "$line" | grep -o "1//[a-zA-Z0-9_-]*" | head -n1)
            if [ -n "$TOKEN" ]; then
                echo -e "\n${GREEN}🎉 Đã bắt được Refresh Token: $TOKEN 🎉${NC}"
                sed -i "s|refreshToken: \"\"|refreshToken: \"$TOKEN\"|g" application.yml || die "Ghi token thất bại"
            else
                echo -e "\n${RED}Cảnh báo: Thấy token nhưng Regex gắp không được!${NC}"
            fi
            
            pkill -f "java -jar Lavalink.jar"
            break
        fi
        if [[ "$line" == *"Lavalink is ready to accept connections"* ]]; then
            pkill -f "java -jar Lavalink.jar"
            break
        fi
    done
fi

echo -e "\n${YELLOW}[9] Thiết lập SystemD Service để chạy ngầm...${NC}"
cat <<EOF > /etc/systemd/system/lavalink.service
[Unit]
Description=Lavalink Background Service
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/java -jar Lavalink.jar
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload || die "Lỗi reload systemctl"
systemctl enable lavalink
systemctl start lavalink || die "Lỗi không thể khởi động service Lavalink"

echo -e "\n${GREEN}===================================================${NC}"
echo -e "${GREEN}✅ HOÀN TẤT CÀI ĐẶT LAVALINK!${NC}"
echo -e "${CYAN}Kiểm tra trạng thái bằng lệnh:${NC}"
echo -e "systemctl status lavalink"
echo -e "journalctl -u lavalink -f -n 100"
echo -e "${GREEN}===================================================${NC}"
