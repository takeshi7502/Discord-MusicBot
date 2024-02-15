const { MessageEmbed } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
  .setName("guildleave")
  .setDescription("leaves a guild")
  .addStringOption((option) =>
    option
      .setName("id")
      .setDescription("Enter the guild id to leave (type `list` for guild ids)")
      .setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
    try {
      if (interaction.user.id !== client.config.adminId) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.config.embedColor)
              .setDescription("You are not authorized to use this command!"),
          ],
          ephemeral: true,
        });
      }

      const id = interaction.options.getString('id');

      if (id.toLowerCase() === 'list') {
        const guildListEmbed = new MessageEmbed()
          .setColor(client.config.embedColor)
          .setTitle("Server ID list")
          .setDescription(
            client.guilds.cache.map(guild => `**${guild.name}**: ${guild.id}`).join('\n')
          );

        console.log("Server ID list:", client.guilds.cache.map(guild => guild.id).join(', '));

        return interaction.reply({ embeds: [guildListEmbed], ephemeral: true });
      }

      const guild = client.guilds.cache.get(id);

      if (!guild) {
        console.error(`[${client.user.tag}] Server does not exist: ${id}`);
        return interaction.reply({ content: `\`${id}\` is not a valid server ID`, ephemeral: true });
    }
    
    await guild.leave();
    console.log(`[${client.user.tag}] Left server: ${id}`);
    return interaction.reply({ content: `Left server \`${id}\``, ephemeral: true });
    } catch (error) {
        console.error(`[${client.user.tag}] An error occurred while executing the command:`, error);
        return interaction.reply({ content: "An error occurred while executing the command.", ephemeral: true });
    }    
  });

module.exports = command;