const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("summon")
	.setDescription("Gọi bot vào kênh.")
	.setRun(async (client, interaction, options) => {
		let channel = await client.getChannel(client, interaction);
		if (!interaction.member.voice.channel) {
			const joinEmbed = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(
					"❌ | **Bạn phải ở trong một kênh thoại để sử dụng lệnh này.**",
				);
			return interaction.reply({ ephemeral: true,  embeds: [joinEmbed], ephemeral: true });
		}
		
		let node = await client.getLavalink(client);
		if (!node) {
			return interaction.reply({ ephemeral: true, embeds: [client.ErrorEmbed("Nút Lavalink không được kết nối")] });
		}
		
		let player = client.manager.getPlayer(interaction.guild.id);
		if (!player) {
			player = client.createPlayer(interaction.channel, channel, node);
			await player.connect();
		}
		
		if (channel.id !== player.voiceChannelId) {
			player.setVoiceChannel(channel.id);
			player.connect();
		}
		
		interaction.reply({ ephemeral: true, 
			embeds: [
				client.Embed(`:thumbsup: | **Đã tham gia thành công <#${ channel.id }>!**`),
			],
		});
	});

module.exports = command;
