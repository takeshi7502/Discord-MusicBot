const readline = require("readline");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const getConfig = require("../util/getConfig");
const LoadCommands = require("../util/loadCommands");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

(async () => {
	const config = await getConfig();
	const rest = new REST({ version: "9" }).setToken(config.token);
	const commands = await LoadCommands().then((cmds) => {
		return [].concat(cmds.slash).concat(cmds.context);
	});
	
	rl.question(
		"Nhập ID server bạn muốn triển khai lệnh: ",
		async (guild) => {
			console.log("Đang triển khai lệnh cho server...");
			await rest
				.put(Routes.applicationGuildCommands(config.clientId, guild), {
					body: commands,
				})
				.catch(console.log);
			console.log("Đã triển khai lệnh thành công!");
			rl.close();
		},
	);	
})();
