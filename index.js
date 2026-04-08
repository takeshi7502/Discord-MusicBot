require('dotenv').config()

const DiscordMusicBot = require("./lib/DiscordMusicBot");
const Server = require("./api/index");

const client = new DiscordMusicBot();

console.log("Make sure to fill in the config.js before starting the bot.");

// Khởi động web dashboard cùng lúc với bot
const server = new Server(client);

const getClient = () => client;

module.exports = {
	getClient,
};
