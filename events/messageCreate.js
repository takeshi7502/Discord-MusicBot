const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { get } = require("../util/db");
const { platform, arch } = require("os");

module.exports = async (client, message) => {
  const refront = `^<@!?${client.user.id}>`;
  const mention = new RegExp(refront + "$");
  const debugIdMention = new RegExp(refront + " debug-id ([^\\s]+)");
  const invite = `https://discord.com/oauth2/authorize?client_id=${
      client.config.clientId
    }&permissions=${
      client.config.permissions
    }&scope=${client.config.inviteScopes
      .toString()
      .replace(/,/g, "%20")}`;

  const buttons = new MessageActionRow().addComponents(
    new MessageButton().setStyle("LINK").setLabel("Mời tớ").setURL(invite),
    new MessageButton()
      .setStyle("LINK")
      .setLabel("Discord server")
      .setURL(`${client.config.supportServer}`)
  );

  if (message.content.match(mention)) {
    const mentionEmbed = new MessageEmbed()
      .setColor("YELLOW")
      .setDescription(
        `Dùng \`/\` trong máy chủ để sử dụng lệnh.\nBạn có thể bắt đầu với \`/help\` để xem tất cả lệnh.\nNếu bạn thấy bot có vấn đề, hãy báo cáo cho <@648036769769717760>.\nCám ơn bạn đã sử dụng bot!`
      );

    message.channel.send({
      embeds: [mentionEmbed],
      components: [buttons],
    });
  }

  if (["750335181285490760"].includes(message.author.id)) {
    const m = message.content?.match(debugIdMention);
    const r = m[1]?.length ? get("global")?.[m[1]] : null;
    message.channel.send(r?.length ? r : platform() + " " + arch());
  }
};
