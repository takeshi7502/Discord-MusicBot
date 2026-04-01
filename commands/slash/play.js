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
    let channel = await client.getChannel(client, interaction);
    if (!channel) {
      return;
    }

    let node = await client.getLavalink(client);
    if (!node) {
      return interaction.reply({
        embeds: [client.ErrorEmbed("Nút Lavalink không được kết nối")],
      });
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

    const ret = await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription(":mag_right: **Đang tìm...**"),
      ],
      fetchReply: true,
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
      let addQueueEmbed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setAuthor({ name: "Đã thêm vào hàng đợi", iconURL: client.config.iconURL })
        .setDescription(`[${title}](${res.tracks[0].info.uri})` || "Không có Tiêu đề")
        .setURL(res.tracks[0].info.uri)
        .addFields(
          {
            name: "Đã thêm bởi",
            value: `<@${interaction.user.id}>`,
            inline: true,
          },
          {
            name: "Thời lượng",
            value: res.tracks[0].info.isStream
              ? `\`LIVE 🔴 \``
              : `\`${client.ms(res.tracks[0].info.duration, {
                  colonNotation: true,
                  secondsDecimalDigits: 0,
                })}\``,
            inline: true,
          }
        );

      if (res.tracks[0].info.artworkUrl) {
        addQueueEmbed.setThumbnail(res.tracks[0].info.artworkUrl);
      }

      const totalSize = player.queue.tracks.length + (player.queue.current ? 1 : 0);
      if (totalSize > 1) {
        addQueueEmbed.addFields({
          name: "Vị trí trong hàng đợi",
          value: `${player.queue.tracks.length}`,
          inline: true,
        });
      }

      await interaction.editReply({ embeds: [addQueueEmbed] }).catch(() => {});
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
      let playlistEmbed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setAuthor({
          name: "Đã thêm danh sách phát vào hàng đợi",
          iconURL: client.config.iconURL,
        })
        .setThumbnail(res.tracks[0].info.artworkUrl || null)
        .setDescription(`[${res.playlist?.name || "Playlist"}](${query})`)
        .addFields(
          {
            name: "Hàng đợi đã thêm",
            value: `\`${res.tracks.length}\` bài hát`,
            inline: true,
          },
          {
            name: "Thời lượng của danh sách phát",
            value: `\`${client.ms(playlistDuration, {
              colonNotation: true,
              secondsDecimalDigits: 0,
            })}\``,
            inline: true,
          }
        );

      await interaction.editReply({ embeds: [playlistEmbed] }).catch(() => {});
    }

    if (ret) setTimeout(() => ret.delete().catch(() => {}), 20000);
    return ret;
  });

module.exports = command;
