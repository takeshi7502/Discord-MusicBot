const SlashCommand = require("../../lib/SlashCommand");
const { MessageEmbed } = require("discord.js");

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
			player = client.manager.players.get(interaction.guild.id);
		} else {
			return interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor("RED")
						.setDescription("Nút Lavalink không được kết nối"),
				],
			});
		}
		
		if (!player) {
			return interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor("RED")
						.setDescription("Không có gì để bỏ qua."),
				],
				ephemeral: true,
			});
		} 
        	const song = player.queue.current;
	        const autoQueue = player.get("autoQueue");
                if (player.queue[0] == undefined && (!autoQueue || autoQueue === false)) {
		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor("RED")
					.setDescription(`Không có gì sau [${ song.title }](${ song.uri }) trong hàng đợi.`),
			],
		})}
		
		player.queue.previous = player.queue.current;
		player.stop();
		
		interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor(client.config.embedColor)
					.setDescription("✅ | **Đã bỏ qua!**"),
			],
		});
	});

module.exports = command;
