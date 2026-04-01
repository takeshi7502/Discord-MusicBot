const SlashCommand = require("../../lib/SlashCommand");
const {
	ActionRowBuilder,
	StringSelectMenuBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder
} = require("discord.js");
const { Rlyrics } = require("rlyrics");
const lyricsApi = new Rlyrics();

const command = new SlashCommand()
	.setName("lyrics")
	.setDescription("Lấy lời bài hát của một bài hát")
	.addStringOption((option) =>
		option
			.setName("song")
			.setDescription("Bài hát để lấy lời bài hát")
			.setRequired(false),
	)
	.setRun(async (client, interaction, options) => {
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("🔎 | **Đang tìm...**"),
			],
		});

		let player;
		if (client.manager) {
			player = client.manager.getPlayer(interaction.guild.id);
		} else {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription("Nút Lavalink không được kết nối"),
				],
			});
		}

		const args = interaction.options.getString("song");
		if (!args && !player) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription("Không có bài hát nào đang phát."),
				],
			});
		}

		let currentTitle = ``;
		const phrasesToRemove = [
			"Full Video", "Full Audio", "Official Music Video", "Lyrics", "Lyrical Video",
			"Feat.", "Ft.", "Official", "Audio", "Video", "HD", "4K", "Remix", "Lyric Video", "Lyrics Video", "8K", 
			"High Quality", "Animation Video", "\\(Official Video\\. .*\\)", "\\(Music Video\\. .*\\)", "\\[NCS Release\\]",
			"Extended", "DJ Edit", "with Lyrics", "Lyrics", "Karaoke",
			"Instrumental", "Live", "Acoustic", "Cover", "\\(feat\\. .*\\)"
		];
		if (!args) {
			currentTitle = player.queue.current.info.title;
			currentTitle = currentTitle
				.replace(new RegExp(phrasesToRemove.join('|'), 'gi'), '')
				.replace(/\s*([\[\(].*?[\]\)])?\\s*(\\|.*)?\\s*(\\*.*)?$/, '');
		}
		let query = args ? args : currentTitle;
		let lyricsResults = [];

		lyricsApi.search(query).then(async (lyricsData) => {
			if (lyricsData.length !== 0) {
				for (let i = 0; i < client.config.lyricsMaxResults; i++) {
					if (lyricsData[i]) {
						lyricsResults.push({
							label: `${lyricsData[i].title}`.substring(0, 100),
							description: `${lyricsData[i].artist}`.substring(0, 100),
							value: i.toString()
						});
					} else { break }
				}

				const menu = new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId("choose-lyrics")
						.setPlaceholder("Chọn một bài hát")
						.addOptions(lyricsResults),
				);

				let selectedLyrics = await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setColor(client.config.embedColor)
							.setDescription(
								`Dưới đây là một số kết quả mà tôi tìm thấy cho \`${query}\`. Vui lòng chọn một bài hát để hiển thị lời trong \`30 giây\`.`
							),
					], components: [menu],
				});

				const filter = (button) => button.user.id === interaction.user.id;

				const collector = selectedLyrics.createMessageComponentCollector({
					filter,
					time: 30000,
				});

				collector.on("collect", async (i) => {
					if (i.isStringSelectMenu()) {
						await i.deferUpdate();
						const url = lyricsData[parseInt(i.values[0])].url;

						lyricsApi.find(url).then((lyrics) => {
							let lyricsText = lyrics.lyrics;

							const button = new ActionRowBuilder()
								.addComponents(
									new ButtonBuilder()
										.setCustomId('tipsbutton')
										.setLabel('Tips')
										.setEmoji(`📌`)
										.setStyle(ButtonStyle.Secondary),
									new ButtonBuilder()
										.setLabel('Source')
										.setURL(url)
										.setStyle(ButtonStyle.Link),
								);

							const musixmatch_icon = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Musixmatch_logo_icon_only.svg/480px-Musixmatch_logo_icon_only.svg.png';
							let lyricsEmbed = new EmbedBuilder()
								.setColor(client.config.embedColor)
								.setTitle(`${lyrics.name}`)
								.setURL(url)
								.setThumbnail(lyrics.icon)
								.setFooter({
									text: 'Lời bài hát được cung cấp bởi MusixMatch.',
									iconURL: musixmatch_icon
								})
								.setDescription(lyricsText);

							if (lyricsText.length === 0) {
								lyricsEmbed
									.setDescription(`**Rất tiếc, chúng tôi không được ủy quyền để hiển thị lời bài hát này.**`)
									.setFooter({
										text: 'Lời bài hát bị hạn chế bởi MusixMatch.',
										iconURL: musixmatch_icon
									})
							}

							if (lyricsText.length > 4096) {
								lyricsText = lyricsText.substring(0, 4050) + "\n\n[...]";
								lyricsEmbed
									.setDescription(lyricsText + `\nBị cắt bớt, lời bài hát quá dài.`)
							}

							return i.editReply({
								embeds: [lyricsEmbed],
								components: [button],
							});

						})
					}
				});

				collector.on("end", async (collected) => {
					if (collected.size == 0) {
						selectedLyrics.edit({
							content: null,
							embeds: [
								new EmbedBuilder()
									.setDescription(
										`Không có bài hát được chọn. Bạn đã mất quá nhiều thời gian để chọn một bản nhạc.`
									)
									.setColor(client.config.embedColor),
							], components: [],
						});
					}
				});

			} else {
				const button = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setEmoji(`📌`)
							.setCustomId('tipsbutton')
							.setLabel('Tips')
							.setStyle(ButtonStyle.Secondary),
					);
				return interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setColor(0xFF0000)
							.setDescription(
								`Không tìm thấy kết quả cho \`${query}\`!\nĐảm bảo bạn đã nhập đúng thông tin tìm kiếm.`,
							),
					], components: [button],
				});
			}
		}).catch((err) => {
			console.error(err);
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription(
							`Một lỗi không xác định đã xảy ra, vui lòng kiểm tra console của bạn.`,
						),
				],
			});
		});

		const tipsCollector = interaction.channel.createMessageComponentCollector({
			time: 1000 * 3600
		});

		tipsCollector.on('collect', async (btnInteraction) => {
			if (btnInteraction.customId === 'tipsbutton') {
				await btnInteraction.deferUpdate();
				await btnInteraction.followUp({
					embeds: [
						new EmbedBuilder()
							.setTitle(`Mẹo Lấy Lời Bài Hát`)
							.setColor(client.config.embedColor)
							.setDescription(
								`Dưới đây là một số mẹo để lấy lời bài hát của bạn một cách chính xác \n\n\
        						1. Thử thêm tên nghệ sĩ phía trước tên bài hát.\n\
        						2. Thử tìm lời bài hát bằng cách nhập trực tiếp truy vấn bài hát bằng bàn phím.\n\
        						3. Tránh tìm kiếm lời bài hát trong các ngôn ngữ khác ngoài tiếng Anh.`,
							),

					], ephemeral: true, components: []
				});
			};
		});
	});

module.exports = command;
