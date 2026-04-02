const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("loopq")
	.setDescription("Lặp lại hàng đợi bài hát hiện tại")
	.setRun(async (client, interaction, options) => {
		let channel = await client.getChannel(client, interaction);
		if (!channel) {
			return;
		}
		
		let player;
		if (client.manager) {
			player = client.manager.getPlayer(interaction.guild.id);
		} else {
			return interaction.reply({ ephemeral: true, 
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription("Nút Lavalink không được kết nối"),
				],
			});
		}
		
		if (!player) {
			return interaction.reply({ ephemeral: true, 
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription("Không có bài hát đang phát."),
				],
				ephemeral: true,
			});
		}
		
		const currentMode = player.repeatMode;
		if (currentMode === "queue") {
			player.setRepeatMode("off");
		} else {
			player.setRepeatMode("queue");
		}
		const queueRepeat = player.repeatMode === "queue" ? "enabled" : "disabled";
		
		interaction.reply({ ephemeral: true, 
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(
						`:thumbsup: | **Lặp hàng đợi đã kích hoạt \`${ queueRepeat }\`**`,
					),
			],
		});
	});

module.exports = command;
