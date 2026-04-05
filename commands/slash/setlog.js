const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, ChannelType } = require("discord.js");

const command = new SlashCommand()
  .setName("setlog")
  .setDescription("Thiết lập kênh báo cáo Bot Join/Leave Server (Chỉ dành cho Admin Bot)")
  .setAdminOnly(true)
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Chọn một kênh để bot spam báo cáo mỗi khi có người Invite bot")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
    // Chỉ tài khoản Admin cấu hình trong config mới xài được
    if (interaction.user.id !== client.config.adminId) {
      return interaction.reply({
        embeds: [client.ErrorEmbed("Bạn không có đặc quyền để quy hoạch tính năng nội bộ này!")],
        ephemeral: true
      });
    }

    const channel = options.getChannel("channel");

    // Lưu vào db.json cái ID của kênh log
    await client.database.set("admin_log_channel", channel.id);

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setDescription(`✅ | Đã quy hoạch trạm tình báo! Từ nay mỗi khi Bot chui vào Server lạ hoặc bị sút khỏi Server nào, nó sẽ bẩm báo về <#${channel.id}>`);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  });

module.exports = command;
