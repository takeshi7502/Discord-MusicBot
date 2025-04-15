const SlashCommand = require("../../lib/SlashCommand");
const moment = require("moment");
require("moment-duration-format");
const { MessageEmbed } = require("discord.js");
const os = require("os");

const command = new SlashCommand()
  .setName("stats")
  .setDescription("Nhận thông tin về bot")
  .setRun(async (client, interaction) => {
    // Kiểm tra quyền admin
    if (interaction.user.id !== client.config.adminId) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(client.config.embedColor)
            .setDescription("Bạn không được ủy quyền để sử dụng lệnh này!"),
        ],
        ephemeral: true,
      });
    }

    // Lấy thông tin về OS
    const osver = os.platform() + " " + os.release();
    // Lấy phiên bản Node.js
    const nodeVersion = process.version;

    // Định dạng thời gian bot chạy
    const runtime = moment
      .duration(client.uptime)
      // format: 155d・1h・55m・7s
      .format("D[d]・H[h]・m[m]・s[s]", { trim: "all" });

    // Lấy node Lavalink đang sử dụng
    const lavaNode = client.manager.nodes.values().next().value;
    // Định dạng thời gian Lavalink chạy
    const lavauptime = moment
      .duration(lavaNode.stats.uptime)
      .format("D[d]・H[h]・m[m]・s[s]", { trim: "all" });

    // Định dạng thời gian uptime của hệ thống
    const sysuptime = moment
      .duration(os.uptime() * 1000)
      .format("D[d]・H[h]・m[m]・s[s]", { trim: "all" });

    // Tính dung lượng RAM Lavalink
    const lavaramUsed = (lavaNode.stats.memory.used / 1024 / 1024).toFixed(2);
    const lavaramAlloc = (lavaNode.stats.memory.allocated / 1024 / 1024).toFixed(2);

    // Lấy git commit hash (nếu có)
    let gitHash = "unknown";
    try {
      gitHash = require("child_process")
        .execSync("git rev-parse HEAD")
        .toString()
        .trim();
    } catch (e) {
      // Không làm gì, giữ "unknown"
    }

    // Tạo embed
    const statsEmbed = new MessageEmbed()
      .setColor(client.config.embedColor)
      .setTitle(`${client.user.username} Thông Tin`)
      .setDescription(
        `**${client.user.username}#${client.user.discriminator}** **[**${client.user.id}**]**\n` +
        `• **Ping**: ${client.ws.ping}ms • **Servers**: ${client.guilds.cache.size}\n` +
        `• **Runtime**: ${runtime}`
      )
      .addFields([
        {
          name: "**Lavalink**",
          value:
		  	`• **Playing**: ${lavaNode.stats.playingPlayers}/${lavaNode.stats.players}\n` +
            `• **RAM**: ${lavaramUsed}MB / ${lavaramAlloc}MB\n` +
			`• **Uptime**: ${lavauptime}\n`,
          inline: true,
        },
        {
          name: "**System**",
          value:
            `• **OS**: ${osver}\n` +
            `• **Bot**: v${require("../../package.json").version}\n` +
			`• **Uptime**: ${sysuptime}\n` ,
          inline: true,
        },
      ])
      .setFooter({ text: `Build: ${gitHash}` });

    // Gửi embed
    return interaction.reply({ embeds: [statsEmbed], ephemeral: true });
  });

module.exports = command;
