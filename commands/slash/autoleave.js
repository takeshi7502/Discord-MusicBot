const colors = require("colors");
const { MessageEmbed } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
  .setName("autoleave")
  .setDescription("Tự động rời đi khi mọi người rời khỏi kênh thoại (bật/tắt)")
  .setRun(async (client, interaction) => {
    let channel = await client.getChannel(client, interaction);
    if (!channel) return;

    let player;
    if (client.manager)
      player = client.manager.players.get(interaction.guild.id);
    else
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setDescription("Nút Lavalink không được kết nối"),
        ],
      });

    if (!player) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setDescription("Không có gì đang phát trong hàng đợi"),
        ],
        ephemeral: true,
      });
    }

    let autoLeaveEmbed = new MessageEmbed().setColor(client.config.embedColor);
    const autoLeave = player.get("autoLeave");
    player.set("requester", interaction.guild.me);

    if (!autoLeave || autoLeave === false) {
      player.set("autoLeave", true);
    } else {
      player.set("autoLeave", false);
    }
    autoLeaveEmbed
			.setDescription(`**Auto Leave is** \`${!autoLeave ? "ON" : "OFF"}\``)
			.setFooter({
			  text: `Bot sẽ ${!autoLeave ? "tự động" : "không tự động"} rời đi khi kênh thoại trống.`
			});
    client.warn(
      `Player: ${player.options.guild} | [${colors.blue(
        "autoLeave"
      )}] has been [${colors.blue(!autoLeave ? "ENABLED" : "DISABLED")}] in ${
        client.guilds.cache.get(player.options.guild)
          ? client.guilds.cache.get(player.options.guild).name
          : "a guild"
      }`
    );

    return interaction.reply({ embeds: [autoLeaveEmbed] });
  });

module.exports = command;