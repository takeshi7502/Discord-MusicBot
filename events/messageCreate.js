const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

module.exports = async (client, message) => {
  const refront = `^<@!?${client.user.id}>`;
  const mention = new RegExp(refront + "$");
  const invite = `https://discord.com/oauth2/authorize?client_id=${
      client.config.clientId
    }&permissions=${
      client.config.permissions
    }&scope=bot%20applications.commands`;

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Mời tớ").setURL(invite),
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel("Discord server")
      .setURL(`${client.config.supportServer}`)
  );

  if (message.content.match(mention)) {
    const mentionEmbed = new EmbedBuilder()
      .setColor(0xFFFF00)
      .setDescription(
        `Dùng \`/\` trong máy chủ để sử dụng lệnh.\nBạn có thể bắt đầu với \`/help\` để xem tất cả lệnh.\nNếu bạn thấy bot có vấn đề, hãy báo cáo cho <@648036769769717760>.\nCám ơn bạn đã sử dụng bot!`
      );

    message.channel.send({
      embeds: [mentionEmbed],
      components: [buttons],
    });
  }
};
