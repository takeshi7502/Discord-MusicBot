const SlashCommand = require("../../lib/SlashCommand");
const {
  EmbedBuilder
} = require("discord.js");
const {
  t
} = require("../../util/i18n");
const {
  escapeMarkdown
} = require("discord.js");
const command = new SlashCommand().setName("play").setDescription(t("play.auto_165")).addStringOption(option => option.setName("query").setDescription(t("play.auto_166")).setAutocomplete(true).setRequired(true)).setRun(async (client, interaction, options) => {
  // Ngăn chặn lỗi timeout 3 giây của Discord bằng cách defer trước
  await interaction.deferReply();
  let channel = await client.getChannel(client, interaction);
  if (!channel) {
    return;
  }
  let node = await client.getLavalink(client);
  if (!node) {
    const errMsg = await interaction.editReply({
      embeds: [client.ErrorEmbed(t("common.noLavalink"))]
    });
    setTimeout(() => errMsg.delete().catch(() => {}), 10000);
    return;
  }
  let player = client.manager.getPlayer(interaction.guild.id);
  if (!player) {
    player = client.createPlayer(interaction.channel, channel, node);
  }
  if (!player.connected) {
    await player.connect();
  }
  if (channel.type == 13) {
    // GUILD_STAGE_VOICE
    setTimeout(() => {
      if (interaction.guild.members.me.voice.suppress == true) {
        try {
          interaction.guild.members.me.voice.setSuppressed(false);
        } catch (e) {
          interaction.guild.members.me.voice.setRequestToSpeak(true);
        }
      }
    }, 2000);
  }
  const ret = await interaction.editReply({
    embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription(t("player.searching"))]
  });
  let query = options.getString("query", true);
  let res = await player.search({
    query
  }, interaction.user).catch(err => {
    client.error(err);
    return {
      loadType: "error"
    };
  });
  if (res.loadType === "error") {
    console.log("Lavlink Search Error:", res.error || res.exception || res);
    if (!player.queue.current) {
      player.destroy();
    }
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(t("player.searchError"))]
    }).catch(() => {});
  }
  if (res.loadType === "empty") {
    if (!player.queue.current) {
      player.destroy();
    }
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(t("player.noResults"))]
    }).catch(() => {});
  }
  if (res.loadType === "track" || res.loadType === "search") {
    await player.queue.add(res.tracks[0]);
    if (!player.playing && !player.paused && player.queue.tracks.length > 0) {
      await player.play({
        paused: false
      });
    }
    var title = escapeMarkdown(res.tracks[0].info.title);
    title = title.replace(/\]/g, "");
    title = title.replace(/\[/g, "");
    const duration = res.tracks[0].info.isStream ? "`LIVE 🔴`" : `\`${client.ms(res.tracks[0].info.duration, {
      colonNotation: true,
      secondsDecimalDigits: 0
    })}\``;
    const trackUser = res.tracks[0].requester;
    const trackUserId = typeof trackUser === "object" ? trackUser.id : trackUser;
    const addText = t("player.added", {
      title: title,
      url: res.tracks[0].info.uri,
      user: trackUserId ? `<@${trackUserId}>` : "Unknown",
      duration: duration
    });
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription(addText)]
    }).catch(() => {});
  }
  if (res.loadType === "playlist") {
    await player.queue.add(res.tracks);
    const totalSize = player.queue.tracks.length + (player.queue.current ? 1 : 0);
    if (!player.playing && !player.paused && player.queue.tracks.length > 0) {
      await player.play({
        paused: false
      });
    }
    const playlistDuration = res.tracks.reduce((a, t) => a + (t.info.duration || 0), 0);
    const durationStr = client.ms(playlistDuration, {
      colonNotation: true,
      secondsDecimalDigits: 0
    });
    const playlistName = res.playlist?.name || "Playlist";
    const plUser = res.tracks[0].requester;
    const plUserId = typeof plUser === "object" ? plUser.id : plUser;
    const addText = t("player.addedPlaylist", {
      name: playlistName,
      user: plUserId ? `<@${plUserId}>` : "Unknown",
      duration: durationStr,
      count: res.tracks.length
    });
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription(addText)]
    }).catch(() => {});
  }
  if (ret) setTimeout(() => ret.delete().catch(() => {}), 10000);
  return ret;
});
module.exports = command;