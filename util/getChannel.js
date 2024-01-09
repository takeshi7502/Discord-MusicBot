/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {import("discord.js").GuildCommandInteraction} interaction
 * @returns
 */
module.exports = async (client, interaction) => {
	return new Promise(async (resolve) => {
		if (!interaction.member.voice.channel) {
			await interaction.reply({
				embeds: [
					client.ErrorEmbed(
						"Bạn phải ở trong một kênh thoại để sử dụng lệnh này!",
					),
				],
			});
			return resolve(false);
		}
		if (
			interaction.guild.members.me.voice.channel &&
			interaction.member.voice.channel.id !==
			interaction.guild.members.me.voice.channel.id
		) {
			await interaction.reply({
				embeds: [
					client.ErrorEmbed(
						"Bạn phải ở trong cùng một kênh thoại với tôi để sử dụng lệnh này!",
					),
				],
			});
			return resolve(false);
		}
		if (!interaction.member.voice.channel.joinable) {
			await interaction.reply({
				embeds: [
					client.ErrorEmbed(
						"Tôi không có đủ quyền để tham gia vào kênh thoại của bạn!",
					),
				],
			});
			return resolve(false);
		}
		
		resolve(interaction.member.voice.channel);
	});
};
