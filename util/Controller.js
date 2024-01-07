const { MessageEmbed } = require("discord.js");
/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {import("discord.js").ButtonInteraction} interaction
 */
module.exports = async (client, interaction) => {
	let guild = client.guilds.cache.get(interaction.customId.split(":")[1]);
	let property = interaction.customId.split(":")[2];
	let player = client.manager.get(guild.id);

	if (!player) {
		await interaction.reply({
			embeds: [
				client.Embed("❌ | **Không có người chơi để kiểm soát trong máy chủ này.**"),
			],
		});
		setTimeout(() => {
			interaction.deleteReply();
		}, 5000);
		return;
	}
	if (!interaction.member.voice.channel) {
		const joinEmbed = new MessageEmbed()
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
		const sameEmbed = new MessageEmbed()
			.setColor(client.config.embedColor)
			.setDescription(
				"❌ | **Bạn phải ở trong cùng một kênh thoại với bot để sử dụng lệnh này!**",
			);
		return await interaction.reply({ embeds: [sameEmbed], ephemeral: true });
	}

	if (property === "Stop") {
		player.queue.clear();
		player.stop();
		player.set("autoQueue", false);
		client.warn(`Player: ${ player.options.guild } | Đã dừng trình phát nhạc.`);
		const msg = await interaction.channel.send({
			embeds: [
				client.Embed(
					"⏹️ | **Đã dừng trình phát nhạc**",
				),
			],
		});
		setTimeout(() => {
			msg.delete();
		}, 5000);

		interaction.update({
			components: [client.createController(player.options.guild, player)],
		});
		return;
	}

	// if theres no previous song, return an error.
	if (property === "Replay") {
		const previousSong = player.queue.previous;
		const currentSong = player.queue.current;
		const nextSong = player.queue[0]
        if (!player.queue.previous ||
            player.queue.previous === player.queue.current ||
            player.queue.previous === player.queue[0]) {
            
           return interaction.reply({
                        ephemeral: true,
			embeds: [
				new MessageEmbed()
					.setColor("RED")
					.setDescription(`Không có bài hát trước đó được phát.`),
			],
		});
    }
		if (previousSong !== currentSong && previousSong !== nextSong) {
			player.queue.splice(0, 0, currentSong)
			player.play(previousSong);
			return interaction.deferUpdate();
		}
	}

	if (property === "PlayAndPause") {
		if (!player || (!player.playing && player.queue.totalSize === 0)) {
			const msg = await interaction.channel.send({
                               ephemeral: true,
				embeds: [
					new MessageEmbed()
						.setColor("RED")
						.setDescription("Hiện tại không có bài hát nào đang được phát."),
				],
			});
			setTimeout(() => {
				msg.delete();
			}, 5000);
			return interaction.deferUpdate();
		} else {

			if (player.paused) {
				player.pause(false);
			} else {
				player.pause(true);
			}
			client.warn(`Người chơi: ${player.options.guild} | ${player.paused ? "Tạm dừng" : "Tiếp tục"} người chơi thành công`);

			return interaction.update({
				components: [client.createController(player.options.guild, player)],
			});
		}
	}

	if (property === "Next") {
                const song = player.queue.current;
	        const autoQueue = player.get("autoQueue");
                if (player.queue[0] == undefined && (!autoQueue || autoQueue === false)) {
		return interaction.reply({
                        ephemeral: true,
			embeds: [
				new MessageEmbed()
					.setColor("RED")
					.setDescription(`Không có gì sau [${song.title}](${song.uri}) trong hàng đợi.`),
			],
		})} else player.stop();
		return interaction.deferUpdate
    }

	if (property === "Loop") {
		if (player.trackRepeat) {
			player.setTrackRepeat(false);
			player.setQueueRepeat(true);
		} else if (player.queueRepeat) {
			player.setQueueRepeat(false);
		} else {
			player.setTrackRepeat(true);
		}
		client.warn(`Người chơi: ${player.options.guild} | Đã bật/tắt lặp ${player.trackRepeat ? "bài hát" : player.queueRepeat ? "hàng đợi" : "tất cả"} thành công`);

		interaction.update({
			components: [client.createController(player.options.guild, player)],
		});
		return;
	}

	return interaction.reply({
		ephemeral: true,
		content: "❌ | **Lựa chọn điều khiển không rõ**",
	});
};
