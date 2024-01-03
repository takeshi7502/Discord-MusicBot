const SlashCommand = require("../../lib/SlashCommand");
const {
	MessageActionRow,
	MessageSelectMenu,
	MessageButton,
	MessageEmbed
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
				new MessageEmbed()
					.setColor(client.config.embedColor)
					.setDescription("🔎 | **Đang tìm...**"),
			],
		});

		let player;
		if (client.manager) {
			player = client.manager.players.get(interaction.guild.id);
		} else {
			return interaction.editReply({
				embeds: [
					new MessageEmbed()
						.setColor("RED")
						.setDescription("Nút Lavalink không được kết nối"),
				],
			});
		}

		const args = interaction.options.getString("song");
		if (!args && !player) {
			return interaction.editReply({
				embeds: [
					new MessageEmbed()
						.setColor("RED")
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
			currentTitle = player.queue.current.title;
			currentTitle = currentTitle
				.replace(new RegExp(phrasesToRemove.join('|'), 'gi'), '')
				.replace(/\s*([\[\(].*?[\]\)])?\s*(\|.*)?\s*(\*.*)?$/, '');
		}
		let query = args ? args : currentTitle;
		let lyricsResults = [];

		lyricsApi.search(query).then(async (lyricsData) => {
			if (lyricsData.length !== 0) {
				for (let i = 0; i < client.config.lyricsMaxResults; i++) {
					if (lyricsData[i]) {
						lyricsResults.push({
							label: `${lyricsData[i].title}`,
							description: `${lyricsData[i].artist}`,
							value: i.toString()
						});
					} else { break }
				}

				const menu = new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId("choose-lyrics")
						.setPlaceholder("Choose a song")
						.addOptions(lyricsResults),
				);

				let selectedLyrics = await interaction.editReply({
					embeds: [
						new MessageEmbed()
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

				collector.on("collect", async (interaction) => {
					if (interaction.isSelectMenu()) {
						await interaction.deferUpdate();
						const url = lyricsData[parseInt(interaction.values[0])].url;

						lyricsApi.find(url).then((lyrics) => {
							let lyricsText = lyrics.lyrics;

							const button = new MessageActionRow()
								.addComponents(
									new MessageButton()
										.setCustomId('tipsbutton')
										.setLabel('Tips')
										.setEmoji(`📌`)
										.setStyle('SECONDARY'),
									new MessageButton()
										.setLabel('Source')
										.setURL(url)
										.setStyle('LINK'),
								);

							const musixmatch_icon = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Musixmatch_logo_icon_only.svg/480px-Musixmatch_logo_icon_only.svg.png';
							let lyricsEmbed = new MessageEmbed()
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

							return interaction.editReply({
								embeds: [lyricsEmbed],
								components: [button],
							});

						})
					}
				});

				collector.on("end", async (i) => {
					if (i.size == 0) {
						selectedLyrics.edit({
							content: null,
							embeds: [
								new MessageEmbed()
									.setDescription(
										`Không có bài hát được chọn. Bạn đã mất quá nhiều thời gian để chọn một bản nhạc.`
									)
									.setColor(client.config.embedColor),
							], components: [],
						});
					}
				});

			} else {
				const button = new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setEmoji(`📌`)
							.setCustomId('tipsbutton')
							.setLabel('Tips')
							.setStyle('SECONDARY'),
					);
				return interaction.editReply({
					embeds: [
						new MessageEmbed()
							.setColor("RED")
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
					new MessageEmbed()
						.setColor("RED")
						.setDescription(
							`Một lỗi không xác định đã xảy ra, vui lòng kiểm tra console của bạn.`,
						),
				],
			});
		});

		const collector = interaction.channel.createMessageComponentCollector({
			time: 1000 * 3600
		});

		collector.on('collect', async interaction => {
			if (interaction.customId === 'tipsbutton') {
				await interaction.deferUpdate();
				await interaction.followUp({
					embeds: [
						new MessageEmbed()
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
