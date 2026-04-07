const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
  .setName("guildleave")
  .setDescription("Rời khỏi máy chủ")
  .setAdminOnly(true)
  .addStringOption((option) =>
    option
      .setName("id")
      .setDescription("Nhập ID máy chủ để rời đi | `list` = danh sách | `all` = rời tất cả máy chủ")
      .setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
    try {
      if (interaction.user.id !== client.config.adminId) {
        return interaction.reply({
          ephemeral: true,
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription("❌ Bạn không được ủy quyền để sử dụng lệnh này!"),
          ],
        });
      }

      const id = interaction.options.getString("id");

      // ── LIST ──────────────────────────────────────────
      if (id.toLowerCase() === "list") {
        // Sắp xếp các server theo thời gian "join" mới nhất lên đầu
        const guildsArray = [...client.guilds.cache.values()].sort((a, b) => b.joinedTimestamp - a.joinedTimestamp);

        if (guildsArray.length === 0) {
          return interaction.reply({
            ephemeral: true,
            embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Không có máy chủ nào.")]
          });
        }

        const itemsPerPage = 50;
        let maxPages = Math.ceil(guildsArray.length / itemsPerPage);
        let pageNo = 0;

        const getButtons = (page) => {
          return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("guildlist_prev")
              .setEmoji("◀️")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId("guildlist_next")
              .setEmoji("▶️")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === maxPages - 1 || maxPages === 0),
            new ButtonBuilder()
              .setCustomId("guildlist_close")
              .setEmoji("❌")
              .setStyle(ButtonStyle.Secondary)
          );
        };

        const generateEmbed = (page) => {
          const start = page * itemsPerPage;
          const currentGuilds = guildsArray.slice(start, start + itemsPerPage);
          const lines = currentGuilds.map(
            (g, i) => `**${start + i + 1}.** **${g.name}** - (\`${g.id}\`) (${g.memberCount} bé)`
          );

          return new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle(`📋 Danh sách máy chủ (${client.guilds.cache.size})`)
            .setDescription(lines.join("\n") || "Trống.")
            .setFooter({ text: `Trang ${page + 1} / ${maxPages}` });
        };

        const listMsg = await interaction.reply({
          ephemeral: true,
          embeds: [generateEmbed(pageNo)],
          components: maxPages > 1 ? [getButtons(pageNo)] : [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("guildlist_close").setEmoji("❌").setStyle(ButtonStyle.Secondary)
            )
          ],
          fetchReply: true,
        });

        const collector = listMsg.createMessageComponentCollector({
          filter: (i) => i.user.id === interaction.user.id,
          time: 600000,
        });

        collector.on("collect", async (iter) => {
          if (iter.customId === "guildlist_close") {
            collector.stop();
            await iter.deferUpdate().catch(() => {});
            await interaction.deleteReply().catch(() => {});
            return;
          }
          if (iter.customId === "guildlist_next") {
            pageNo++;
          } else if (iter.customId === "guildlist_prev") {
            pageNo--;
          }

          await iter.update({
            embeds: [generateEmbed(pageNo)],
            components: [getButtons(pageNo)],
          }).catch(() => {});
        });

        collector.on("end", () => {
           interaction.editReply({ components: [] }).catch(() => {});
        });

        return;
      }

      // ── ALL ───────────────────────────────────────────
      if (id.toLowerCase() === "all") {
        const count = client.guilds.cache.size;

        const warnEmbed = new EmbedBuilder()
          .setColor(0xFF4500)
          .setTitle("⚠️ XÁC NHẬN RỜI TOÀN BỘ MÁY CHỦ")
          .setDescription(
            `Bạn sắp ra lệnh cho Bot rời khỏi **tất cả ${count} máy chủ** hiện tại!\n\n` +
            `**Danh sách:**\n` +
            client.guilds.cache.map((g) => `• ${g.name} (\`${g.id}\`)`).join("\n") +
            `\n\n⚠️ **Hành động này không thể hoàn tác!**`
          )
          .setFooter({ text: "Xác nhận trong vòng 30 giây" });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("guildleave_all_confirm")
            .setLabel("✅ Xác nhận — Rời tất cả")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("guildleave_all_cancel")
            .setLabel("❌ Huỷ bỏ")
            .setStyle(ButtonStyle.Secondary)
        );

        const warnMsg = await interaction.reply({
          ephemeral: true,
          embeds: [warnEmbed],
          components: [row],
          fetchReply: true,
        });

        const collector = warnMsg.createMessageComponentCollector({
          filter: (i) => i.user.id === interaction.user.id,
          time: 30_000,
          max: 1,
        });

        collector.on("collect", async (btn) => {
          await btn.deferUpdate();

          if (btn.customId === "guildleave_all_cancel") {
            return interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.config.embedColor)
                  .setDescription("✅ Đã huỷ. Bot không rời khỏi máy chủ nào."),
              ],
              components: [],
            });
          }

          // Xác nhận → rời tất cả
          const guilds = [...client.guilds.cache.values()];
          let success = 0, failed = 0;

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFFA500)
                .setDescription(`⏳ Đang rời khỏi ${guilds.length} máy chủ...`),
            ],
            components: [],
          });

          for (const guild of guilds) {
            // KHÔNG BAO GIỜ rời khỏi Server Admin/Trụ sở
            if (guild.id === client.config.adminGuildId) {
              console.log(`[GuildLeave:ALL] Bỏ qua Server Trụ Sở Admin: ${guild.name}`);
              continue;
            }

            try {
              await guild.leave();
              console.log(`[GuildLeave:ALL] Rời: ${guild.name} (${guild.id})`);
              success++;
            } catch (err) {
              console.error(`[GuildLeave:ALL] Lỗi rời: ${guild.name} (${guild.id})`, err);
              failed++;
            }
          }

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(failed === 0 ? 0x00C853 : 0xFF4500)
                .setTitle("🚪 Hoàn tất rời máy chủ")
                .setDescription(
                  `✅ Rời thành công: **${success}** máy chủ\n` +
                  (failed > 0 ? `❌ Thất bại: **${failed}** máy chủ` : "")
                ),
            ],
            components: [],
          });
        });

        collector.on("end", (_, reason) => {
          if (reason === "time") {
            interaction
              .editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription("⏰ Hết thời gian xác nhận. Đã huỷ thao tác."),
                ],
                components: [],
              })
              .catch(() => { });
          }
        });

        return;
      }

      // ── SINGLE ID ─────────────────────────────────────
      const guild = client.guilds.cache.get(id);
      if (!guild) {
        console.error(`[GuildLeave] Không tìm thấy máy chủ: ${id}`);
        return interaction.reply({
          ephemeral: true,
          content: `\`${id}\` không phải là một ID máy chủ hợp lệ hoặc Bot chưa tham gia.`,
        });
      }

      await guild.leave();
      console.log(`[GuildLeave] Rời: ${guild.name} (${id})`);
      return interaction.reply({
        ephemeral: true,
        embeds: [
          new EmbedBuilder()
            .setColor(0x00C853)
            .setDescription(`✅ Đã rời khỏi máy chủ **${guild.name}** (\`${id}\`)`),
        ],
      });

    } catch (error) {
      console.error(`[GuildLeave] Lỗi:`, error);
      return interaction.reply({
        ephemeral: true,
        content: "❌ Có lỗi xảy ra khi thực hiện lệnh.",
      });
    }
  });

module.exports = command;