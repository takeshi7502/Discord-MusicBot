const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("loop")
	.setDescription("Lặp lại bài hát hiện tại")
	.setRun(async (client, interaction, options) => {
		let channel = await client.getChannel(client, interaction);
		if (!channel) {
			return;
		}
		
		let player;
		if (client.manager) {
			player = client.manager.getPlayer(interaction.guild.id);
		} else {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription("Nút Lavalink không được kết nối"),
				],
			});
		}
		
		if (!player) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription("Hiện tại không có bài hát nào đang phát."),
				],
				ephemeral: true,
			});
		}
		
		const currentMode = player.repeatMode;
		if (currentMode === "track") {
			player.setRepeatMode("off");
		} else {
			player.setRepeatMode("track");
		}
		const trackRepeat = player.repeatMode === "track" ? "enabled" : "disabled";
		
		interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(`👍 | **Lặp đã được kích hoạt \`${ trackRepeat }\`**`),
			],
		});
	});

module.exports = command;
