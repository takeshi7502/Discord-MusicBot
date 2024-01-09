const { join } = require("path");
const fs = require("fs");

const LoadCommands = () => {
	return new Promise(async (resolve) => {
		let slash = await LoadDirectory("slash");
		let context = await LoadDirectory("context");
		
		resolve({ slash, context });
	});
};

const LoadDirectory = (dir) => {
	return new Promise((resolve) => {
		let commands = [];
		let CommandsDir = join(__dirname, "..", "commands", dir);
		
		fs.readdir(CommandsDir, (err, files) => {
			if (err) {
				throw err;
			}
			
			for (const file of files) {
				let cmd = require(CommandsDir + "/" + file);
				if (!cmd || (dir == "context" && !cmd.command)) {
					return console.log(
						"Không thể tải lệnh: " +
						file.split(".")[0] +
						", Tệp không có lệnh nào",
					);
				}
				if (dir == "context") {
					commands.push(cmd.command);
				} else {
					commands.push(cmd);
				}
			}
			;
			resolve(commands);
		});
	});
};

module.exports = LoadCommands;
