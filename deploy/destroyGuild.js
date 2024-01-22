//Deletes every commands from every server yikes!!1!!11!!
const readline = require("readline");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const getConfig = require("../util/getConfig");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

(async () => {
	const config = await getConfig();
	const rest = new REST({ version: "9" }).setToken(config.token);
  
	if (!process.argv.includes("--global")) {
	  rl.question(
		"Nhập ID server bạn muốn xóa lệnh: ",
		async (guild) => {
		  console.log("Bot đã được khởi động để xóa lệnh...");
		  await rest
			.put(Routes.applicationGuildCommands(config.clientId, guild), {
			  body: [],
			})
			.catch(console.log);
		  console.log("Bot đã hoàn thành nhiệm vụ, đang thoát...");
		  rl.close();
		},
	  );
	} else {
	  console.log("Bot đã được khởi động để xóa lệnh toàn cầu...");
	  await rest
		.put(Routes.applicationCommands(config.clientId), {
		  body: [],
		})
		.catch(console.log);
	  console.log("Bot đã hoàn thành nhiệm vụ, đang thoát...");
	  process.exit();
	}
  })();  
