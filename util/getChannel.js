const { t } = require("./i18n");
/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {import("discord.js").GuildCommandInteraction} interaction
 * @returns
 */
module.exports = async (client, interaction) => {
	return new Promise(async (resolve) => {
		if (!interaction.member.voice.channel) {
			const replyData = { ephemeral: true, 
				embeds: [
					client.ErrorEmbed(t("common.noVoiceChannel")),
				],
			};
			interaction.deferred || interaction.replied ? await interaction.editReply(replyData).catch(()=>{}) : await interaction.reply(replyData).catch(()=>{});
			return resolve(false);
		}
		if (
			interaction.guild.members.me.voice.channel &&
			interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel.id
		) {
			const replyData = { ephemeral: true, 
				embeds: [
					client.ErrorEmbed(t("common.sameVoiceChannel")),
				],
			};
			interaction.deferred || interaction.replied ? await interaction.editReply(replyData).catch(()=>{}) : await interaction.reply(replyData).catch(()=>{});
			return resolve(false);
		}
		if (!interaction.member.voice.channel.joinable) {
			const replyData = { ephemeral: true, 
				embeds: [
					client.ErrorEmbed(t("common.noPermissionJoin")),
				],
			};
			interaction.deferred || interaction.replied ? await interaction.editReply(replyData).catch(()=>{}) : await interaction.reply(replyData).catch(()=>{});
			return resolve(false);
		}
		
		resolve(interaction.member.voice.channel);
	});
};
