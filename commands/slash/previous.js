const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
.setName("previous")
.setDescription("Quay lại bài hát trước đó.")
.setRun(async (client, interaction) => {
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
					.setDescription("Không có bài hát trước đó cho phiên này."),
			],
			ephemeral: true,
		});
	}

	const previousSongs = player.queue.previous;
	const previousSong = previousSongs && previousSongs.length > 0 ? previousSongs[0] : null;
	const currentSong = player.queue.current;
	const nextSong = player.queue.tracks[0];

	if (!previousSong
		|| previousSong === currentSong
		|| previousSong === nextSong) {
		return interaction.reply({ ephemeral: true, 
			embeds: [
				new EmbedBuilder()
					.setColor(0xFF0000)
					.setDescription("Không có bài hát trước đó trong hàng đợi."),
			],
		});
	}

	if (previousSong !== currentSong && previousSong !== nextSong) {
		player.queue.splice(0, 0, currentSong);
		player.play({ clientTrack: previousSong });
	}
	interaction.reply({ ephemeral: true, 
		embeds: [
			new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(
					`⏮ | Bài hát trước đó: **${ previousSong.info.title }**`,
				),
		],
	});
});

module.exports = command;
