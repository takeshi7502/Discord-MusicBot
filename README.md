<h1 align="center"><img src="./assets/logo.gif" width="30px"> Discord Music Bot <img src="./assets/logo.gif" width="30px"></h1>

## ✨Latest Updates

v5.1 Is in development! Go check it out [HERE!](https://github.com/wtfnotavailable/Discord-MusicBot)

What do you gain from it? Let us explain:
 - Completely modular docker environment for easier development and deployment
 - A WORKING DASHBOARD!!!
 - DB Integration for you to save your favorite songs in
 - Integrated self hosted Lavalink
 - Dedicated query channel
 - More commands and functionalities
 - And so much more to come!

## 🚧 | Prerequisites

- [Node.js 16+](https://nodejs.org/en/download/)
- [Lavalink Server](https://code.darrennathanael.com/how-to-lavalink)
- You'll need to run `npm run deploy` or `yarn deploy`. to initialized the slash commands. _You can do this on your pc
  locally_

> NOTE: Lavalink is needed for music functionality. You need to have a working Lavalink server to make the bot work.

## 📝 | Important Note if you're Switching from v4 to v5

1. Download and configure v5 in a seperate folder.
2. Kick your bot out of your server.
3. Reinvite the Bot with the right
   scopes. [Example Invite URL (Change CLIENT_ID)](https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=277083450689&scope=bot%20applications.commands)
4. Run `npm run deploy` or `yarn deploy` to initialize the slash commands. _You can do this on your pc locally_

## 📝 | Deploy bot lên VPS Ubuntu với Docker

### Hướng dẫn tạo server lavlink
> Tài liệu cài ở đây [Lavalink](https://blog.darrennathanael.com/post/how-to-lavalink/).
> Chú ý: source bot này chỉ hỗ trợ lavalink v3.x.x
> 1. Cài Azul Zulu java 16 or 17 cho ubuntu [docs](https://docs.azul.com/core/zulu-openjdk/install/debian).
> 2. Tạo thư mục lavalink, lệnh `mkdir lavalink`, cd vào thư mục.
> 3. Tải lavalink, lệnh: `wget <link lavlaink v3 mới nhât>`
> 4. Tạo thư mục plugins, lệnh `mkdir plugins`, cd vào thư mục.
> 5. Tải plugin lavalink, lệnh: `wget <ver youtube-source mới nhất>`, lệnh `cd ..` để quay lại thư mục lavalink.
> 6. Tạo file `application.yml`, lệnh `nano application.yml`, lấy nội dung trong [link](https://gist.github.com/takeshi7502/9633c51ef4a82151beefd5c9afe2587d) dán vào. Ctrl + X, Y Enter lưu.
> 7. Tạo tmux, lệnh `tmux new -s lavalink`, cd vào lavalink, tiếp lệnh `java -jar Lavalink.jar` để chạy lavalink.
> Bấm Ctr + B, D để thoát tmux. Để vào lại tmux bấm lệnh `tmux a -t lavalink`.
> Mẹo: chạy lavalink v4 rồi lấy token youtube sau đó thêm vào file `application.yml`.

### 🐳 Cài Docker cho vps nếu chưa có
> Tài liệu cài ở đây [Install Docker on Ubuntu](https://docs.docker.com/engine/install/ubuntu/).

Bot cần chạy thông qua server lavalink
1. Lấy server free ở đây [Link](https://lavalink.darrennathanael.com/NoSSL/lavalink-without-ssl/)
2. Tự host server lavalink.

Chạy bot với docker:
1. Git clone repo về
```sh
git clone https://github.com/takeshi7502/Discord-MusicBot.git musicbot/ && cd musicbot
```
2. Mở file `config.js` và sửa các thông số. Ctrl + X, Y Enter để lưu lại.
```sh
nano config.js
```
3. Chạy lệnh sau để build và chạy bot
```sh
bash build.sh
```

### 💪🏻 Non-Docker
> The `config.js` file should be configured first. Don't forget to add a lavalink host

Install all dependencies and deploy Slash Commands
```sh
npm install
npm run deploy
```
Start the bot
```sh
node index.js
```

## 📝 | [Support Server](https://discord.gg/sbySMS7m3v)

If you have major coding issues with this bot, please join and ask for help.

## 📸 | Screenshots

Soon

## 🚀 | Deploy

[![Deploy to heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/SudhanPlayz/Discord-MusicBot/tree/v5)
[![Open in Gitpod](https://camo.githubusercontent.com/76e60919474807718793857d8eb615e7a50b18b04050577e5a35c19421f260a3/68747470733a2f2f676974706f642e696f2f627574746f6e2f6f70656e2d696e2d676974706f642e737667)](https://gitpod.io/#https://github.com/SudhanPlayz/Discord-MusicBot/tree/v5)

## ✨ | Contributors

Contributions are always welcomed :D Make sure to follow [Contributing.md](/CONTRIBUTING.md)

<a href="https://github.com/SudhanPlayz/Discord-MusicBot/graphs/contributors">
  <img src="https://contributors-img.web.app/image?repo=SudhanPlayz/Discord-MusicBot" />
</a>

## 🌟 | Made with

- [Discord.js](https://discord.js.org/)
- [Lavalink](https://github.com/freyacodes/Lavalink) with erela.js
- [Express](https://expressjs.com/)
- [Next JS](https://nextjs.org/)
- [Next UI](https://nextui.org)
- [Material UI Icons](https://mui.com/material-ui/material-icons/)
