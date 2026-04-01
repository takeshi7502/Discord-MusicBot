const { EmbedBuilder } = require("discord.js");
/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {import("discord.js").ButtonInteraction} interaction
 */
module.exports = async (client, interaction) => {
	let guild = client.guilds.cache.get(interaction.customId.split(":")[1]);
	let property = interaction.customId.split(":")[2];
	let player = client.manager.getPlayer(guild.id);

	if (!player) {
		await interaction.reply({
			embeds: [
				client.Embed("❌ | **Không có người chơi để kiểm soát trong máy chủ này.**"),
			],
		});
		setTimeout(() => {
			interaction.deleteReply().catch(() => {});
		}, 5000);
		return;
	}
	if (!interaction.member.voice.channel) {
		const joinEmbed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setDescription(
				"❌ | **Bạn phải ở trong một kênh thoại để sử dụng hành động này!**",
			);
		return interaction.reply({ embeds: [joinEmbed], ephemeral: true });
	}

	if (
		interaction.guild.members.me.voice.channel &&
		!interaction.guild.members.me.voice.channel.equals(interaction.member.voice.channel)
	) {
		const sameEmbed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setDescription(
				"❌ | **Bạn phải ở trong cùng một kênh thoại với bot để sử dụng lệnh này!**",
			);
		return await interaction.reply({ embeds: [sameEmbed], ephemeral: true });
	}

	if (property === "Stop") {
		player.queue.clear();
		player.stopPlaying(false, false);
		player.set("autoQueue", false);
		client.warn(`Người chơi: ${ player.guildId } | Đã dừng trình phát nhạc.`);
		const msg = await interaction.channel.send({
			embeds: [
				client.Embed(
					"⏹️ | **Đã dừng trình phát nhạc**",
				),
			],
		});
		setTimeout(() => {
			msg.delete().catch(() => {});
		}, 5000);

		interaction.update({
			components: [client.createController(player.guildId, player)],
		});
		return;
	}

	// if theres no previous song, return an error.
	if (property === "Replay") {
		const previousSongs = player.queue.previous;
		const previousSong = previousSongs && previousSongs.length > 0 ? previousSongs[0] : null;
		const currentSong = player.queue.current;
		const nextSong = player.queue.tracks[0];
        if (!previousSong ||
            previousSong === currentSong ||
            previousSong === nextSong) {
            
           return interaction.reply({
                        ephemeral: true,
			embeds: [
				new EmbedBuilder()
					.setColor(0xFF0000)
					.setDescription(`Không có bài hát trước đó được phát.`),
			],
		});
    }
		if (previousSong !== currentSong && previousSong !== nextSong) {
			player.queue.splice(0, 0, currentSong);
			player.play({ clientTrack: previousSong });
			return interaction.deferUpdate();
		}
	}

	if (property === "PlayAndPause") {
		if (!player || (!player.playing && player.queue.tracks.length === 0)) {
			const msg = await interaction.channel.send({
                                ephemeral: true,
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription("Hiện tại không có bài hát nào đang được phát."),
				],
			});
			setTimeout(() => {
				msg.delete().catch(() => {});
			}, 5000);
			return interaction.deferUpdate();
		} else {

			if (player.paused) {
				player.resume();
			} else {
				player.pause();
			}
			client.warn(`Người chơi: ${player.guildId} | ${player.paused ? "Tạm dừng" : "Tiếp tục"} người chơi thành công`);

			return interaction.update({
				components: [client.createController(player.guildId, player)],
			});
		}
	}

	if (property === "Next") {
                const song = player.queue.current;
	        const autoQueue = player.get("autoQueue");
                if (player.queue.tracks.length === 0 && (!autoQueue || autoQueue === false)) {
		return interaction.reply({
                        ephemeral: true,
			embeds: [
				new EmbedBuilder()
					.setColor(0xFF0000)
					.setDescription(`Không có gì sau [${song.info.title}](${song.info.uri}) trong hàng đợi.`),
			],
		})} else player.stopPlaying(false, false);
		return interaction.deferUpdate();
    }

	if (property === "Loop") {
		if (player.repeatMode === "track") {
			player.setRepeatMode("queue");
		} else if (player.repeatMode === "queue") {
			player.setRepeatMode("off");
		} else {
			player.setRepeatMode("track");
		}
		client.warn(`Người chơi: ${player.guildId} | Đã bật/tắt lặp ${player.repeatMode === "track" ? "bài hát" : player.repeatMode === "queue" ? "hàng đợi" : "tất cả"} thành công`);

		interaction.update({
			components: [client.createController(player.guildId, player)],
		});
		return;
	}

	return interaction.reply({
		ephemeral: true,
		content: "❌ | **Lựa chọn điều khiển không rõ**",
	});
};
