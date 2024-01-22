/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 */
module.exports = (client) => {
	client.manager.init(client.user.id);
	client.user.setPresence(client.config.presence);
	client.log("Đã đăng nhập thành công với tư cách là " + client.user.tag);
};
