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

			const oldNodeHost = client.config.nodes?.[0]?.host || "N/A";
			const newNodeHost = newConfig.nodes?.[0]?.host || "N/A";
			const lavalinkChanged = JSON.stringify(client.config.nodes) !== JSON.stringify(newConfig.nodes);

			// Cập nhật config mới vào client
			client.config = newConfig;
			reloadLog.push(`✅ Đã nạp lại cấu hình (config.js)`);

			// ======== BƯỚC 3: ĐẢO LAVALINK (NẾU CÓ THAY ĐỔI) ========
			if (lavalinkChanged) {
				reloadLog.push(`🔄 Phát hiện Lavalink thay đổi: \`${oldNodeHost}\` → \`${newNodeHost}\``);

				try {
					// Ngắt kết nối tất cả node cũ
					const existingNodes = [...client.manager.nodeManager.nodes.values()];
					for (const node of existingNodes) {
						try {
							node.destroy(0, false); // Ngắt kết nối, không reconnect
						} catch (e) {
							// Bỏ qua lỗi nếu node đã ngắt rồi
						}
					}
					client.manager.nodeManager.nodes.clear();
					reloadLog.push(`🗑️ Đã ngắt \`${existingNodes.length}\` node cũ`);

					// Thêm và kết nối các node mới
					for (const nodeOpts of newConfig.nodes) {
						await client.manager.nodeManager.createNode(nodeOpts);
					}
					reloadLog.push(`🚀 Đã kết nối \`${newConfig.nodes.length}\` node mới thành công!`);

				} catch (lavaErr) {
					reloadLog.push(`⚠️ Lỗi khi đảo Lavalink: \`${lavaErr.message}\``);
				}
			} else {
				reloadLog.push(`ℹ️ Lavalink không thay đổi, bỏ qua`);
			}

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
