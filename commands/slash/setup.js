const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, ChannelType } = require("discord.js");

const command = new SlashCommand()
  .setName("setup")
  .setDescription("Thiết lập kênh nhận thông báo riêng tư từ Bot")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Chọn kênh để nhận thông báo update")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
    // Chỉ những người có quyền quản lý server mới được setup
    if (!interaction.member.permissions.has("ManageGuild")) {
      return interaction.reply({
        embeds: [client.ErrorEmbed("Bạn cần quyền Quản Lý Máy Chủ (Manage Guild) để chạy lệnh này!")],
        ephemeral: true
      });
    }

    const channel = options.getChannel("channel");

    // Lưu vào db.json
    await client.database.set(`announce_channel_${interaction.guildId}`, channel.id);

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setDescription(`✅ | Kênh nhận thông báo cập nhật đã được thiết lập thành <#${channel.id}>`);

    return interaction.reply({ embeds: [embed] });
  });

module.exports = command;
