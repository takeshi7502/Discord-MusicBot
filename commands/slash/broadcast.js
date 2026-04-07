const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const command = new SlashCommand()
  .setName("broadcast")
  .setDescription("Phóng thanh thông báo (Chỉ dành cho Admin Bot)")
  .setAdminOnly(true)
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("Nội dung tin nhắn cần thông báo")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("target")
      .setDescription("Nhập ID Server để gửi riêng, chữ 'all' gửi toàn bộ, dấu '.' gửi Server này")
      .setRequired(false)
  )
  .setRun(async (client, interaction, options) => {
    // Tránh việc lệnh chạy quá lâu bị timeout
    await interaction.deferReply({ ephemeral: true }).catch(() => { });

    // Kiểm tra quyền: Chỉ tài khoản Admin gốc mớii xài được lệnh này
    if (interaction.user.id !== client.config.adminId) {
      return interaction.editReply({
        embeds: [client.ErrorEmbed("Bạn không có đặc quyền để sử dụng hệ thống phóng thanh tột đỉnh này!")],
      }).catch(() => { });
    }

    let messageContent = options.getString("message");
    let targetOpt = options.getString("target");

    // Hỗ trợ gõ \n để xuống dòng trong Embed
    messageContent = messageContent.replace(/\\n/g, "\n");

    // Nếu nhập có khoảng trắng ở đầu đuôi thì cắt đi
    if (targetOpt) targetOpt = targetOpt.trim();

    let guildsToProcess = new Map();

    if (!targetOpt || targetOpt === "." || targetOpt === "here") {
      // Trường hợp 1: Không tải target hoặc gõ "." -> Chỉ gửi ở Server hiện tại (Để Test)
      const guild = client.guilds.cache.get(interaction.guildId);
      if (guild) guildsToProcess.set(guild.id, guild);
    } else if (targetOpt.toLowerCase() === "all") {
      // Trường hợp 3: Nhập "all" -> Gửi toàn bộ server
      guildsToProcess = client.guilds.cache;
    } else {
      // Trường hợp 2: Có ID Server cụ thể -> Chỉ móc đúng Server đó ra
      const guild = client.guilds.cache.get(targetOpt);
      if (guild) {
        guildsToProcess.set(guild.id, guild);
      } else {
        return interaction.editReply({
          embeds: [client.ErrorEmbed(`❌ Không tìm thấy Server nào có ID: \`${targetOpt}\` mà Bot đang tham gia cả!`)],
        }).catch(() => { });
      }
    }

    let successCount = 0;
    let fallbackCount = 0;
    let failCount = 0;

    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({ name: `📢 Thông báo từ ${client.user.username}` })
      .setDescription(messageContent)
      .setFooter({ text: "Nhấn nút bên dưới để thêm bot mới nhé!" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("THÊM BOT")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.com/oauth2/authorize?client_id=1162333756137406514&permissions=281474980244800&integration_type=0&scope=bot+applications.commands"),
      new ButtonBuilder()
        .setLabel("SERVER CÁ NHÂN")
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.supportServer)
    );

    // Duyệt qua tất cả các server được chọn
    for (const [id, guild] of guildsToProcess) {
      try {
        let targetChannel = null;

        // Ép tải danh sách kênh từ Discord API (vì cache có thể chưa đầy đủ khi dùng "all")
        if (guild.channels.cache.size === 0) {
          await guild.channels.fetch().catch(() => { });
        }

        // Ưu tiên Số 1: Lấy kênh đã set trong File Database
        const savedChannelId = await client.database.get(`announce_channel_${id}`);
        if (savedChannelId) {
          targetChannel = guild.channels.cache.get(savedChannelId);
          // Nếu cache miss, thử fetch trực tiếp kênh đó
          if (!targetChannel) {
            try {
              targetChannel = await guild.channels.fetch(savedChannelId);
            } catch (e) {
              targetChannel = null;
            }
          }
        }

        // Ưu tiên Số 2 (Fallback vét máng): Tìm kênh text đầu tiên bot có chìa khóa gửi tin
        let isFallback = false;
        if (!targetChannel) {
          targetChannel = guild.channels.cache.find(c =>
            c.type === ChannelType.GuildText &&
            c.permissionsFor(guild.members.me)?.has("SendMessages")
          );
          isFallback = true;
        }

        // Phóng tên lửa tin nhắn!
        if (targetChannel) {
          await targetChannel.send({ embeds: [embed], components: [row] }).catch(() => { failCount++; });
          if (isFallback) fallbackCount++;
          else successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    const resultEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({ name: "Chiến dịch Phóng Thanh hoàn tất!" })
      .setDescription(targetOpt?.toLowerCase() === "all" ? `Đã loan tin rải thảm đến toàn bộ Server!` : `Đã báo cáo mục tiêu thành công!`)
      .addFields(
        { name: "✅ Đã setup kênh", value: `${successCount} kênh`, inline: true },
        { name: "⚠️ Rải ngẫu nhiên", value: `${fallbackCount} kênh`, inline: true },
        { name: "❌ Thất bại", value: `${failCount} kênh`, inline: true }
      );

    return interaction.editReply({ embeds: [resultEmbed] }).catch(() => { });
  });

module.exports = command;
