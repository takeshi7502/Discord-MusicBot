const { EmbedBuilder } = require("discord.js");

/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {import("discord.js").VoiceState} oldState
 * @param {import("discord.js").VoiceState} newState
 * @returns {Promise<void>}
 */
module.exports = async (client, oldState, newState) => {
	// get guild and player
	let guildId = newState.guild.id;
	const player = client.manager.getPlayer(guildId);
	
	// check if the bot is active (playing, paused or empty does not matter (return otherwise)
	if (!player || !player.connected) {
		return;
	}
	
	// preprocess the data
	const stateChange = {};
	// get the state change
	if (oldState.channel === null && newState.channel !== null) {
		stateChange.type = "JOIN";
	}
	if (oldState.channel !== null && newState.channel === null) {
		stateChange.type = "LEAVE";
	}
	if (oldState.channel !== null && newState.channel !== null) {
		stateChange.type = "MOVE";
	}
	if (oldState.channel === null && newState.channel === null) {
		return;
	} // you never know, right
	if (
		newState.serverMute == true &&
		oldState.serverMute == false &&
		newState.id === client.config.clientId
	) {
		return player.pause();
	}
	if (
		newState.serverMute == false &&
		oldState.serverMute == true &&
		newState.id === client.config.clientId
	) {
		return player.resume();
	}
	// move check first as it changes type
	if (stateChange.type === "MOVE") {
		if (oldState.channel.id === player.voiceChannelId) {
			stateChange.type = "LEAVE";
		}
		if (newState.channel.id === player.voiceChannelId) {
			stateChange.type = "JOIN";
		}
	}
	// double triggered on purpose for MOVE events
	if (stateChange.type === "JOIN") {
		stateChange.channel = newState.channel;
	}
	if (stateChange.type === "LEAVE") {
		stateChange.channel = oldState.channel;
	}
	
	// check if the bot's voice channel is involved (return otherwise)
	if (!stateChange.channel || stateChange.channel.id !== player.voiceChannelId) {
		return;
	}
        player.prevMembers = player.members
        player.members = stateChange.channel.members.filter(member => !member.user.bot).size;
	switch (stateChange.type) {
		case "JOIN":
			if (player.get("autoPause") === true) {
                         var members = stateChange.channel.members.filter(member => !member.user.bot).size
			    if (members === 1 && player.paused && members !== player.prevMembers){
					player.resume();
					let playerResumed = new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setTitle(`Tiếp Tục!`, client.config.iconURL)
						.setDescription(
							`Đang phát  [${ player.queue.current.info.title }](${ player.queue.current.info.uri })`,
						)
						.setFooter({ text: `Bản nhạc hiện tại đã được tiếp tục` });
					
					let resumeMessage = await client.channels.cache
						.get(player.textChannelId)
						.send({ embeds: [playerResumed] });
					player.set("resumeMessage", resumeMessage);
					
					// Delete previous paused message
					const pausedMsg = player.get("pausedMessage");
					if (pausedMsg && !client.isMessageDeleted(pausedMsg)) {
						pausedMsg.delete().catch(() => {});
						client.markMessageAsDeleted(pausedMsg);
					}
					
					setTimeout(() => {
						if (!client.isMessageDeleted(resumeMessage)) {
							resumeMessage.delete().catch(() => {});
							client.markMessageAsDeleted(resumeMessage);
						}
					}, 5000);
				}
			}
			break;
                case "LEAVE":
			var members = stateChange.channel.members.filter(member => !member.user.bot).size
			const twentyFourSeven = player.get("twentyFourSeven");
			if (player.get("autoPause") === true && player.get("autoLeave") === false) {
				if (members === 0 && !player.paused && player.playing) {
					player.pause();
					
					let playerPaused = new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setTitle(`Tạm Dừng!`, client.config.iconURL)
						.setFooter({
							text: `Bản nhạc hiện tại đã bị tạm dừng vì không có ai trong kênh thoại.`,
						});
					
					let pausedMessage = await client.channels.cache
						.get(player.textChannelId)
						.send({ embeds: [playerPaused] });
					player.set("pausedMessage", pausedMessage);
					
					// Delete previous resume message
					const resumeMsg = player.get("resumeMessage");
					if (resumeMsg && !client.isMessageDeleted(resumeMsg)) {
						resumeMsg.delete().catch(() => {});
						client.markMessageAsDeleted(resumeMsg);
					}
				}
			} else if (player.get("autoLeave") === true && player.get("autoPause") === false) {
				if (members === 0) {
					if (twentyFourSeven){
						setTimeout(async () => {
							var members = stateChange.channel.members.filter(member => !member.user.bot).size
							if (members === 0 && player.connected){
								let leftEmbed = new EmbedBuilder()
									.setColor(client.config.embedColor)
									.setAuthor({
									name: "Đã ngắt kết nối!",
									iconURL: client.config.iconURL,
									})
									.setFooter({ text: "Rời đi vì không còn ai ở trong kênh thoại." })
									.setTimestamp();
								let Disconnected = await client.channels.cache
									.get(player.textChannelId)
									.send({ embeds: [leftEmbed] });
								setTimeout(() => Disconnected.delete().catch(() => {}), 5000);
								player.queue.tracks.splice(0);
								player.destroy();
								player.set("autoQueue", false);
							}
						}, client.config.disconnectTime);
					} else{
						let leftEmbed = new EmbedBuilder()
							.setColor(client.config.embedColor)
							.setAuthor({
							name: "Đã ngắt kết nối!",
							iconURL: client.config.iconURL,
							})
							.setFooter({ text: "Rời đi vì không còn ai ở trong kênh thoại." })
							.setTimestamp();
						let Disconnected = await client.channels.cache
							.get(player.textChannelId)
							.send({ embeds: [leftEmbed] });
						setTimeout(() => Disconnected.delete().catch(() => {}), 5000);
						player.destroy();	
					}
					
				}
			} else if (player.get("autoLeave") === true && player.get("autoPause") === true){
				if (members === 0 && !player.paused && player.playing && twentyFourSeven) {
					player.pause();
					
					let playerPaused = new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setTitle(`Tạm Dừng!`, client.config.iconURL)
						.setFooter({
							text: `Bản nhạc hiện tại đã bị tạm dừng vì không có ai trong kênh thoại.`,
						});
					
					let pausedMessage = await client.channels.cache
						.get(player.textChannelId)
						.send({ embeds: [playerPaused] });
					player.set("pausedMessage", pausedMessage);
					setTimeout(async () => {
						var members = stateChange.channel.members.filter(member => !member.user.bot).size
						if (members === 0 && player.connected){
							let leftEmbed = new EmbedBuilder()
								.setColor(client.config.embedColor)
								.setAuthor({
								name: "Đã ngắt kết nối!",
								iconURL: client.config.iconURL,
								})
								.setFooter({ text: "Rời đi vì không còn ai ở trong kênh thoại." })
								.setTimestamp();
							let Disconnected = await client.channels.cache
								.get(player.textChannelId)
								.send({ embeds: [leftEmbed] });
							setTimeout(() => Disconnected.delete().catch(() => {}), 5000);
							pausedMessage.delete().catch(() => {});
							player.queue.tracks.splice(0);
							player.destroy();
							player.set("autoQueue", false);
						}
					}, client.config.disconnectTime);
				} else{
					if (members === 0 && player.connected){
						let leftEmbed = new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setAuthor({
						name: "Đã ngắt kết nối!",
						iconURL: client.config.iconURL,
						})
						.setFooter({ text: "Rời đi vì không còn ai ở trong kênh thoại." })
						.setTimestamp();
						let Disconnected = await client.channels.cache
							.get(player.textChannelId)
							.send({ embeds: [leftEmbed] });
						setTimeout(() => Disconnected.delete().catch(() => {}), 5000);
						player.destroy();
					}
				}
			}
		break;
	}
};
