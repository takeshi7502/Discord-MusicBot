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

			const oldNode = client.config.nodes?.[0] || {};
			const oldNodeInfo = `${oldNode.id || "N/A"}\`|\`${oldNode.host || "N/A"}:${oldNode.port || "N/A"}\`|\`${oldNode.secure ? "True" : "False"}`;
			const newNode0 = newConfig.nodes?.[0] || {};
			const lavalinkChanged = JSON.stringify(client.config.nodes) !== JSON.stringify(newConfig.nodes);

			// Cập nhật config mới vào client
			client.config = newConfig;
			reloadLog.push(`✅ Đã nạp lại cấu hình (config.js)`);

			// ======== BƯỚC 3: LUÔN KẾT NỐI LẠI LAVALINK ========
			if (lavalinkChanged) {
				reloadLog.push(`🔄 Phát hiện Lavalink thay đổi: \`${oldNode.host || "N/A"}\` → \`${newNode0.host || "N/A"}\``);
			} else {
				reloadLog.push(`🔄 Đang kết nối lại Lavalink...`);
			}

			try {
				// Lưu danh sách player cũ trước khi đảo node
				const activePlayers = [...client.manager.players.values()];

				// Ngắt kết nối tất cả node cũ
				try {
					await client.manager.nodeManager.disconnectAll(true, false);
				} catch (e) {
					client.manager.nodeManager.nodes.clear();
				}
				reloadLog.push(`🗑️ Đã xoá node cũ`);

				// Cập nhật nodes config trong manager
				client.manager.options.nodes = newConfig.nodes;

				// Reset cờ thông báo → cho phép event connect/error gửi lại
				if (client.lavalinkNotified) client.lavalinkNotified.clear();

				// Tạo các node mới
				for (const nodeOpts of newConfig.nodes) {
					client.manager.nodeManager.createNode(nodeOpts);
				}

				// Kết nối tất cả node mới
				const connected = await client.manager.nodeManager.connectAll();
				reloadLog.push(`🚀 Đã kết nối \`${connected}\` node mới thành công!`);

				// SAU KHI RELOAD XONG → Dọn dẹp player cũ
				if (activePlayers.length > 0) {
					reloadLog.push(`🔇 Đang dọn dẹp \`${activePlayers.length}\` trình phát cũ...`);
					for (const player of activePlayers) {
						try {
							// Xoá tin nhắn Now Playing cũ
							const nowPlayingMsg = player.get("nowPlayingMessage");
							if (nowPlayingMsg) {
								await nowPlayingMsg.delete().catch(() => { });
							}
							// Gửi thông báo vào kênh text
							const textChannel = client.channels.cache.get(player.textChannelId);
							if (textChannel) {
								const reloadEmbed = new EmbedBuilder()
									.setColor("#FF8800")
									.setDescription("⚠️ **Bot vừa được cập nhật!**\nBạn dùng `/play` để phát lại nhạc nhé.")
									.setTimestamp();
								await textChannel.send({ embeds: [reloadEmbed] }).catch(() => { });
							}
							// Destroy player
							await player.destroy().catch(() => { });
						} catch (e) { }
					}
					reloadLog.push(`✅ Đã dọn dẹp \`${activePlayers.length}\` trình phát`);
				}

				// Gửi thông báo đổi Lavalink vào kênh setlog (chỉ khi config thay đổi)
				if (lavalinkChanged && client.sendLavalinkNotification) {
					const newNodeInfo = `${newNode0.id || "N/A"}\`|\`${newNode0.host || "N/A"}:${newNode0.port || "N/A"}\`|\`${newNode0.secure ? "True" : "False"}`;
					client.sendLavalinkNotification(
						new EmbedBuilder()
							.setColor("#00AAFF")
							.setDescription(
								`🔄 **Lavalink Đã Thay Đổi**\n` +
								`**Node cũ:** \`${oldNodeInfo}\`\n` +
								`**Node mới:** \`${newNodeInfo}\`\n` +
								`**Kết nối:** ${connected} node`
							)
							.setTimestamp()
					);
				}

			} catch (lavaErr) {
				reloadLog.push(`⚠️ Lỗi khi đảo Lavalink: \`${lavaErr.message}\``);
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
