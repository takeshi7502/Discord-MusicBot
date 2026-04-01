const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("shuffle")
	.setDescription("Ngẫu nhiên hoá hàng đợi")
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
						.setDescription("Không có bản nhạc đang phát."),
				],
				ephemeral: true,
			});
		}
		
		if (!player.queue || !player.queue.tracks.length || player.queue.tracks.length === 0) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription("Không đủ bài hát trong hàng đợi."),
				],
				ephemeral: true,
			});
		}
		
		//  if the queue is not empty, shuffle the entire queue
		player.queue.shuffle();
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("🔀 | **Đã hoàn thành việc trộn ngẫu nhiên hàng đợi.**"),
			],
		});
	});

module.exports = command;
