const { t } = require("../../util/i18n");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
  .setName("clean")
  .setDescription("Xoá tin nhắn của bot từ tin nhắn được chỉ định đến hiện tại")
  .addStringOption(option =>
    option
      .setName("message_link")
      .setDescription("Link hoặc ID của tin nhắn cũ nhất cần xoá từ đó đến nay")
      .setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
    await interaction.deferReply({ ephemeral: true });

    const input = options.getString("message_link", true).trim();

    // Trích message ID từ link Discord hoặc dùng thẳng nếu là ID thuần
    let targetMessageId;
    const linkMatch = input.match(/(\d{17,20})(?:\/?)$/);
    if (linkMatch) {
      targetMessageId = linkMatch[1];
    } else {
      return interaction.editReply({
        embeds: [client.ErrorEmbed("Link hoặc ID tin nhắn không hợp lệ.")]
      });
    }

    // Lấy ID tin nhắn "Now Playing" hiện tại (nếu có)
    let nowPlayingId = null;
    if (client.manager) {
      const player = client.manager.getPlayer(interaction.guild.id);
      if (player) {
        const npm = player.get("nowPlayingMessage");
        if (npm) nowPlayingId = npm.id;
      }
    }

    try {
      // Fetch tối đa 100 tin nhắn sau targetMessageId (Discord giới hạn 100/lần)
      // Lặp nhiều lần nếu có hơn 100 tin nhắn
      let allBotMessages = [];
      let lastId = targetMessageId;
      let keepFetching = true;

      while (keepFetching) {
        const fetched = await interaction.channel.messages.fetch({
          after: lastId,
          limit: 100
        });

        if (fetched.size === 0) break;

        const botMsgs = fetched.filter(m =>
          m.author.id === client.user.id &&
          m.id !== nowPlayingId
        );
        allBotMessages.push(...botMsgs.values());

        // Nếu fetch đủ 100, có thể còn tin nhắn tiếp theo
        if (fetched.size === 100) {
          // ID lớn nhất trong batch hiện tại (Discord trả về map không sorted nên cần tìm)
          lastId = [...fetched.keys()].sort().at(-1);
        } else {
          keepFetching = false;
        }
      }

      if (allBotMessages.length === 0) {
        return interaction.editReply({
          embeds: [client.Embed("Không tìm thấy tin nhắn nào của bot trong khoảng đó.")]
        });
      }

      // Tách ra: bulkDelete chỉ hoạt động với tin nhắn < 14 ngày
      const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const recent = allBotMessages.filter(m => now - m.createdTimestamp < TWO_WEEKS);
      const old = allBotMessages.filter(m => now - m.createdTimestamp >= TWO_WEEKS);

      let deleted = 0;

      // Xoá tin nhắn gần (bulkDelete - nhanh)
      if (recent.length > 0) {
        try {
          const result = await interaction.channel.bulkDelete(recent, true);
          deleted += result.size;
          // Những cái bulkDelete bỏ qua → xoá tay
          const skipped = recent.filter(m => !result.has(m.id));
          for (const msg of skipped) {
            await msg.delete().catch(() => {});
            deleted++;
          }
        } catch {
          // Không có quyền bulkDelete → xoá tay
          for (const msg of recent) {
            await msg.delete().catch(() => {});
            deleted++;
          }
        }
      }

      // Xoá tin nhắn cũ > 14 ngày (chỉ có thể xoá từng cái)
      for (const msg of old) {
        await msg.delete().catch(() => {});
        deleted++;
      }

      await interaction.editReply({
        embeds: [client.Embed(`✅ Đã xoá **${deleted}** tin nhắn của bot.`)]
      });
      setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);

    } catch (err) {
      client.error(err.message);
      await interaction.editReply({
        embeds: [client.ErrorEmbed(`Lỗi: ${err.message}`)]
      });
    }
  });

module.exports = command;