const { ContextMenuCommandBuilder } = require("discord.js");
const { EmbedBuilder, escapeMarkdown } = require("discord.js");

module.exports = {
  command: new ContextMenuCommandBuilder().setName("Phát Bài Hát").setType(3),

  /**
   * This function will handle context menu interaction
   * @param {import("../lib/DiscordMusicBot")} client
   * @param {import("discord.js").ContextMenuCommandInteraction} interaction
   */
   run: async (client, interaction, options) => {
    let channel = await client.getChannel(client, interaction);
    if (!channel) {
      return;
    }

    let node = await client.getLavalink(client);
    if (!node) {
      return interaction.reply({
        embeds: [client.ErrorEmbed("Nút Lavalink không được kết nối")],
        ephemeral: true,
      });
    }

    let player = client.manager.getPlayer(interaction.guild.id);
    if (!player) {
      player = client.createPlayer(interaction.channel, channel, node);
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

    const ret = await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription(":mag_right: **Đang tìm...**"),
      ],
      fetchReply: true,
    });

    const query =
      interaction.channel.messages.cache.get(interaction.targetId)?.content ??
      (await interaction.channel.messages.fetch(interaction.targetId))?.content ?? "";
    let res = await player.search({ query }, interaction.user).catch((err) => {
      client.error(err);
      return {
        loadType: "error",
      };
    });

    if (res.loadType === "error") {
      if (!player.queue.current) {
        player.destroy();
      }
      await interaction.deleteReply().catch(() => {});
      await interaction
        .followUp({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription("Có lỗi xảy ra trong quá trình tìm kiếm"),
          ],
          ephemeral: true,
        })
        .catch(() => {});
    }

    if (res.loadType === "empty") {
      if (!player.queue.current) {
        player.destroy();
      }
      await interaction.deleteReply().catch(() => {});
      await interaction
        .followUp({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription("Không tìm thấy kết quả nào"),
          ],
          ephemeral: true,
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
  },
};
