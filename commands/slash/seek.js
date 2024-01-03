const SlashCommand = require("../../lib/SlashCommand");
const { MessageEmbed } = require("discord.js");
const ms = require("ms");

const command = new SlashCommand()
	.setName("seek")
	.setDescription("Chuyển đến một thời điểm cụ thể trong bài hát hiện tại.")
	.addStringOption((option) =>
		option
			.setName("time")
			.setDescription("Chuyển đến thời điểm mà bạn muốn. Ví dụ: 1h 30m | 2h | 80m | 53s")
			.setRequired(true),
	)
	.setRun(async (client, interaction, options) => {
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
						.setDescription("Không có bài hát nào đang phát."),
				],
				ephemeral: true,
			});
		}
		
		await interaction.deferReply();

		const rawArgs = interaction.options.getString("time");
		const args = rawArgs.split(' ');
		var rawTime = [];
		for (i = 0; i < args.length; i++){
			rawTime.push(ms(args[i]));
		}
		const time = rawTime.reduce((a,b) => a + b, 0);
		const position = player.position;
		const duration = player.queue.current.duration;
		
		if (time <= duration) {
			player.seek(time);
			return interaction.editReply({
				embeds: [
					new MessageEmbed()
						.setColor(client.config.embedColor)
						.setDescription(
							`⏩ | **${player.queue.current.title}** đã được ${
								time < position ? "quay lại" : "chuyển đến"
							} tới **${ms(time)}**`,
						),
				],
			});
		} else {
			return interaction.editReply({
				embeds: [
					new MessageEmbed()
						.setColor(client.config.embedColor)
						.setDescription(
							`Không thể chuyển đến một thời điểm cụ thể của bài hát đang phát hiện tại. Điều này có thể do vượt quá thời lượng của bài hát hoặc định dạng thời gian không đúng. Hãy kiểm tra và thử lại.`,
						),
				],
			});
		}
	});

module.exports = command;
