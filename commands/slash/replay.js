const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("replay")
	.setDescription("Phát lại bài hát đang phát")
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
						.setDescription("Tôi không đang phát bất kỳ bài hát nào."),
				],
				ephemeral: true,
			});
		}
		
		await interaction.deferReply();
		
		player.seek(0);
		
		let song = player.queue.current;
		return interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(`Phát lại [${ song.info.title }](${ song.info.uri })`),
			],
		});
	});

module.exports = command;
