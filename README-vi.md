<h1 align="center"><img src="./assets/logo.gif" width="30px"> Discord Music Bot <img src="./assets/logo.gif" width="30px"></h1>

<p align="center">
  <a href="./README.md">English</a> | <b>Tiếng Việt</b>
</p>

## ✨ Cập Nhật Mới Nhất (Bản Fork Tùy Biến)

Đây là phiên bản fork đã được tối ưu hóa sâu và tùy chỉnh từ dự án gốc, mang lại các tính năng hiện đại và cấu hình vượt tường lửa chống bot!

### Các Tính Năng Mới Trong Phiên Bản Này:
 - **Hỗ Trợ Lavalink v4:** Đã chuyển đổi hoàn toàn từ `erela.js` (hỗ trợ Lavalink v3) sang thư viện `lavalink-client` v4.
 - **Vượt Rào Chống Bot YouTube:** Tích hợp bộ cấu hình `yt-dlp` để vượt qua lỗi chặn IP Datacenter của YouTube và lỗi "Đăng nhập để xác nhận bạn không phải là bot".
 - **Cập Nhật Voice Channel Status:** Bot hiện có thể tự động cập nhật Trạng thái Kênh Thoại (Voice Status) với tên bài hát đang phát theo thời gian thực!
 - **Thông Báo Thông Minh:** Gộp chung và tối ưu hóa các thông báo điều khiển giúp kênh nhắn tin của bot cực kỳ gọn gàng, không bị rác và spam màn hình.
 - **Trình Quản Lý Mạnh Mẽ:** Tích hợp file `run.sh` giúp bạn tự động cài đặt Docker-compose, quản lý server vòng đời bot và xem log chỉ với 1 thao tác.
 - Môi trường Docker module hoàn chỉnh giúp việc phát triển và tự triển khai cực kỳ dễ dàng.
 - BẢNG ĐIỀU KHIỂN DASHBOARD TRÊN WEB!!!
 - Tích hợp Database CSDL để lưu lại các bài hát yêu thích.

## 🚧 | Yêu Cầu Hệ Thống

- [Node.js 16+](https://nodejs.org/en/download/)
- [Lavalink Server v4.x.x](https://github.com/lavalink-devs/Lavalink)
- Bạn cần chạy lệnh `npm run deploy` hoặc `yarn deploy` để khởi tạo các lệnh gạch chéo (slash commands). _Bạn hoàn toàn có thể chạy riêng nó trên máy cá nhân._

> **LƯU Ý CỰC KỲ QUAN TRỌNG:** Bot này dùng Lavalink làm não bộ phân tích mảng nhạc. Bắt buộc bạn phải chuẩn bị 1 con Lavalink Server (Hỗ trợ chuẩn bản v4.x) đang hoạt động.

## 📝 | Tự Động Deploy Bot Lên VPS Ubuntu (Khuyên Dùng Docker & run.sh)

Dự án này rất xịn ở chỗ đã được tớ trang bị sẵn vỏ bọc `run.sh` giúp bạn Setup 1 cú Click từ A-Z!

1. Clone thư mục code này về máy chủ VPS của bạn:
```sh
git clone https://github.com/takeshi7502/Discord-MusicBot.git musicbot/ && cd musicbot
```
2. Mở file thư mục `config.js` để chỉnh sửa điền Token Bot và IP của con Lavalink Server v4:
```sh
nano config.js
```
*Lưu ý: Nếu bạn sử dụng YouTube qua mạng Proxy riêng kết hợp yt-dlp, hãy cấu hình lại file `application.yml` trong mục thư mục `Lavalink/`.*

3. Khởi chạy Trình Quản Trị Console VIP:
```sh
bash run.sh
```
Từ bảng điều khiển `run.sh` này, bạn có thể Tự Cài Đặt Môi trường Docker, Builld đóng gói Docker, Khởi chạy Bot, Xem Logs kiểm soát hoạt động một cách thuần túy tự động!

### 💪🏻 Cài Đặt Trực Tiếp Vào Hệ Thống (Bỏ Qua Docker)
> Nhớ kỹ là bạn đã điền đầy đủ mọi Config về Lavalink trước khi cài nhé.

Tải tất cả các gói code thư viện yêu cầu liên kết liên quan và Đăng ký Slash Commands:
```sh
npm install
npm run deploy
```
Nổ máy Bot phát nhạc hoạt động thôi!!!
```sh
node index.js
```

## 📝 | [Trợ Giúp (Qua Support Server)](https://discord.gg/sbySMS7m3v)

Nếu source code này làm khó bạn hoặc gặp những vướng mắc phát sinh trong khâu kỹ thuật, đừng ngần ngại chui thẳng vào Server tớ để nhận support nhé.

## 🙏 | Nguồn Gốc & Lời Cảm Ơn Nhỏ (Credits)

**Dự án Gốc Đặc Biệt Gửi Lời Cảm Ơn:** Khởi thủy của mã code này nguyên mẫu được tạo dựng và bảo trì bởi vị huynh đài **[SudhanPlayz](https://github.com/SudhanPlayz)**.
- Link Repository Kho Code Gốc: [SudhanPlayz/Discord-MusicBot](https://github.com/SudhanPlayz/Discord-MusicBot)

Bao nhiêu tinh hoa thiết kế làm nên nền móng cho code bot thuộc về tác giả tiên phong gốc. Cổ nhân có câu Uống nước nhớ Nguồn! Bản Fork phái sinh này chủ yếu vác thêm hàng nóng Lavalink Version 4, cấu trúc lại Code thông báo và chèn thêm mảng chống bot bảo hộ YouTube thôi ạ!

## ✨ | Những Bậc Thầy Đóng Góp Cho Original Repo

Contributions are always welcomed :D Nhớ ngó mắt xem qua phần [Contributing.md](/CONTRIBUTING.md)

<a href="https://github.com/SudhanPlayz/Discord-MusicBot/graphs/contributors">
  <img src="https://contributors-img.web.app/image?repo=SudhanPlayz/Discord-MusicBot" />
</a>

## 🌟 | Các Công Nghệ Trụ Cột Được Gắn Cùng

- [Discord.js](https://discord.js.org/)
- **[Lavalink-Client](https://github.com/EmberGalaxy/lavalink-client)** (Thư viện xịn nhất, tiễn vong cái erela.js cũ rồi)
- [Lavalink v4](https://github.com/lavalink-devs/Lavalink) 
- [Express](https://expressjs.com/)
- [Next JS](https://nextjs.org/)
- [Next UI](https://nextui.org)
- [Material UI Icons](https://mui.com/material-ui/material-icons/)
