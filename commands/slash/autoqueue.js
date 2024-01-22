const colors = require("colors");
const { MessageEmbed } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
	.setName("autoqueue")
	.setDescription("Tự động thêm bài hát vào hàng đợi (bật/tắt)")
	.setRun(async (client, interaction) => {
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
						.setDescription("Không có gì đang phát trong hàng đợi."),
				],
				ephemeral: true,
			});
		}
		
		let autoQueueEmbed = new MessageEmbed().setColor(client.config.embedColor);
		const autoQueue = player.get("autoQueue");
		player.set("requester", interaction.guild.members.me);
		
		if (!autoQueue || autoQueue === false) {
			player.set("autoQueue", true);
		} else {
			player.set("autoQueue", false);
		}
		autoQueueEmbed
		.setDescription(`**Chế độ Tự Động Thêm vào Hàng Đợi** \`${!autoQueue ? "BẬT" : "TẮT"}\``)
		  .setFooter({
		    text: `Âm nhạc liên quan sẽ ${!autoQueue ? "tự động" : "không"} được thêm vào hàng đợi.`
      });
		client.warn(
			`Bot: ${ player.options.guild } | [${ colors.blue(
				"AUTOQUEUE",
			) }] đã được [${ colors.blue(!autoQueue? "BẬT" : "TẮT")}] trong ${
				client.guilds.cache.get(player.options.guild)
					? client.guilds.cache.get(player.options.guild).name
					: "một server"
			}`,
		);
		
		return interaction.reply({ embeds: [autoQueueEmbed] });
	});

module.exports = command;
