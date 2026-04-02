const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("pause")
	.setDescription("Tạm dừng bài hát đang phát")
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
						.setDescription("Không có bài hát nào đang phát."),
				],
				ephemeral: true,
			});
		}
		
		if (player.paused) {
			return interaction.reply({ ephemeral: true, 
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription("Bài hát đang phát hiện tại đã được tạm dừng rồi!"),
				],
				ephemeral: true,
			});
		}
		
		player.pause();
		return interaction.reply({ ephemeral: true, 
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(`⏸ | **Đã Dừng**`),
			],
		});
	});

module.exports = command;
