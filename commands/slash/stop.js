const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("stop")
	.setDescription("Dừng lại những gì bot đang phát và rời khỏi kênh thoại\n(Lưu ý: Lệnh này sẽ xóa toàn bộ hàng đợi)")

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
				ephemeral: true,
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription("Nút Lavalink không được kết nối"),
				],
			});
		}

		if (!player) {
			return interaction.reply({
				ephemeral: true,
				embeds: [
					new EmbedBuilder()
						.setColor(0xFF0000)
						.setDescription("Tôi không ở trong một kênh thoại."),
				],
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		const stopEmbed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setDescription(`**👋 | Tạm biệt nha!** (Đã dừng bởi <@${interaction.user.id}>)`);

		const existingMsg = player.get("nowPlayingMessage");
		if (existingMsg && !client.isMessageDeleted(existingMsg)) {
			await existingMsg.edit({ embeds: [stopEmbed], components: [] }).catch(() => { });
			setTimeout(() => existingMsg.delete().catch(() => { }), 10000);
			client.markMessageAsDeleted(existingMsg);
		}
		player.set("nowPlayingMessage", null);

		if (player.get("twentyFourSeven")) {
			player.queue.splice(0);
			player.stopPlaying(false, false);
			player.set("autoQueue", false);
		} else {
			player.destroy();
		}

		await interaction.deleteReply().catch(() => { });
	});

module.exports = command;
