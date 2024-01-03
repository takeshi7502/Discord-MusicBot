const colors = require("colors");
const { MessageEmbed } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
  .setName("autopause")
  .setDescription("Tự động tạm dừng khi mọi người rời khỏi kênh thoại (bật/tắt)")
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

    let autoPauseEmbed = new MessageEmbed().setColor(client.config.embedColor);
    const autoPause = player.get("autoPause");
    player.set("requester", interaction.guild.members.me);

    if (!autoPause || autoPause === false) {
      player.set("autoPause", true);
    } else {
      player.set("autoPause", false);
    }
    autoPauseEmbed
			.setDescription(`**Auto Pause is** \`${!autoPause ? "ON" : "OFF"}\``)
			.setFooter({
			  text: `Trình phát sẽ ${!autoPause ? "tự động" : "ko còn bị"} dừng khi mọi người rời khỏi kênh thoại.`
			});
    client.warn(
      `Player: ${player.options.guild} | [${colors.blue(
        "AUTOPAUSE"
      )}] has been [${colors.blue(!autoPause ? "ENABLED" : "DISABLED")}] in ${
        client.guilds.cache.get(player.options.guild)
          ? client.guilds.cache.get(player.options.guild).name
          : "a guild"
      }`
    );

    return interaction.reply({ embeds: [autoPauseEmbed] });
  });

module.exports = command;
