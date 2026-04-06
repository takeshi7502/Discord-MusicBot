const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const path = require("path");
const fs = require("fs");

const command = new SlashCommand()
  .setName("lavalink")
  .setDescription("Kiểm tra và đổi máy chủ Lavalink trực tiếp trên Discord")
  .setAdminOnly(true)
  .addStringOption((option) =>
    option.setName("host").setDescription("Địa chỉ máy chủ (VD: lavalink.example.com)").setRequired(true)
  )
  .addIntegerOption((option) =>
    option.setName("port").setDescription("Cổng kết nối (VD: 443, 80, 2333)").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("password").setDescription("Mật khẩu Authorization").setRequired(true)
  )
  .addBooleanOption((option) =>
    option.setName("secure").setDescription("Dùng SSL/HTTPS? (true = HTTPS, false = HTTP)").setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
    if (interaction.user.id !== client.config.adminId) {
      return interaction.reply({
        embeds: [client.ErrorEmbed("Bạn không có quyền sử dụng lệnh này!")],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const host = options.getString("host").trim();
    const port = options.getInteger("port");
    const password = options.getString("password");
    const secure = options.getBoolean("secure");
    const proto = secure ? "https" : "http";
    const url = `${proto}://${host}:${port}/v4/info`;

    // ======== PING LAVALINK ========
    let statusEmbed = new EmbedBuilder()
      .setColor("#FFAA00")
      .setAuthor({ name: "🔍 Đang kiểm tra Lavalink..." })
      .setDescription(`Đang ping \`${proto}://${host}:${port}\`...`);

    await interaction.editReply({ embeds: [statusEmbed] });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        headers: { "Authorization": password },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const info = await response.json();

      // Thử lấy stats
      let statsInfo = "";
      try {
        const statsRes = await fetch(`${proto}://${host}:${port}/v4/stats`, {
          headers: { "Authorization": password },
        });
        if (statsRes.ok) {
          const stats = await statsRes.json();
          const uptime = stats.uptime || 0;
          const days = Math.floor(uptime / 86400000);
          const hours = Math.floor((uptime % 86400000) / 3600000);
          const mins = Math.floor((uptime % 3600000) / 60000);
          statsInfo = `\n**Hoạt động liên tục:** \`${days} ngày, ${hours} giờ, ${mins} phút\`\n**Players đang chạy:** \`${stats.players || 0}\``;
        }
      } catch (e) {}

      // Trích xuất thông tin
      const version = info.version?.semver || info.version || "N/A";
      const sources = info.sourceManagers?.join(", ") || "N/A";
      const plugins = info.plugins?.map(p => p.name).join(", ") || "Không có";

      // Hiển thị node hiện tại
      const currentNode = client.config.nodes?.[0] || {};
      const currentInfo = `\`${currentNode.host || "N/A"}:${currentNode.port || "N/A"}\` (${currentNode.secure ? "SSL" : "Non-SSL"})`;

      statusEmbed = new EmbedBuilder()
        .setColor("#00FF00")
        .setAuthor({ name: "✅ LAVALINK TRỰC TUYẾN & SẴN SÀNG" })
        .setDescription(
          `**Địa chỉ:** \`${host}:${port}\` (${secure ? "SSL" : "Non-SSL"})\n` +
          `**Phiên bản:** \`${version}\`\n` +
          `**Nguồn nhạc:** \`${sources}\`\n` +
          `**Tiện ích:** \`${plugins}\`` +
          statsInfo
        )
        .addFields(
          { name: "🔹 Node hiện tại", value: currentInfo, inline: false },
          { name: "🔸 Node mới", value: `\`${host}:${port}\` (${secure ? "SSL" : "Non-SSL"})`, inline: false }
        )
        .setFooter({ text: "Bạn có muốn đổi sang Lavalink này không?" })
        .setTimestamp();

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("lavalink_switch")
          .setLabel("🔄 Đổi sang Node này")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("lavalink_cancel")
          .setLabel("❌ Huỷ")
          .setStyle(ButtonStyle.Secondary)
      );

      const msg = await interaction.editReply({ embeds: [statusEmbed], components: [buttons] });

      // ======== XỬ LÝ NÚT BẤM ========
      const collector = msg.createMessageComponentCollector({ time: 60000 });

      collector.on("collect", async (btn) => {
        if (btn.user.id !== interaction.user.id) {
          return btn.reply({ content: "Không phải việc của bạn nhé!", ephemeral: true });
        }

        if (btn.customId === "lavalink_cancel") {
          collector.stop("cancelled");
          const cancelEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setAuthor({ name: "❌ Đã huỷ thao tác đổi Lavalink" })
            .setTimestamp();
          await btn.update({ embeds: [cancelEmbed], components: [] });
          return;
        }

        if (btn.customId === "lavalink_switch") {
          collector.stop("switched");

          // Ghi vào config.js trên ổ đĩa
          try {
            const configPath = path.resolve(__dirname, "..", "..", "config.js");
            let configContent = fs.readFileSync(configPath, "utf8");

            configContent = configContent.replace(/host:\s*"[^"]*"/, `host: "${host}"`);
            configContent = configContent.replace(/port:\s*\d+/, `port: ${port}`);
            configContent = configContent.replace(/authorization:\s*"[^"]*"/, `authorization: "${password}"`);
            configContent = configContent.replace(/secure:\s*(true|false)/, `secure: ${secure}`);

            fs.writeFileSync(configPath, configContent, "utf8");

            const successEmbed = new EmbedBuilder()
              .setColor("#00FF00")
              .setAuthor({ name: "✅ Đã đổi Lavalink thành công!" })
              .setDescription(
                `**Node mới:** \`${host}:${port}\` (${secure ? "SSL" : "Non-SSL"})\n\n` +
                `⚠️ Config đã được ghi, bấm **Reload** bên dưới để Bot nạp cấu hình mới ngay lập tức!`
              )
              .setTimestamp();

            const reloadBtn = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("lavalink_reload")
                .setLabel("♻️ Reload ngay")
                .setStyle(ButtonStyle.Primary)
            );

            await btn.update({ embeds: [successEmbed], components: [reloadBtn] });

            // Collector mới cho nút Reload
            const reloadCollector = msg.createMessageComponentCollector({ time: 120000 });

            reloadCollector.on("collect", async (reloadBtn) => {
              if (reloadBtn.user.id !== interaction.user.id) {
                return reloadBtn.reply({ content: "Không phải việc của bạn nhé!", ephemeral: true });
              }

              if (reloadBtn.customId === "lavalink_reload") {
                reloadCollector.stop("reloaded");

                try {
                  // Lưu thông tin node cũ trước khi đổi
                  const oldNode = client.config.nodes?.[0] || {};
                  const oldNodeInfo = `${oldNode.id || "N/A"}\`|\`${oldNode.host || "N/A"}:${oldNode.port || "N/A"}\`|\`${oldNode.secure ? "True" : "False"}`;

                  // Xoá cache config.js
                  const cfgPath = path.resolve(__dirname, "..", "..", "config.js");
                  const devCfgPath = path.resolve(__dirname, "..", "..", "dev-config.js");
                  let newConfig;
                  if (fs.existsSync(devCfgPath)) {
                    delete require.cache[require.resolve(devCfgPath)];
                    newConfig = require(devCfgPath);
                  } else {
                    delete require.cache[require.resolve(cfgPath)];
                    newConfig = require(cfgPath);
                  }
                  client.config = newConfig;

                  // Reload commands
                  const slashDir = path.join(__dirname, "..", "slash");
                  fs.readdirSync(slashDir).forEach((file) => {
                    delete require.cache[require.resolve(slashDir + "/" + file)];
                    let cmd = require(slashDir + "/" + file);
                    if (cmd && cmd.run) client.slashCommands.set(file.split(".")[0].toLowerCase(), cmd);
                  });

                  const ctxDir = path.join(__dirname, "..", "context");
                  fs.readdirSync(ctxDir).forEach((file) => {
                    delete require.cache[require.resolve(ctxDir + "/" + file)];
                    let cmd = require(ctxDir + "/" + file);
                    if (cmd?.command && cmd?.run) client.contextCommands.set(file.split(".")[0].toLowerCase(), cmd);
                  });

                  // Lưu danh sách player cũ trước khi đảo node
                  const activePlayers = [...client.manager.players.values()];

                  // Đảo Lavalink - ngắt node cũ
                  try {
                    await client.manager.nodeManager.disconnectAll(true, false);
                  } catch (e) {
                    client.manager.nodeManager.nodes.clear();
                  }
                  client.manager.options.nodes = newConfig.nodes;

                  // Reset cờ thông báo → cho phép event connect/error gửi lại
                  if (client.lavalinkNotified) client.lavalinkNotified.clear();

                  for (const nodeOpts of newConfig.nodes) {
                    client.manager.nodeManager.createNode(nodeOpts);
                  }

                  const connected = await client.manager.nodeManager.connectAll();

                  // SAU KHI RELOAD XONG → Dọn dẹp player cũ
                  for (const player of activePlayers) {
                    try {
                      // Xoá tin nhắn Now Playing cũ
                      const nowPlayingMsg = player.get("nowPlayingMessage");
                      if (nowPlayingMsg) {
                        await nowPlayingMsg.delete().catch(() => {});
                      }
                      // Gửi thông báo vào kênh text
                      const textChannel = client.channels.cache.get(player.textChannelId);
                      if (textChannel) {
                        const reloadEmbed = new EmbedBuilder()
                          .setColor("#FF8800")
                          .setDescription("⚠️ **Lavalink đã được thay đổi!**\nVui lòng dùng `/play` để phát lại nhạc.")
                          .setTimestamp();
                        await textChannel.send({ embeds: [reloadEmbed] }).catch(() => {});
                      }
                      await player.destroy().catch(() => {});
                    } catch (e) {}
                  }

                  const newNode = newConfig.nodes?.[0] || {};
                  const newNodeInfo = `${newNode.id || "N/A"}\`|\`${newNode.host || "N/A"}:${newNode.port || "N/A"}\`|\`${newNode.secure ? "True" : "False"}`;

                  const doneEmbed = new EmbedBuilder()
                    .setColor("#00FF00")
                    .setAuthor({ name: "♻️ Reload Hoàn Tất!" })
                    .setDescription(
                      `✅ Đã tải lại \`${client.slashCommands.size + client.contextCommands.size}\` lệnh\n` +
                      `✅ Đã nạp lại cấu hình\n` +
                      `🚀 Đã kết nối \`${connected}\` node Lavalink mới: \`${host}:${port}\``
                    )
                    .setTimestamp();

                  await reloadBtn.update({ embeds: [doneEmbed], components: [] });

                  // Gửi thông báo đổi Lavalink vào kênh setlog
                  if (client.sendLavalinkNotification) {
                    client.sendLavalinkNotification(
                      new EmbedBuilder()
                        .setColor("#00AAFF")
                        .setDescription(
                          `🔄 **Lavalink Đã Thay Đổi**\n` +
                          `**Node cũ:** \`${oldNodeInfo}\`\n` +
                          `**Node mới:** \`${newNodeInfo}\`\n` +
                          `**Kết nối:** ${connected} node`
                        )
                        .setTimestamp()
                    );
                  }

                } catch (reloadErr) {
                  const errEmbed = new EmbedBuilder()
                    .setColor("#FF0000")
                    .setDescription(`❌ Lỗi Reload: \`${reloadErr.message}\``);
                  await reloadBtn.update({ embeds: [errEmbed], components: [] });
                }
              }
            });

          } catch (writeErr) {
            const errEmbed = new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription(`❌ Lỗi ghi config: \`${writeErr.message}\``);
            await btn.update({ embeds: [errEmbed], components: [] });
          }
        }
      });

      collector.on("end", (_, reason) => {
        if (reason === "time") {
          const timeoutEmbed = new EmbedBuilder()
            .setColor("#888888")
            .setDescription("⏰ Hết thời gian thao tác (60 giây).");
          interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
        }
      });

    } catch (err) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setAuthor({ name: "❌ LAVALINK NGOẠI TUYẾN / KHÔNG THỂ KẾT NỐI" })
        .setDescription(
          `**Địa chỉ:** \`${host}:${port}\` (${secure ? "SSL" : "Non-SSL"})\n` +
          `**Lỗi:** \`${err.message}\`\n\n` +
          `Kiểm tra lại Host, Port, Password hoặc trạng thái máy chủ Lavalink!`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed], components: [] });
    }
  });

module.exports = command;
