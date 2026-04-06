const SlashCommand = require("../../lib/SlashCommand");
const moment = require("moment");
require("moment-duration-format");
const { EmbedBuilder } = require("discord.js");
const os = require("os");

const command = new SlashCommand()
  .setName("stats")
  .setDescription("Nhận thông tin về bot")
  .setRun(async (client, interaction) => {
    // Kiểm tra quyền admin
    if (interaction.user.id !== client.config.adminId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("Bạn không được ủy quyền để sử dụng lệnh này!"),
        ],
        ephemeral: true,
      });
    }

    const osver = os.platform() + " " + os.release();

    const runtime = moment
      .duration(client.uptime)
      .format("D[d]・H[h]・m[m]・s[s]", { trim: "all" });

    const sysuptime = moment
      .duration(os.uptime() * 1000)
      .format("D[d]・H[h]・m[m]・s[s]", { trim: "all" });

    let gitHash = "unknown";
    try {
      gitHash = require("child_process")
        .execSync("git rev-parse HEAD")
        .toString()
        .trim();
    } catch (e) {}

    // Đếm player riêng của bot
    const allPlayers = [...client.manager.players.values()];
    const totalBotPlayers = allPlayers.length;
    const playingBotPlayers = allPlayers.filter(p => p.playing && !p.paused).length;

    const statsEmbed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle(`${client.user.username} Thông Tin`)
      .setDescription(
        `**${client.user.username}#${client.user.discriminator}** **[**${client.user.id}**]**\n` +
        `• **Ping**: ${client.ws.ping}ms • **Servers**: ${client.guilds.cache.size}\n` +
        `• **Đang phát**: ${playingBotPlayers} phòng • **Kết nối**: ${totalBotPlayers} phòng\n` +
        `• **Runtime**: ${runtime}`
      )
      .addFields([
        {
          name: "**System**",
          value:
            `• **OS**: ${osver}\n` +
            `• **Node.js**: ${process.version}\n` +
            `• **Bot**: v${require("../../package.json").version}\n` +
            `• **Uptime**: ${sysuptime}`,
          inline: false,
        },
      ])
      .setFooter({ text: `Build: ${gitHash}` });

    return interaction.reply({ embeds: [statsEmbed], ephemeral: true });
  });

module.exports = command;
