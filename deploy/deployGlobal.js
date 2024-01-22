const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const getConfig = require("../util/getConfig");
const LoadCommands = require("../util/loadCommands");

(async () => {
	const config = await getConfig();
	const rest = new REST({ version: "9" }).setToken(config.token);
	const commands = await LoadCommands().then((cmds) => {
		return [].concat(cmds.slash).concat(cmds.context);
	});
	
	console.log("Triển khai lệnh ra toàn cầu...");
	await rest
		.put(Routes.applicationCommands(config.clientId), {
			body: commands,
		})
		.catch(console.log);
	console.log("Lệnh đã được triển khai thành công!");
})();
