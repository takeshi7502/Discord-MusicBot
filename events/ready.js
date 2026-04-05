/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 */
module.exports = async (client) => {
	try {
		await client.manager.init({ id: client.user.id, username: client.user.username });
	} catch (err) {
		client.warn(`Lavalink init lỗi: ${err.message}`);
		// Gửi thông báo vào kênh setlog
		if (client.sendLavalinkNotification) {
			const { EmbedBuilder } = require("discord.js");
			client.sendLavalinkNotification(
				new EmbedBuilder()
					.setColor("#FF8800")
					.setDescription(`⚠️ **Lavalink Gặp Lỗi Khi Khởi Động**\n**Lỗi:** \`${err.message}\``)
					.setTimestamp()
			);
		}
	}
	client.user.setPresence(client.config.presence);
	client.log("Đã đăng nhập thành công với tư cách là " + client.user.tag);
};
