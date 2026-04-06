const SlashCommand = require("../../lib/SlashCommand");
const moment = require("moment");
require("moment-duration-format");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function buildStatusEmbed(client, autoMode) {
  const runtime = moment
    .duration(client.uptime)
    .format("D[d]・H[h]・m[m]・s[s]", { trim: "all" });

  const allPlayers = [...client.manager.players.values()];
  const playingBotPlayers = allPlayers.filter(p => p.playing && !p.paused).length;
  const pausedBotPlayers = allPlayers.filter(p => p.paused).length;

  let totalListeners = 0;
  for (const player of allPlayers) {
    try {
      const guild = client.guilds.cache.get(player.guildId);
      if (guild) {
        const vc = guild.channels.cache.get(player.voiceChannelId);
        if (vc) totalListeners += vc.members.filter(m => !m.user.bot).size;
      }
    } catch (e) {}
  }

  const botRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

  let desc = `:bar_chart: **Trạng Thái Hệ Thống**\n`;
  desc += `**Bot ${client.user.username}**\n`;
  desc += `**• Ping:** ${client.ws.ping}ms **• Servers:** ${client.guilds.cache.size}\n`;
  desc += `**• Playing:** \`${playingBotPlayers}\` | **Paused:** \`${pausedBotPlayers}\`\n`;
  desc += `**• Listening:** \`${totalListeners}\`\n`;
  desc += `**• RAM:** ${botRam}MB\n`;
  desc += `**• Uptime:** ${runtime}\n`;

  const nodes = [...client.manager.nodeManager.nodes.values()];

  if (nodes.length === 0) {
    desc += `\n:warning: **Không có node Lavalink nào!**`;
  } else {
    for (const node of nodes) {
      const isConnected = node.connected;
      const icon = isConnected ? ":green_circle:" : ":red_circle:";
      const h = node.options?.host || "N/A";
      const p = node.options?.port || "N/A";

      desc += `\n${icon} **${node.id || "Node"}**\n`;
      desc += `**• Host:** \`${h}:${p}\`\n`;
      desc += `**• Status:** ${isConnected ? "Đang hoạt động" : "Mất kết nối"}\n`;

      if (isConnected && node.stats) {
        const lavauptime = moment.duration(node.stats.uptime).format("D[d]・H[h]・m[m]・s[s]", { trim: "all" });
        const lavaramUsed = (node.stats.memory.used / 1024 / 1024).toFixed(1);
        const lavaramAlloc = (node.stats.memory.allocated / 1024 / 1024).toFixed(1);
        const cpuLoad = ((node.stats.cpu?.lavalinkLoad || 0) * 100).toFixed(1);

        desc += `**• Players:** ${node.stats.playingPlayers}/${node.stats.players} (chung node)\n`;
        desc += `**• RAM:** ${lavaramUsed}MB / ${lavaramAlloc}MB **• CPU:** ${cpuLoad}%\n`;
        desc += `**• Uptime:** ${lavauptime}\n`;
      }
    }
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const footerText = autoMode
    ? `🔄 Đang tự động cập nhật mỗi 5s • ${timeStr}`
    : `Cập nhật lúc ${timeStr}`;

  return new EmbedBuilder()
    .setColor(client.config.embedColor)
    .setDescription(desc)
    .setTimestamp()
    .setFooter({ text: footerText });
}

// Nút mặc định: chỉ có "Auto Làm mới"
function defaultRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("status_auto")
      .setLabel("🔄 Auto Làm mới")
      .setStyle(ButtonStyle.Primary)
  );
}

// Nút khi đang auto: chỉ có "Tắt Auto"
function autoRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("status_stop")
      .setLabel("⏹ Tắt Auto")
      .setStyle(ButtonStyle.Danger)
  );
}

const command = new SlashCommand()
  .setName("status")
  .setDescription("Xem trạng thái Bot & Lavalink")
  .setRun(async (client, interaction) => {
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

    // Tắt session /status cũ nếu có
    if (client._statusSession) {
      client._statusSession.stop();
      client._statusSession = null;
    }

    await interaction.reply({
      embeds: [buildStatusEmbed(client, false)],
      components: [defaultRow()],
      ephemeral: true,
    });

    let autoInterval = null;
    let autoTimeout = null;

    function stopAuto() {
      if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
      if (autoTimeout) { clearTimeout(autoTimeout); autoTimeout = null; }
    }

    // Lưu session để /status mới có thể tắt cái cũ
    client._statusSession = {
      stop: () => {
        stopAuto();
        if (collector) collector.stop();
      }
    };

    const collector = interaction.channel?.createMessageComponentCollector?.({
      filter: (btn) => ["status_auto", "status_stop"].includes(btn.customId) && btn.user.id === interaction.user.id,
      time: 600000,
    });

    if (!collector) return;

    collector.on("collect", async (btn) => {
      if (btn.customId === "status_auto") {
        stopAuto();

        await btn.update({
          embeds: [buildStatusEmbed(client, true)],
          components: [autoRow()],
        }).catch(() => {});

        autoInterval = setInterval(async () => {
          try {
            await interaction.editReply({
              embeds: [buildStatusEmbed(client, true)],
              components: [autoRow()],
            });
          } catch (e) {
            stopAuto();
          }
        }, 5000);

        autoTimeout = setTimeout(async () => {
          stopAuto();
          try {
            await interaction.editReply({
              embeds: [buildStatusEmbed(client, false)],
              components: [defaultRow()],
            });
          } catch (e) {}
        }, 300000);

      } else if (btn.customId === "status_stop") {
        stopAuto();

        await btn.update({
          embeds: [buildStatusEmbed(client, false)],
          components: [defaultRow()],
        }).catch(() => {});
      }
    });

    collector.on("end", () => {
      stopAuto();
      client._statusSession = null;
    });
  });

module.exports = command;
