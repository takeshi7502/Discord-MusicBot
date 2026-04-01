const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("skipto")
	.setDescription("bỏ qua đến một bài hát cụ thể trong hàng đợi")
	.addNumberOption((option) =>
		option
			.setName("number")
			.setDescription("Số lượng bản nhạc để bỏ qua đến")
			.setRequired(true),
	)
	
	.setRun(async (client, interaction, options) => {
		const args = interaction.options.getNumber("number");
		//const duration = player.queue.current.info.duration
		
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
						.setDescription("Tôi không ở trong một kênh."),
				],
				ephemeral: true,
			});
		}
		
		await interaction.deferReply();
		
		const position = Number(args);
		
		try {
			if (!position || position < 0 || position > player.queue.tracks.length) {
				let thing = new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("❌ | Vị trí không hợp lệ!");
				return interaction.editReply({ embeds: [thing] });
			}
			
			player.queue.splice(0, position - 1);
			player.stopPlaying(false, false);
			
			let thing = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription("✅ | Đã bỏ qua đến vị trí chỉ định " + position);
			
			return interaction.editReply({ embeds: [thing] });
		} catch {
			if (position === 1) {
				player.stopPlaying(false, false);
			}
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setDescription("✅ | Đã bỏ qua đến vị trí chỉ định " + position),
				],
			});
		}
	});

module.exports = command;
