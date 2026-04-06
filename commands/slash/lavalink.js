const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");

const MAX_NODES = 10;

// ====== HELPER: Ghi nodes vào config.js ======
function writeNodesToConfig(nodes) {
  const configPath = path.resolve(__dirname, "..", "..", "config.js");
  let content = fs.readFileSync(configPath, "utf8");

  // Build nodes string
  const nodesStr = nodes.map((n, i) => {
    return `\t\t{
\t\t\tid: "${n.id}",
\t\t\thost: "${n.host}",
\t\t\tport: ${n.port},
\t\t\tauthorization: "${n.authorization}",
\t\t\tretryAmount: ${n.retryAmount || 200},
\t\t\tretryDelay: ${n.retryDelay || 40},
\t\t\tsecure: ${n.secure || false},
\t\t\trequestTimeout: ${n.requestTimeout || 60000},
\t\t}`;
  }).join(",\n");

  // Replace nodes array in config
  content = content.replace(
    /nodes:\s*\[[\s\S]*?\n\t\],/,
    `nodes: [\n${nodesStr},\n\t],`
  );

  fs.writeFileSync(configPath, content, "utf8");
}

// ====== HELPER: Tìm slot ID trống nhỏ nhất ======
function findNextNodeId(existingNodes) {
  for (let i = 1; i < MAX_NODES; i++) {
    const id = `node${i}`;
    if (!existingNodes.find(n => n.id === id)) return id;
  }
  return null;
}

