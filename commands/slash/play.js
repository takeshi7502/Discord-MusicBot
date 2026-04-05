const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const { escapeMarkdown } = require("discord.js");

const command = new SlashCommand()
  .setName("play")
  .setDescription(
    "Tìm kiếm và phát bài hát từ YouTube"
  )
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("Bạn đang tìm gì?")
      .setAutocomplete(true)
      .setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
    // Ngăn chặn lỗi timeout 3 giây của Discord bằng cách defer trước
    await interaction.deferReply();

    let channel = await client.getChannel(client, interaction);
    if (!channel) {
      return;
    }

    let node = await client.getLavalink(client);
    if (!node) {
      const errMsg = await interaction.editReply({
        embeds: [client.ErrorEmbed("Nút Lavalink không được kết nối")],
      });
      setTimeout(() => errMsg.delete().catch(() => {}), 10000);
      return;
    }

    let player = client.manager.getPlayer(interaction.guild.id);
    if (!player) {
      player = client.createPlayer(interaction.channel, channel);
    }

    if (!player.connected) {
      await player.connect();
    }

    if (channel.type == 13) { // GUILD_STAGE_VOICE
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
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription(":mag_right: **Đang tìm...**"),
      ]
    });

    let query = options.getString("query", true);
    let res = await player.search({ query }, interaction.user).catch((err) => {
      client.error(err);
      return {
        loadType: "error",
      };
    });

    if (res.loadType === "error") {
      console.log("Lavlink Search Error:", res.error || res.exception || res);
      if (!player.queue.current) {
        player.destroy();
      }
      await interaction
        .editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription("Có lỗi xảy ra trong quá trình tìm kiếm"),
          ],
        })
        .catch(() => {});
    }

    if (res.loadType === "empty") {
      if (!player.queue.current) {
        player.destroy();
      }
      await interaction
        .editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription("Không tìm thấy kết quả nào"),
          ],
        })
        .catch(() => {});
    }

    if (res.loadType === "track" || res.loadType === "search") {
      await player.queue.add(res.tracks[0]);

      if (!player.playing && !player.paused && player.queue.tracks.length > 0) {
        await player.play({ paused: false });
      }
      var title = escapeMarkdown(res.tracks[0].info.title);
      title = title.replace(/\]/g, "");
      title = title.replace(/\[/g, "");

      const duration = res.tracks[0].info.isStream
        ? "`LIVE 🔴`"
        : `\`${client.ms(res.tracks[0].info.duration, { colonNotation: true, secondsDecimalDigits: 0 })}\``;

      const addText = `**Đã thêm:**\n[${title}](${res.tracks[0].info.uri})\n**Từ** <@${interaction.user.id}> - **Thời lượng:** ${duration}`;

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(addText)
        ]
      }).catch(() => {});
    }

    if (res.loadType === "playlist") {
      await player.queue.add(res.tracks);

      const totalSize = player.queue.tracks.length + (player.queue.current ? 1 : 0);
      if (
        !player.playing &&
        !player.paused &&
        player.queue.tracks.length > 0
      ) {
        await player.play({ paused: false });
      }

      const playlistDuration = res.tracks.reduce((a, t) => a + (t.info.duration || 0), 0);
      const durationStr = client.ms(playlistDuration, { colonNotation: true, secondsDecimalDigits: 0 });
      const playlistName = res.playlist?.name || "Playlist";

      const addText = `**Đã thêm Playlist:**\n${playlistName}\n**Từ** <@${interaction.user.id}> - **Thời lượng:** \`${durationStr}\` - **Playlist:** \`${res.tracks.length}\` bài hát`;

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(addText)
        ]
      }).catch(() => {});
    }

    if (ret) setTimeout(() => ret.delete().catch(() => {}), 10000);
    return ret;
  });

module.exports = command;
