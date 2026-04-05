<h1 align="center"><img src="./assets/logo.gif" width="30px"> Discord Music Bot <img src="./assets/logo.gif" width="30px"></h1>

## ✨ Latest Updates (Custom Fork)

This is a heavily modified and optimized fork of the original project, bringing modern standards and bypass configurations to the bot!

### What's New in this Version:
 - **Lavalink v4 Support:** Fully migrated from `erela.js` (Lavalink v3) to `lavalink-client` v4.
 - **YouTube Anti-Bot Bypass:** Integrated `yt-dlp` instructions to effectively bypass YouTube's datacenter blocks and "Sign in to confirm you're not a bot" errors!
 - **Voice Channel Status Integration:** The bot now updates the Voice Channel Description with the song actively playing real-time!
 - **Smart Notifications:** Grouped and optimized controller notifications to keep your bot channels extremely clean.
 - **Robust Orchestration:** Includes `run.sh` console for one-click Docker-compose management and log viewing.
 - Completely modular docker environment for easier development and deployment
 - A WORKING DASHBOARD!!!
 - DB Integration for you to save your favorite songs in

## 🚧 | Prerequisites

- [Node.js 16+](https://nodejs.org/en/download/)
- [Lavalink Server v4.x.x](https://github.com/lavalink-devs/Lavalink)
- You'll need to run `npm run deploy` or `yarn deploy`. to initialized the slash commands. _You can do this on your pc
  locally_

> NOTE: Lavalink is needed for music functionality. You need to have a working Lavalink server (v4 supported natively) to make the bot work.

## 📝 | Deploy bot lên VPS Ubuntu (Khuyên Dùng Docker & run.sh)

Dự án đã được trang bị sẵn tệp `run.sh` giúp bạn quản lý từ A-Z!

1. Clone repo về máy:
```sh
git clone https://github.com/takeshi7502/Discord-MusicBot.git musicbot/ && cd musicbot
```
2. Mở file `config.js` để cài đặt thông số Bot và thông tin Lavalink Server v4:
```sh
nano config.js
```
*Lưu ý: Nếu bạn sử dụng Youtube qua Proxy hoặc yt-dlp, hãy cấu hình file `application.yml` trong thư mục `Lavalink/`.*

3. Khởi chạy bảng điều khiển (Console Management):
```sh
bash run.sh
```
Từ bảng điều khiển này, bạn có thể tự động cài đặt Docker, build image, chạy Bot, xem Logs hoặc quản lý các trạng thái hoạt động 1 cách hoàn toàn tự động!

### 💪🏻 Non-Docker
> Đảm bảo file `config.js` đã được điền đủ thông tin Lavalink Server.

Cài đặt thư viện và Deploy Slash Commands:
```sh
npm install
npm run deploy
```
Khởi động bot:
```sh
node index.js
```

## 📝 | [Support Server](https://discord.gg/sbySMS7m3v)

If you have major coding issues with this bot, please join and ask for help.

## 🙏 | Credits & Acknowledgements

**Original Project:** This project is originally created and maintained by **[SudhanPlayz](https://github.com/SudhanPlayz)**.
- Original Repository: [SudhanPlayz/Discord-MusicBot](https://github.com/SudhanPlayz/Discord-MusicBot)

All core credits for the initial architecture go to the original author. This fork purely builds upon their fantastic foundation to provide compatibility with newer technologies and anti-bot bypass mechanisms.

## ✨ | Contributors of Original Repo

Contributions are always welcomed :D Make sure to follow [Contributing.md](/CONTRIBUTING.md)

<a href="https://github.com/SudhanPlayz/Discord-MusicBot/graphs/contributors">
  <img src="https://contributors-img.web.app/image?repo=SudhanPlayz/Discord-MusicBot" />
</a>

## 🌟 | Made with

- [Discord.js](https://discord.js.org/)
- **[Lavalink-Client](https://github.com/EmberGalaxy/lavalink-client)** (Replacing erela.js)
- [Lavalink v4](https://github.com/lavalink-devs/Lavalink) 
- [Express](https://expressjs.com/)
- [Next JS](https://nextjs.org/)
- [Next UI](https://nextui.org)
- [Material UI Icons](https://mui.com/material-ui/material-icons/)
