const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("skip")
	.setDescription("Bỏ qua bài hát hiện tại")
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
						.setDescription("Không có gì để bỏ qua."),
				],
				ephemeral: true,
			});
		} 
        	const song = player.queue.current;
	        const autoQueue = player.get("autoQueue");
                if (player.queue.tracks[0] == undefined && (!autoQueue || autoQueue === false)) {
		return interaction.reply({ ephemeral: true, 
			embeds: [
				new EmbedBuilder()
					.setColor(0xFF0000)
					.setDescription(`Không có gì sau [${ song.info.title }](${ song.info.uri }) trong hàng đợi.`),
			],
		})}
		
		player.stopPlaying(false, false);
		
		interaction.reply({ ephemeral: true, 
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("✅ | **Đã bỏ qua!**"),
			],
		});
	});

module.exports = command;
