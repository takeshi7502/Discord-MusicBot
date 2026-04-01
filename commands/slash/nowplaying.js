const { EmbedBuilder } = require("discord.js");
const { escapeMarkdown } = require('discord.js');
const SlashCommand = require("../../lib/SlashCommand");
const prettyMilliseconds = require("pretty-ms");

const command = new SlashCommand()
	.setName("nowplaying")
	.setDescription("Hiển thị bài hát đang phát hiện tại trong kênh thoại.")
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
						.setDescription("Bot không ở trong một kênh thoại."),
				],
				ephemeral: true,
			});
		}
		
		if (!player.playing) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription("Không có bài hát nào đang phát."),
				],
				ephemeral: true,
			});
		}
		
		const song = player.queue.current;
        var title = escapeMarkdown(song.info.title)
        var title = title.replace(/\]/g,"")
        var title = title.replace(/\[/g,"")
		const embed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setAuthor({ name: "Đang Phát", iconURL: client.config.iconURL })
			// show who requested the song via setField, also show the duration of the song
			.setFields([
				{
					name: "Được yêu cầu bởi",
					value: `<@${ song.requester.id }>`,
					inline: true,
				},
				// show duration, if live show live
				{
					name: "Thời lượng",
					value: song.info.isStream
						? `\`LIVE\``
						: `\`${ prettyMilliseconds(player.position, {
							secondsDecimalDigits: 0,
						}) } / ${ prettyMilliseconds(song.info.duration, {
							secondsDecimalDigits: 0,
						}) }\``,
					inline: true,
				},
			])
			// show the thumbnail of the song using displayThumbnail("maxresdefault")
			.setThumbnail(song.info.artworkUrl)
			// show the title of the song and link to it
			.setDescription(`[${ title }](${ song.info.uri })`);
		return interaction.reply({ embeds: [embed] });
	});
module.exports = command;
