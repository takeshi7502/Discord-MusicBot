const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("remove")
	.setDescription("Xóa bài hát bạn không muốn khỏi hàng đợi")
	.addNumberOption((option) =>
		option
			.setName("number")
			.setDescription("Nhập số thứ tự của bài hát.")
			.setRequired(true),
	)
	
	.setRun(async (client, interaction) => {
		const args = interaction.options.getNumber("number");
		
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
						.setDescription("Không có bài hát để xóa."),
				],
				ephemeral: true,
			});
		}
		
		await interaction.deferReply();
		
		const position = Number(args) - 1;
		if (position > player.queue.tracks.length) {
			let thing = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(
					`Hàng đợi hiện tại chỉ có **${player.queue.tracks.length}** bài hát.`,
				);
			return interaction.editReply({ embeds: [thing] });
		}
		
		const song = player.queue.tracks[position];
		player.queue.splice(position, 1);
		
		const number = position + 1;
		let removeEmbed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setDescription(`Đã xóa bài hát số **${number}** khỏi hàng đợi.`);
		return interaction.editReply({ embeds: [removeEmbed] });
	});

module.exports = command;
