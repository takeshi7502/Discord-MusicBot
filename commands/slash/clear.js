const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("clear")
	.setDescription("Xóa tất cả các bài hát khỏi hàng đợi.")
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
						.setDescription("Hiện tại không có bài hát nào đang phát."),
				],
				ephemeral: true,
			});
		}
		
		if (!player.queue || !player.queue.tracks.length || player.queue.tracks.length === 0) {
			let cembed = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription("❌ | **Không hợp lệ, không đủ bài hát để xóa.**");
			
			return interaction.reply({ ephemeral: true,  embeds: [cembed], ephemeral: true });
		}
		
		player.queue.splice(0);
		
		let clearEmbed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setDescription(`✅ | **Đã xóa hàng đợi!**`);
		
		return interaction.reply({ ephemeral: true,  embeds: [clearEmbed] });
	});

module.exports = command;