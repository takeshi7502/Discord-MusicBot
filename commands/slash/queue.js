const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { escapeMarkdown } = require('discord.js');
const load = require("lodash");
const pms = require("pretty-ms");

const command = new SlashCommand()
	.setName("queue")
	.setDescription("Hiển thị hàng đợi hiện tại")
	
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
						.setDescription("Không có bài hát nào trong hàng đợi."),
				],
				ephemeral: true,
			});
		}
		
		if (!player.playing) {
			const queueEmbed = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription("Không có bài hát nào đang phát.");
			return interaction.reply({ embeds: [queueEmbed], ephemeral: true });
		}
		
		await interaction.deferReply().catch(() => {
		});
        
		
		if (!player.queue.tracks.length || player.queue.tracks.length === 0) {
            let song = player.queue.current;
            var title = escapeMarkdown(song.info.title)
            title = title.replace(/\]/g,"")
            title = title.replace(/\[/g,"")
			const queueEmbed = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(`**♪ | Đang phát:** [${ title }](${ song.info.uri })`)
				.addFields(
					{
						name: "Thời lượng",
						value: song.info.isStream
							? `\`LIVE\``
							: `\`${ pms(player.position, { colonNotation: true }) } / ${ pms(
								song.info.duration,
								{ colonNotation: true },
							) }\``,
						inline: true,
					},
					{
						name: "Âm lượng",
						value: `\`${ player.volume }\``,
						inline: true,
					},
					{
						name: "Tổng Số Bài Hát",
						value: `\`${ player.queue.tracks.length }\``,
						colonNotation: true,
						inline: true,
					},
				);
			
			await interaction.editReply({
				embeds: [queueEmbed],
			});
		} else {
			let queueDuration = player.queue.tracks.reduce((a, t) => a + (t.info.duration || 0), 0);
			// Don't count streams in total duration
			for (let i = 0; i < player.queue.tracks.length; i++) {
				if (player.queue.tracks[i].info.isStream) {
					queueDuration -= player.queue.tracks[i].info.duration
				}
			}
			
			const mapping = player.queue.tracks.map(
				(t, i) => `\` ${ i + 1 } \` [${ t.info.title }](${ t.info.uri }) [${t.requester ? `<@${t.requester.id || t.requester}>` : 'Unknown'}]`,
			);
			
			const chunk = load.chunk(mapping, 10);
			const pages = chunk.map((s) => s.join("\n"));
			let page = interaction.options.getNumber("page");
			if (!page) {
				page = 0;
			}
			if (page) {
				page = page - 1;
			}
			if (page > pages.length) {
				page = 0;
			}
			if (page < 0) {
				page = 0;
			}
			
			if (player.queue.tracks.length < 11) {
                let song = player.queue.current;
                var title = escapeMarkdown(song.info.title)
                title = title.replace(/\]/g,"")
                title = title.replace(/\[/g,"")
				const embedTwo = new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(
						`**♪ | Đang phát:** [${ title }](${ song.info.uri }) [${song.requester ? `<@${song.requester.id || song.requester}>` : 'Unknown'}]\n\n**Số bài hát trong hàng đợi**\n${ pages[page] }`,
					)
					.addFields(
						{
							name: "Thời lượng của bài hát",
							value: song.info.isStream
								? `\`LIVE\``
								: `\`${ pms(player.position, { colonNotation: true }) } / ${ pms(
									song.info.duration,
									{ colonNotation: true },
								) }\``,
							inline: true,
						},
						{
							name: "Tổng thời lượng của tất cả các bài hát",
							value: `\`${ pms(queueDuration, {
								colonNotation: true,
							}) }\``,
							inline: true,
						},
						{
							name: "Tổng số bài hát",
							value: `\`${ player.queue.tracks.length }\``,
							colonNotation: true,
							inline: true,
						},
					)
					.setFooter({
						text: `Trang ${ page + 1 }/${ pages.length }`,
					});
				
				await interaction
					.editReply({
						embeds: [embedTwo],
					})
					.catch(() => {
					});
			} else {
				let song = player.queue.current;
                var title = escapeMarkdown(song.info.title)
                title = title.replace(/\]/g,"")
                title = title.replace(/\[/g,"")
				const embedThree = new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(
						`**♪ | Đang phát:** [${ title }](${ song.info.uri }) [${song.requester ? `<@${song.requester.id || song.requester}>` : 'Unknown'}]\n\n**Số bài hát trong hàng đợi**\n${ pages[page] }`,
					)
					.addFields(
						{
							name: "Thời lượng của bài hát",
							value: song.info.isStream
								? `\`LIVE\``
								: `\`${ pms(player.position, { colonNotation: true }) } / ${ pms(
									song.info.duration,
									{ colonNotation: true },
								) }\``,
							inline: true,
						},
						{
							name: "Tổng thời lượng của tất cả các bài hát",
							value: `\`${ pms(queueDuration, {
								colonNotation: true,
							}) }\``,
							inline: true,
						},
						{
							name: "Tổng số bài hát",
							value: `\`${ player.queue.tracks.length }\``,
							colonNotation: true,
							inline: true,
						},
					)
					.setFooter({
						text: `Trang ${ page + 1 }/${ pages.length }`,
					});
				
				const buttonOne = new ButtonBuilder()
					.setCustomId("queue_cmd_but_1_app")
					.setEmoji("⏭️")
					.setStyle(ButtonStyle.Primary);
				const buttonTwo = new ButtonBuilder()
					.setCustomId("queue_cmd_but_2_app")
					.setEmoji("⏮️")
					.setStyle(ButtonStyle.Primary);
				
				await interaction
					.editReply({
						embeds: [embedThree],
						components: [
							new ActionRowBuilder().addComponents(buttonTwo, buttonOne),
						],
					})
					.catch(() => {
					});
				
				const collector = interaction.channel.createMessageComponentCollector({
					filter: (b) => {
						if (b.user.id === interaction.user.id) {
							return true;
						} else {
							return b
								.reply({
									content: `Chỉ có **${interaction.user.tag}** mới có thể sử dụng nút này.`,
									ephemeral: true,
								})
								.catch(() => {
								});
						}
					},
					time: 60000 * 5,
					idle: 30e3,
				});
				
				collector.on("collect", async (button) => {
					if (button.customId === "queue_cmd_but_1_app") {
						await button.deferUpdate().catch(() => {
						});
						page = page + 1 < pages.length? ++page : 0;
                        let song = player.queue.current;
                        var title = escapeMarkdown(song.info.title)
                        title = title.replace(/\]/g,"")
                        title = title.replace(/\[/g,"")
						const embedFour = new EmbedBuilder()
							.setColor(client.config.embedColor)
							.setDescription(
								`**♪ | Đang phát:** [${ title }](${ song.info.uri }) [${song.requester ? `<@${song.requester.id || song.requester}>` : 'Unknown'}]\n\n**Số bài hát trong hàng đợi**\n${ pages[page] }`,
							)
							.addFields(
								{
									name: "Thời lượng của bài hát",
									value: song.info.isStream
										? `\`LIVE\``
										: `\`${ pms(player.position, { colonNotation: true }) } / ${ pms(
											song.info.duration,
											{ colonNotation: true },
										) }\``,
									inline: true,
								},
								{
									name: "Tổng thời lượng của tất cả các bài hát",
									value: `\`${ pms(queueDuration, {
										colonNotation: true,
									}) }\``,
									inline: true,
								},
								{
									name: "Tổng số bài hát",
									value: `\`${ player.queue.tracks.length }\``,
									colonNotation: true,
									inline: true,
								},
							)
							.setFooter({
								text: `Trang ${ page + 1 }/${ pages.length }`,
							});
						
						await interaction.editReply({
							embeds: [embedFour],
							components: [
								new ActionRowBuilder().addComponents(buttonTwo, buttonOne),
							],
						});
					} else if (button.customId === "queue_cmd_but_2_app") {
						await button.deferUpdate().catch(() => {
						});
						page = page > 0? --page : pages.length - 1;
                        let song = player.queue.current;
                        var title = escapeMarkdown(song.info.title)
                        title = title.replace(/\]/g,"")
                        title = title.replace(/\[/g,"")
						const embedFive = new EmbedBuilder()
							.setColor(client.config.embedColor)
							.setDescription(
								`**♪ | Đang phát:** [${ title }](${ song.info.uri }) [${song.requester ? `<@${song.requester.id || song.requester}>` : 'Unknown'}]\n\n**Số bài hát trong hàng đợi**\n${ pages[page] }`,
							)
							.addFields(
								{
									name: "Thời lượng của bài hát",
									value: song.info.isStream
										? `\`LIVE\``
										: `\`${ pms(player.position, { colonNotation: true }) } / ${ pms(
											song.info.duration,
											{ colonNotation: true },
										) }\``,
									inline: true,
								},
								{
									name: "Tổng thời lượng của tất cả các bài hát",
									value: `\`${ pms(queueDuration, {
										colonNotation: true,
									}) }\``,
									inline: true,
								},
								{
									name: "Tổng số bài hát",
									value: `\`${ player.queue.tracks.length }\``,
									colonNotation: true,
									inline: true,
								},
							)
							.setFooter({
								text: `Trang ${ page + 1 }/${ pages.length }`,
							});
						
						await interaction
							.editReply({
								embeds: [embedFive],
								components: [
									new ActionRowBuilder().addComponents(buttonTwo, buttonOne),
								],
							})
							.catch(() => {
							});
					} else {
						return;
					}
				});
			}
		}
	});

module.exports = command;
