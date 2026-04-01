/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 */
module.exports = async (client) => {
	await client.manager.init({ id: client.user.id, username: client.user.username });
	client.user.setPresence(client.config.presence);
	client.log("Đã đăng nhập thành công với tư cách là " + client.user.tag);
};
