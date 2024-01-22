const { MessageEmbed, message } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");
const fs = require("fs");
const path = require("path");

const command = new SlashCommand()
	.setName("reload")
	.setDescription("Tải lại tất cả các lệnh")
	.setRun(async (client, interaction, options) => {
		if (interaction.user.id === client.config.adminId) {
			try {
				let ContextCommandsDirectory = path.join(__dirname, "..", "context");
				fs.readdir(ContextCommandsDirectory, (err, files) => {
					files.forEach((file) => {
						delete require.cache[
							require.resolve(ContextCommandsDirectory + "/" + file)
							];
						let cmd = require(ContextCommandsDirectory + "/" + file);
						if (!cmd.command || !cmd.run) {
							return this.warn(
								"❌ Không thể tải lệnh: " +
								file.split(".")[0] +
								", Tệp không chứa cả lệnh và chạy (command/run)",
							);
						}
						client.contextCommands.set(file.split(".")[0].toLowerCase(), cmd);
					});
				});
				
				let SlashCommandsDirectory = path.join(__dirname, "..", "slash");
				fs.readdir(SlashCommandsDirectory, (err, files) => {
					files.forEach((file) => {
						delete require.cache[
							require.resolve(SlashCommandsDirectory + "/" + file)
							];
						let cmd = require(SlashCommandsDirectory + "/" + file);
						
						if (!cmd || !cmd.run) {
							return client.warn(
								"❌ Không thể tải lệnh: " +
								file.split(".")[0] +
								", Tệp không có một lệnh hợp lệ với chức năng chạy",
							);
						}
						client.slashCommands.set(file.split(".")[0].toLowerCase(), cmd);
					});
				});
				
				const totalCmds =
					client.slashCommands.size + client.contextCommands.size;
					client.log(`Đã tải lại ${totalCmds} lệnh!`);
				return interaction.reply({
					embeds: [
						new MessageEmbed()
							.setColor(client.config.embedColor)
							.setDescription(`Đã tải lại thành công \`${ totalCmds }\` Lệnh!`)
							.setFooter({
								text: `${ client.user.username } đã được tải lại bởi ${ interaction.user.username }`,
							})
							.setTimestamp(),
					],
					ephemeral: true,
				});
			} catch (err) {
				console.log(err);
				return interaction.reply({
					embeds: [
						new MessageEmbed()
							.setColor(client.config.embedColor)
							.setDescription(
								"Đã xảy ra một lỗi. Để biết thêm chi tiết, vui lòng kiểm tra console.",
							),
					],
					ephemeral: true,
				});
			}
		} else {
			return interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(client.config.embedColor)
						.setDescription("Bạn không được ủy quyền để sử dụng lệnh này!"),
				],
				ephemeral: true,
			});
		}
	});

module.exports = command;
