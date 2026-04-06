const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");
const fs = require("fs");
const path = require("path");

const command = new SlashCommand()
	.setName("reload")
	.setDescription("Tải lại tất cả các lệnh và cấu hình Lavalink")
	.setAdminOnly(true)
	.setRun(async (client, interaction, options) => {
		if (interaction.user.id !== client.config.adminId) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setDescription("Bạn không được ủy quyền để sử dụng lệnh này!"),
				],
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		try {
			let reloadLog = [];

			// ======== BƯỚC 1: TẢI LẠI TẤT CẢ LỆNH ========
			let ContextCommandsDirectory = path.join(__dirname, "..", "context");
			fs.readdirSync(ContextCommandsDirectory).forEach((file) => {
				delete require.cache[require.resolve(ContextCommandsDirectory + "/" + file)];
				let cmd = require(ContextCommandsDirectory + "/" + file);
				if (cmd.command && cmd.run) {
					client.contextCommands.set(file.split(".")[0].toLowerCase(), cmd);
				}
			});

			let SlashCommandsDirectory = path.join(__dirname, "..", "slash");
			fs.readdirSync(SlashCommandsDirectory).forEach((file) => {
				delete require.cache[require.resolve(SlashCommandsDirectory + "/" + file)];
				let cmd = require(SlashCommandsDirectory + "/" + file);
				if (cmd && cmd.run) {
					client.slashCommands.set(file.split(".")[0].toLowerCase(), cmd);
				}
			});

			const totalCmds = client.slashCommands.size + client.contextCommands.size;
			reloadLog.push(`✅ Đã tải lại \`${totalCmds}\` lệnh`);

			// ======== BƯỚC 2: TẢI LẠI CONFIG ========
			const configPath = path.resolve(__dirname, "..", "..", "config.js");
			// Nếu có dev-config thì ưu tiên
			const devConfigPath = path.resolve(__dirname, "..", "..", "dev-config.js");

			let newConfig;
			if (fs.existsSync(devConfigPath)) {
				delete require.cache[require.resolve(devConfigPath)];
				newConfig = require(devConfigPath);
			} else {
				delete require.cache[require.resolve(configPath)];
				newConfig = require(configPath);
			}

			// Cập nhật config mới vào client
			client.config = newConfig;
			reloadLog.push(`✅ Đã nạp lại cấu hình (config.js)`);

			// ======== BƯỚC 4: TẢI LẠI EVENTS ========
			const eventsDir = path.join(__dirname, "..", "..", "events");
			fs.readdirSync(eventsDir).forEach((file) => {
				if (!file.endsWith(".js")) return;
				const eventPath = path.join(eventsDir, file);
				delete require.cache[require.resolve(eventPath)];
			});
			reloadLog.push(`✅ Đã xoá cache Events`);

			// ======== KẾT QUẢ ========
			client.log(`Reload bởi ${interaction.user.tag}: ${reloadLog.join(" | ")}`);

			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor("#00FF00")
						.setAuthor({ name: "♻️ Reload Hoàn Tất!" })
						.setDescription(reloadLog.join("\n"))
						.setFooter({
							text: `Thực hiện bởi ${interaction.user.username}`,
						})
						.setTimestamp(),
				],
			});

		} catch (err) {
			console.error("Reload error:", err);
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor("#FF0000")
						.setDescription(`❌ Lỗi khi Reload: \`${err.message}\``),
				],
			});
		}
	});

module.exports = command;
