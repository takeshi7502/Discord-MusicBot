const { MessageEmbed } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
  .setName("guildleave")
  .setDescription("Rời khỏi máy chủ")
  .addStringOption((option) =>
    option
      .setName("id")
      .setDescription("Nhập ID của máy chủ để rời đi (gõ `list` để hiển thị danh sách ID của máy chủ).")
      .setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
    try {
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

      const id = interaction.options.getString('id');

      if (id.toLowerCase() === 'list') {
        const guildListEmbed = new MessageEmbed()
          .setColor(client.config.embedColor)
          .setTitle("Danh sách ID máy chủ")
          .setDescription(
            client.guilds.cache.map(guild => `**${guild.name}**: ${guild.id}`).join('\n')
          );

        console.log("Danh sách ID máy chủ:", client.guilds.cache.map(guild => guild.id).join(', '));

        return interaction.reply({ embeds: [guildListEmbed], ephemeral: true });
      }

      const guild = client.guilds.cache.get(id);

      if (!guild) {
        console.error(`[${client.user.tag}] Máy chủ không tồn tại: ${id}`);
        return interaction.reply({ content: `\`${id}\` không phải là một ID máy chủ hợp lệ`, ephemeral: true });
      }

      await guild.leave();
      console.log(`[${client.user.tag}] Rời khỏi máy chủ: ${id}`);
      return interaction.reply({ content: `Rời khỏi máy chủ \`${id}\``, ephemeral: true });
    } catch (error) {
      console.error(`[${client.user.tag}] Có lỗi khi thực hiện lệnh:`, error);
      return interaction.reply({ content: "Có lỗi xảy ra khi thực hiện lệnh.", ephemeral: true });
    }
  });

module.exports = command;