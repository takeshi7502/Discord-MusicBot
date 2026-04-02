const colors = require("colors");
const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
	.setName("247")
	.setDescription("Giữ cho bot luôn luôn kết nối với VC (bật/tắt)")
	.setRun(async (client, interaction, options) => {
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
						.setDescription("Không có gì để phát 24/7."),
				],
				ephemeral: true,
			});
		}

		let twentyFourSevenEmbed = new EmbedBuilder().setColor(
			client.config.embedColor,
		);
		const twentyFourSeven = player.get("twentyFourSeven");

		if (!twentyFourSeven || twentyFourSeven === false) {
			player.set("twentyFourSeven", true);
		} else {
			player.set("twentyFourSeven", false);
		}
		twentyFourSevenEmbed
			.setDescription(`**Chế độ 24/7 hiện tại là** \`${!twentyFourSeven ? "BẬT" : "TẮT"}\``)
			.setFooter({
				text: `Bot ${!twentyFourSeven ? "bây giờ sẽ" : " sẽ ko còn"} duy trì kết nối với kênh thoại 24/7.`
			});
		client.warn(
			`Bot: ${player.guildId} | [${colors.blue(
				"24/7",
			)}] đã được [${colors.blue(
				!twentyFourSeven ? "BẬT" : "TẮT",
			)}] trong ${client.guilds.cache.get(player.guildId)
				? client.guilds.cache.get(player.guildId).name
				: "một server"
			}`,
		);


		if (!player.playing && (player.queue.tracks.length + (player.queue.current ? 1 : 0)) === 0 && twentyFourSeven) {
			player.destroy();
		}

		return interaction.reply({ ephemeral: true,  embeds: [twentyFourSevenEmbed] });
	});

module.exports = command;
// check above message, it is a little bit confusing. and erros are not handled. probably should be fixed.
// ok use catch ez kom  follow meh ;_;
// the above message meaning error, if it cant find it or take too long the bot crashed
// play commanddddd, if timeout or takes 1000 years to find song it crashed
// OKIE, leave the comment here for idk
// Comment very useful, 247 good :+1:
// twentyFourSeven = best;
