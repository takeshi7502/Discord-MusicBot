const { Router } = require("express");
const api = Router();
const { getClient } = require("../../");
const Auth = require("../middlewares/auth");

// Public stats API — no auth required for landing page
api.get("/", (req, res) => {
	const client = getClient();
	let data = {
		name: client.user ? client.user.username : "Music Bot",
		avatar: client.user ? client.user.displayAvatarURL() : "",
		version: require("../../package.json").version || "6.0-alpha",
		commandsRan: client.commandsRan,
		users: client.users.cache.size,
		servers: client.guilds.cache.size,
		songsPlayed: client.songsPlayed,
	}
	res.json(data);
})

module.exports = api