// ====== HELPER: Ping test 1 node ======
async function pingNode(host, port, password, secure) {
  const proto = secure ? "https" : "http";
  const url = `${proto}://${host}:${port}/v4/info`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const startTime = Date.now();
  try {
    const res = await fetch(url, {
      headers: { Authorization: password },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, data, latency };
  } catch (err) {
    clearTimeout(timeout);
    return { success: false, error: err.message };
  }
}

const command = new SlashCommand()
  .setName("lavalink")
  .setDescription("Quản lý Lavalink Nodes (add/remove/list/test)")
  .setAdminOnly(true)
  .addStringOption((option) =>
    option
      .setName("action")
      .setDescription("Hành động cần thực hiện")
      .setRequired(true)
      .addChoices(
        { name: "📋 list — Xem danh sách nodes", value: "list" },
        { name: "➕ add — Thêm node mới", value: "add" },
        { name: "➖ remove — Xoá node", value: "remove" },
        { name: "🔍 test — Test 1 node", value: "test" },
        { name: "♻️ reload — Tải lại cấu hình nodes", value: "reload" },
      )
  )
  .addStringOption((option) =>
    option.setName("host").setDescription("[add/test] Địa chỉ máy chủ (VD: lavalink.example.com)").setRequired(false)
  )
  .addIntegerOption((option) =>
    option.setName("port").setDescription("[add/test] Cổng kết nối (VD: 443, 80, 2333)").setRequired(false)
  )
  .addStringOption((option) =>
    option.setName("password").setDescription("[add/test] Mật khẩu Authorization").setRequired(false)
  )
  .addBooleanOption((option) =>
    option.setName("secure").setDescription("[add/test] Dùng SSL? (true = HTTPS)").setRequired(false)
  )
  .addStringOption((option) =>
    option.setName("idnode").setDescription("[remove] ID node cần xoá (VD: node1, node2)").setRequired(false)
  )
  .setRun(async (client, interaction, options) => {
    if (interaction.user.id !== client.config.adminId) {
      return interaction.reply({
        embeds: [client.ErrorEmbed("Bạn không có quyền sử dụng lệnh này!")],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const action = options.getString("action");

    // ================================================================
    // ACTION: LIST
    // ================================================================
    if (action === "list") {
      const configNodes = client.config.nodes || [];
      const liveNodes = client.manager.nodeManager.nodes;

      if (configNodes.length === 0) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription("❌ Không có node nào trong config!")],
        });
      }

      let desc = `📋 **Danh Sách Lavalink Nodes** (${configNodes.length}/${MAX_NODES})\n\n`;

      for (const cfg of configNodes) {
        const liveNode = liveNodes.get(cfg.id);
        const isConnected = liveNode?.connected;
        const icon = isConnected ? "🟢" : "🔴";

        desc += `${icon} **${cfg.id}** | \`${cfg.host}:${cfg.port}\` | ${cfg.secure ? "SSL" : "Non-SSL"}`;

        if (isConnected && liveNode.stats) {
          desc += ` | Players: ${liveNode.stats.playingPlayers}/${liveNode.stats.players}`;
        } else if (!isConnected) {
          desc += ` | Mất kết nối`;
        }
        desc += `\n`;
      }

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setDescription(desc)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // ================================================================
    // ACTION: TEST
    // ================================================================
    if (action === "test") {
      const host = options.getString("host")?.trim();
      const port = options.getInteger("port");
      const password = options.getString("password");
      const secure = options.getBoolean("secure") ?? false;

      if (!host || !port || !password) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription("❌ Cần nhập đầy đủ: `host`, `port`, `password`")],
        });
      }

      const proto = secure ? "https" : "http";
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor("#FFAA00").setDescription(`🔍 Đang ping \`${proto}://${host}:${port}\`...`)],
      });

      const result = await pingNode(host, port, password, secure);

      if (result.success) {
        const d = result.data;
        const embed = new EmbedBuilder()
          .setColor("#00FF00")
          .setDescription(
            `✅ **Lavalink Online!**\n` +
            `**Host:** \`${host}:${port}\` (${secure ? "SSL" : "Non-SSL"})\n` +
            `**Version:** ${d.version?.semver || "N/A"}\n` +
            `**Latency:** ${result.latency}ms\n` +
            `**Sources:** ${d.sourceManagers?.join(", ") || "N/A"}`
          )
          .setTimestamp();
        
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
        const addBtn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("lavalink_test_add")
            .setLabel("➕ Thêm Node này")
            .setStyle(ButtonStyle.Success)
        );

        const msg = await interaction.editReply({ embeds: [embed], components: [addBtn] });

        const collector = msg.createMessageComponentCollector({ time: 60000 });
        collector.on("collect", async (btn) => {
          if (btn.user.id !== interaction.user.id) {
            return btn.reply({ content: "Đây không phải lệnh của bạn!", ephemeral: true });
          }

          if (btn.customId === "lavalink_test_add") {
             collector.stop("added");
             await btn.deferUpdate();

             const configNodes = client.config.nodes || [];
             if (configNodes.length >= MAX_NODES) {
               return interaction.editReply({ embeds: [new EmbedBuilder().setColor("#FF0000").setDescription(`❌ Đã đạt giới hạn **${MAX_NODES} nodes**!`)], components: [] });
             }
             if (configNodes.find(n => n.host === host && n.port === port)) {
               return interaction.editReply({ embeds: [new EmbedBuilder().setColor("#FF0000").setDescription(`❌ Node \`${host}:${port}\` đã tồn tại!`)], components: [] });
             }
             
             const newId = findNextNodeId(configNodes);
             if (!newId) return interaction.editReply({ embeds: [new EmbedBuilder().setColor("#FF0000").setDescription(`❌ Không tìm được slot ID trống!`)], components: [] });

             const newNodeConfig = { id: newId, host, port, authorization: password, retryAmount: 200, retryDelay: 40, secure, requestTimeout: 60000 };
             configNodes.push(newNodeConfig);

             try {
                writeNodesToConfig(configNodes);
                client.config.nodes = configNodes;
                client.manager.options.nodes = configNodes;
                client.manager.nodeManager.createNode(newNodeConfig);
                await client.manager.nodeManager.connectAll();
                if (client.lavalinkNotified) client.lavalinkNotified.delete(newId);

                const succEmbed = new EmbedBuilder()
                  .setColor("#00FF00")
                  .setDescription(`✅ **Đã thêm node thành công!**\n**ID:** \`${newId}\`\n**Host:** \`${host}:${port}\` (${secure ? "SSL" : "Non-SSL"})\n**Tổng nodes:** ${configNodes.length}/${MAX_NODES}`)
                  .setTimestamp();
                await interaction.editReply({ embeds: [succEmbed], components: [] });

                if (client.sendLavalinkNotification) {
                  client.sendLavalinkNotification(new EmbedBuilder().setColor("#00FF00").setDescription(`➕ **Node Mới Đã Thêm**\n**ID:** \`${newId}\` | **Host:** \`${host}:${port}\`\n**Tổng nodes:** ${configNodes.length}`).setTimestamp());
                }
             } catch (err) {
                return interaction.editReply({ embeds: [new EmbedBuilder().setColor("#FF0000").setDescription(`❌ Lỗi: \`${err.message}\``)], components: [] });
             }
          }
        });
        
        collector.on("end", (_, reason) => {
          if (reason === "time") interaction.editReply({ components: [] }).catch(() => {});
        });
        
        return;
      } else {
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setDescription(
            `❌ **Không thể kết nối!**\n` +
            `**Host:** \`${host}:${port}\`\n` +
            `**Lỗi:** \`${result.error}\``
          )
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      }
    }

    // ================================================================
    // ACTION: ADD
    // ================================================================
    if (action === "add") {
      const host = options.getString("host")?.trim();
      const port = options.getInteger("port");
      const password = options.getString("password");
      const secure = options.getBoolean("secure") ?? false;

      if (!host || !port || !password) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription("❌ Cần nhập đầy đủ: `host`, `port`, `password`")],
        });
      }

      const configNodes = client.config.nodes || [];

      // Kiểm tra giới hạn
      if (configNodes.length >= MAX_NODES) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription(`❌ Đã đạt giới hạn **${MAX_NODES} nodes**! Xoá bot 1 node trước.`)],
        });
      }

      // Kiểm tra trùng host
      if (configNodes.find(n => n.host === host && n.port === port)) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription(`❌ Node \`${host}:${port}\` đã tồn tại!`)],
        });
      }

      // Test trước khi thêm
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor("#FFAA00").setDescription(`🔍 Đang test \`${host}:${port}\` trước khi thêm...`)],
      });

      const result = await pingNode(host, port, password, secure);
      if (!result.success) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription(
            `❌ **Không thể kết nối!** Node này không hoạt động.\n` +
            `**Host:** \`${host}:${port}\`\n` +
            `**Lỗi:** \`${result.error}\`\n\n` +
            `Dùng \`/lavalink action:test\` để kiểm tra lại.`
          )],
        });
      }

      // Tìm ID mới
      const newId = findNextNodeId(configNodes);
      if (!newId) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription(`❌ Không tìm được slot ID trống!`)],
        });
      }

      // Thêm vào config
      const newNodeConfig = {
        id: newId,
        host,
        port,
        authorization: password,
        retryAmount: 200,
        retryDelay: 40,
        secure,
        requestTimeout: 60000,
      };

      configNodes.push(newNodeConfig);

      try {
        // Ghi file config
        writeNodesToConfig(configNodes);

        // Cập nhật runtime config
        client.config.nodes = configNodes;
        client.manager.options.nodes = configNodes;

        // Tạo + kết nối node mới
        client.manager.nodeManager.createNode(newNodeConfig);
        await client.manager.nodeManager.connectAll();

        // Reset cờ thông báo
        if (client.lavalinkNotified) client.lavalinkNotified.delete(newId);

        const embed = new EmbedBuilder()
          .setColor("#00FF00")
          .setDescription(
            `✅ **Đã thêm node thành công!**\n` +
            `**ID:** \`${newId}\`\n` +
            `**Host:** \`${host}:${port}\` (${secure ? "SSL" : "Non-SSL"})\n` +
            `**Latency:** ${result.latency}ms\n` +
            `**Tổng nodes:** ${configNodes.length}/${MAX_NODES}`
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Thông báo kênh setlog
        if (client.sendLavalinkNotification) {
          client.sendLavalinkNotification(
            new EmbedBuilder()
              .setColor("#00FF00")
              .setDescription(
                `➕ **Node Mới Đã Thêm**\n` +
                `**ID:** \`${newId}\` | **Host:** \`${host}:${port}\`\n` +
                `**Tổng nodes:** ${configNodes.length}`
              )
              .setTimestamp()
          );
        }

      } catch (err) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription(`❌ Lỗi: \`${err.message}\``)],
        });
      }
    }

    // ================================================================
    // ACTION: REMOVE
    // ================================================================
    if (action === "remove") {
      const idnode = options.getString("idnode")?.trim().toLowerCase();

      if (!idnode) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription("❌ Cần nhập `idnode` (VD: node1, node2)")],
        });
      }

      // Không cho xoá node0
      if (idnode === "node0") {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription("❌ Không thể xoá **node0**! Đây là node chính, luôn phải tồn tại.")],
        });
      }

      const configNodes = client.config.nodes || [];
      const nodeIndex = configNodes.findIndex(n => n.id.toLowerCase() === idnode);

      if (nodeIndex === -1) {
        const available = configNodes.map(n => `\`${n.id}\``).join(", ");
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription(
            `❌ Không tìm thấy node \`${idnode}\`!\n**Nodes hiện có:** ${available}`
          )],
        });
      }

      const removedNode = configNodes[nodeIndex];

      try {
        // Xoá player đang chạy trên node này
        const playersOnNode = [...client.manager.players.values()].filter(p => p.node?.id?.toLowerCase() === idnode);
        for (const player of playersOnNode) {
          try {
            const nowPlayingMsg = player.get("nowPlayingMessage");
            if (nowPlayingMsg) await nowPlayingMsg.delete().catch(() => {});
            const textChannel = client.channels.cache.get(player.textChannelId);
            if (textChannel) {
              await textChannel.send({
                embeds: [new EmbedBuilder()
                  .setColor("#FF8800")
                  .setDescription(`⚠️ **Bot vừa được cập nhật!**\nBạn dùng \`/play\` để phát lại nhạc nhé.`)
                  .setTimestamp()
                ],
              }).catch(() => {});
            }
            await player.destroy().catch(() => {});
          } catch (e) {}
        }

        // Ngắt kết nối node
        const liveNode = client.manager.nodeManager.nodes.get(removedNode.id);
        if (liveNode) {
          try {
            await liveNode.destroy();
          } catch (e) {
            client.manager.nodeManager.nodes.delete(removedNode.id);
          }
        }

        // Xoá khỏi config
        configNodes.splice(nodeIndex, 1);
        writeNodesToConfig(configNodes);
        client.config.nodes = configNodes;
        client.manager.options.nodes = configNodes;

        // Xoá cờ thông báo
        if (client.lavalinkNotified) client.lavalinkNotified.delete(removedNode.id);

        const embed = new EmbedBuilder()
          .setColor("#00FF00")
          .setDescription(
            `✅ **Đã xoá node thành công!**\n` +
            `**ID:** \`${removedNode.id}\`\n` +
            `**Host:** \`${removedNode.host}:${removedNode.port}\`\n` +
            (playersOnNode.length > 0 ? `**Players bị ảnh hưởng:** ${playersOnNode.length}\n` : "") +
            `**Nodes còn lại:** ${configNodes.length}/${MAX_NODES}`
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Thông báo kênh setlog
        if (client.sendLavalinkNotification) {
          client.sendLavalinkNotification(
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription(
                `➖ **Node Đã Xoá**\n` +
                `**ID:** \`${removedNode.id}\` | **Host:** \`${removedNode.host}:${removedNode.port}\`\n` +
                `**Nodes còn lại:** ${configNodes.length}`
              )
              .setTimestamp()
          );
        }

      } catch (err) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription(`❌ Lỗi: \`${err.message}\``)],
        });
      }
    }

    // ================================================================
    // ACTION: RELOAD
    // ================================================================
    if (action === "reload") {
      try {
        const configPath = path.resolve(__dirname, "..", "..", "config.js");
        const devConfigPath = path.resolve(__dirname, "..", "..", "config.dev.js");
        let newConfig;

        if (fs.existsSync(devConfigPath)) {
          delete require.cache[require.resolve(devConfigPath)];
          newConfig = require(devConfigPath);
        } else {
          delete require.cache[require.resolve(configPath)];
          newConfig = require(configPath);
        }

        const oldNodes = client.config.nodes || [];
        const newNodes = newConfig.nodes || [];
        const lavalinkChanged = JSON.stringify(oldNodes) !== JSON.stringify(newNodes);

        client.config = newConfig;

        let changeMsg = "";
        if (lavalinkChanged) {
          const oldIds = oldNodes.map(n => n.id);
          const newIds = newNodes.map(n => n.id);
          const added = newNodes.filter(n => !oldIds.includes(n.id));
          const removed = oldNodes.filter(n => !newIds.includes(n.id));
          const kept = newNodes.filter(n => oldIds.includes(n.id));
          
          changeMsg = `🔄 **Nodes đã thay đổi:** `;
          if (added.length) changeMsg += `+${added.length} Thêm | `;
          if (removed.length) changeMsg += `-${removed.length} Xoá | `;
          if (kept.length) changeMsg += `=${kept.length} Giữ lại`;
        } else {
          changeMsg = `🔄 **Không có thay đổi mới.** Kết nối lại ${newNodes.length} nodes...`;
        }

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FFAA00").setDescription(`♻️ **Đang tải lại cấu hình Lavalink...**\n${changeMsg}`)]
        });

        const activePlayers = [...client.manager.players.values()];

        try {
          await client.manager.nodeManager.disconnectAll(true, false);
        } catch (e) {
          client.manager.nodeManager.nodes.clear();
        }

        client.manager.options.nodes = newConfig.nodes;

        if (client.lavalinkNotified) client.lavalinkNotified.clear();

        for (const nodeOpts of newConfig.nodes) {
          client.manager.nodeManager.createNode(nodeOpts);
        }

        const connected = await client.manager.nodeManager.connectAll();

        if (activePlayers.length > 0) {
          for (const player of activePlayers) {
            try {
              const nowPlayingMsg = player.get("nowPlayingMessage");
              if (nowPlayingMsg) await nowPlayingMsg.delete().catch(() => {});
              const textChannel = client.channels.cache.get(player.textChannelId);
              if (textChannel) {
                await textChannel.send({
                  embeds: [new EmbedBuilder().setColor("#FF8800").setDescription("⚠️ **Lavalink vừa được cập nhật cấu hình!**\nBạn dùng `/play` để phát lại nhạc nhé.").setTimestamp()]
                }).catch(() => {});
              }
              await player.destroy().catch(() => {});
            } catch (e) {}
          }
        }

        const succEmbed = new EmbedBuilder()
          .setColor("#00FF00")
          .setDescription(`✅ **Tải lại Lavalink thành công!**\n**Đã kết nối:** \`${connected}\` nodes.\n${activePlayers.length > 0 ? `**Dọn dẹp:** \`${activePlayers.length}\` player bị gián đoạn.` : ""}`)
          .setTimestamp();

        await interaction.editReply({ embeds: [succEmbed] });

        if (lavalinkChanged && client.sendLavalinkNotification) {
          const oldIds = oldNodes.map(n => n.id);
          const newIds = newNodes.map(n => n.id);
          const added = newNodes.filter(n => !oldIds.includes(n.id));
          const removed = oldNodes.filter(n => !newIds.includes(n.id));
          const kept = newNodes.filter(n => oldIds.includes(n.id));

          let notifyMsg = `🔄 **Lavalink Đã Thay Đổi (Reload)**\n`;
          if (added.length) notifyMsg += added.map(n => `➕ \`${n.id}\`|\`${n.host}:${n.port}\``).join("\n") + "\n";
          if (removed.length) notifyMsg += removed.map(n => `➖ \`${n.id}\`|\`${n.host}:${n.port}\``).join("\n") + "\n";
          if (kept.length) notifyMsg += kept.map(n => `▪️ \`${n.id}\`|\`${n.host}:${n.port}\``).join("\n") + "\n";
          notifyMsg += `**Kết nối:** ${connected} node`;

          client.sendLavalinkNotification(new EmbedBuilder().setColor("#00AAFF").setDescription(notifyMsg).setTimestamp());
        }

      } catch (err) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription(`❌ Lỗi Reload Lavalink: \`${err.message}\``)],
        });
      }
    }
  });

module.exports = command;
