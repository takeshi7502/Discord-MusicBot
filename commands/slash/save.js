const SlashCommand = require("../../lib/SlashCommand");
const { MessageEmbed } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");

const command = new SlashCommand()
	.setName("save")
	.setDescription("Lưu bài hát hiện tại vào DM.")
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
						.setDescription("Hiện tại không có bài hát nào đang phát."),
				],
				ephemeral: true,
			});
		}
		
		const sendtoDmEmbed = new MessageEmbed()
			.setColor(client.config.embedColor)
			.setAuthor({
				name: "Bài hát đã lưu",
				iconURL: `${ interaction.user.displayAvatarURL({ dynamic: true }) }`,
			})
			.setDescription(
				`**Đã lưu [${player.queue.current.title}](${player.queue.current.uri}) vào tin nhắn riêng của bạn.**`,
			)
			.addFields(
				{
					name: "Thời lượng của bài hát",
					value: `\`${ prettyMilliseconds(player.queue.current.duration, {
						colonNotation: true,
					}) }\``,
					inline: true,
				},
				{
					name: "Tác giả của bài hát",
					value: `\`${ player.queue.current.author }\``,
					inline: true,
				},
				{
					name: "Server được yêu cầu",
					value: `\`${ interaction.guild }\``,
					inline: true,
				},
			);
		
		interaction.user.send({ embeds: [sendtoDmEmbed] });
		
		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor(client.config.embedColor)
					.setDescription(
						"Vui lòng kiểm tra **DMs** của bạn. Nếu bạn không nhận được bất kỳ tin nhắn nào từ tôi, hãy đảm bảo rằng **DMs** của bạn đang mở.",
					),
			],
			ephemeral: true,
		});
	});

module.exports = command;
