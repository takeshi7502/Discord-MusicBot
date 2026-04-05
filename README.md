<h1 align="center"><img src="./assets/logo.gif" width="30px"> Discord Music Bot <img src="./assets/logo.gif" width="30px"></h1>

<p align="center">
  <b>English</b> | <a href="./README-vi.md">Tiếng Việt</a>
</p>

## ✨ Latest Updates (Custom Fork)

This is a heavily modified and optimized fork of the original project, bringing modern standards and bypass configurations to the bot!

### What's New in this Version:
 - **Lavalink v4 Support:** Fully migrated from `erela.js` (Lavalink v3) to `lavalink-client` v4.
 - **YouTube Anti-Bot Bypass:** Integrated `yt-dlp` instructions to effectively bypass YouTube's datacenter blocks and "Sign in to confirm you're not a bot" errors.
 - **Voice Channel Status Integration:** The bot now updates the Voice Channel Description with the actively playing song in real-time.
 - **Smart Notifications:** Grouped and optimized controller notifications to keep your bot channels extremely clean.
 - **Robust Orchestration:** Includes a `run.sh` console for one-click Docker-compose management and log viewing.
 - Completely modular Docker environment for easier development and deployment.
 - A WORKING DASHBOARD!!!
 - DB Integration to save your favorite songs.

## 🚧 | Prerequisites

- [Node.js 16+](https://nodejs.org/en/download/)
- [Lavalink Server v4.x.x](https://github.com/lavalink-devs/Lavalink)
- You'll need to run `npm run deploy` or `yarn deploy` to initialize slash commands. _You can do this locally on your PC._

> **NOTE:** Lavalink is required for music functionality. You must have a working Lavalink server (v4 is natively supported) for the bot to work.

## 📝 | Deployment on Ubuntu VPS (Docker & run.sh Recommended)

This project comes with a built-in `run.sh` script to help you manage everything from A to Z!

1. Clone the repository:
```sh
git clone https://github.com/takeshi7502/Discord-MusicBot.git musicbot/ && cd musicbot
```
2. Open the `config.js` file to configure your Bot variables and Lavalink Server v4 information:
```sh
nano config.js
```
*Note: If you use YouTube via Proxy or `yt-dlp`, make sure to configure the `application.yml` file in the `Lavalink/` folder.*

3. Start the Management Console:
```sh
bash run.sh
```
From this console, you can automatically install Docker, build the image, start the Bot, view Logs, and manage operational states fully automatically!

### 💪🏻 Non-Docker Deployment
> Ensure the `config.js` file is completely filled out with your Lavalink Server info.

Install dependencies and Deploy Slash Commands:
```sh
npm install
npm run deploy
```
Start the bot:
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
