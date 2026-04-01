const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
  .setName("invite")
  .setDescription("Mời tớ vào máy chủ của bạn")
  .setRun(async (client, interaction, options) => {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setTitle(`Mời tớ vào máy chủ của bạn!`),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Mời luôn")
            .setStyle(ButtonStyle.Link)
            .setURL(
              `https://discord.com/oauth2/authorize?client_id=${
                client.config.clientId
              }&permissions=${
                client.config.permissions
              }&scope=bot%20applications.commands`
            )
        ),
      ],
    });
  });
module.exports = command;
