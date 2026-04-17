const { t } = require("../../util/i18n");
const SlashCommand = require("../../lib/SlashCommand");
const command = new SlashCommand().setName("clean").setDescription(t("clean.auto_37")).addIntegerOption(option => option.setName("number").setDescription(t("clean.auto_38")).setMinValue(2).setMaxValue(100).setRequired(false)).setRun(async (client, interaction, options) => {
  await interaction.deferReply({
    ephemeral: true
  });
  let number = interaction.options.getInteger("number");
  number = number && number < 100 ? ++number : 100;
  interaction.channel.messages.fetch({
    limit: number
  }).then(messages => {
    const botMessages = [];
    messages.filter(m => {
      let isPlayingMessage = false;
      if (client.manager) {
        const player = client.manager.getPlayer(interaction.guild.id);
        if (player && player.nowPlayingMessage && player.nowPlayingMessage.id === m.id) {
          isPlayingMessage = true;
        }
      }
      return m.author.id === client.user.id && !isPlayingMessage;
    }).forEach(msg => botMessages.push(msg));
    botMessages.shift();
    // Thủ thuật dùng cả 2: Ưu tiên bulkDelete vì nó siêu tốc
    interaction.channel.bulkDelete(botMessages, true).then(async deletedMessages => {
      // Dọn dẹp những tin nhắn quá cộc cằn (cổ đại > 14 ngày) bị bulkDelete từ chối xoá
      const remainingMessages = botMessages.filter(msg => {
        return !deletedMessages.has(msg.id);
      });
      if (remainingMessages.length > 0) {
        client.log(t("clean.auto_39", {
          var1: remainingMessages.length
        }));
        for (const msg of remainingMessages) {
          await msg.delete().catch(() => {});
        }
      }
      await interaction.editReply({
        embeds: [client.Embed(t("clean.auto_40", {
          var1: botMessages.length
        }))]
      });
      setTimeout(() => {
        interaction.deleteReply().catch(() => {});
      }, 5000);
    }).catch(async (error) => {
      // Nếu không có quyền Quản lý tin nhắn (Manage Messages), bulkDelete sẽ sập.
      // Giải pháp Backup dự phòng: Lấy từng cái tự xóa bằng tay (tốc độ chậm hơn xíu nhưng luôn thành công)
      for (const msg of botMessages) {
        await msg.delete().catch(() => {});
      }
      await interaction.editReply({
        embeds: [client.Embed(t("clean.auto_40", {
          var1: botMessages.length
        }))]
      });
      setTimeout(() => {
        interaction.deleteReply().catch(() => {});
      }, 5000);
    });
  });
});
module.exports = command;