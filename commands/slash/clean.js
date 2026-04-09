const { t } = require("../../util/i18n");
const SlashCommand = require("../../lib/SlashCommand");
const command = new SlashCommand().setName("clean").setDescription(t("clean.auto_37")).addIntegerOption(option => option.setName("number").setDescription(t("clean.auto_38")).setMinValue(2).setMaxValue(100).setRequired(false)).setRun(async (client, interaction, options) => {
  await interaction.deferReply({
    ephemeral: true
  });
  let number = interaction.options.getInteger("number");
  number = number && number < 100 ? ++number : 100;
  interaction.channel.messages.fetch({
    limit: number
  }).then(messages => {
    const botMessages = [];
    messages.filter(m => {
      let isPlayingMessage = false;
      if (client.manager) {
        const player = client.manager.getPlayer(interaction.guild.id);
        if (player && player.nowPlayingMessage && player.nowPlayingMessage.id === m.id) {
          isPlayingMessage = true;
        }
      }
      return m.author.id === client.user.id && !isPlayingMessage;
    }).forEach(msg => botMessages.push(msg));
    botMessages.shift();
    interaction.channel.bulkDelete(botMessages, true).then(async deletedMessages => {
      //Filtering out messages that did not get deleted.
      messages = messages.filter(msg => {
        !deletedMessages.some(deletedMsg => deletedMsg == msg);
      });
      if (messages.size > 0) {
        client.log(t("clean.auto_39", {
          var1: messages.size
        }));
        for (const msg of messages) {
          await msg.delete();
        }
      }
      await interaction.editReply({
        embeds: [client.Embed(t("clean.auto_40", {
          var1: botMessages.length
        }))]
      });
      setTimeout(() => {
        interaction.deleteReply();
      }, 5000);
    });
  });
});
module.exports = command;