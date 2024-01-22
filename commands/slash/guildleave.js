const { MessageEmbed, message } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");
const fs = require("fs");
const path = require("path");
const { forEach } = require("lodash");

const command = new SlashCommand()
	.setName("guildleave")
	.setDescription("rời khỏi máy chủ")
    .addStringOption((option) =>
    option
      .setName("id")
      .setDescription("Nhập ID của máy chủ để rời đi (gõ `list` để hiển thị danh sách ID của máy chủ).")
      .setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
		if (interaction.user.id === client.config.adminId) {
		    try{
			const id = interaction.options.getString('id');

			if (id.toLowerCase() === 'list'){
			    client.guilds.cache.forEach((guild) => {
				console.log(`${guild.name} | ${guild.id}`);
			    });
			    const guild = client.guilds.cache.map(guild => ` ${guild.name} | ${guild.id}`);
			    try{
				return interaction.reply({content:`Server:\n\`${guild}\``, ephemeral: true});
			    }catch{
				return interaction.reply({content:`kiểm tra console để xem danh sách các máy chủ`, ephemeral: true});
			    }
			}

			const guild = client.guilds.cache.get(id);

			if(!guild){
			    return interaction.reply({content: `\`${id}\` ko phải là một ID máy chủ hợp lệ`, ephemeral:true});
			}

			await guild.leave().then(c => console.log(`rời khỏi máy chủ ${id}`)).catch((err) => {console.log(err)});
			return interaction.reply({content:`rời khỏi máy chủ. \`${id}\``, ephemeral: true});
		    }catch (error){
			console.log(`có lỗi khi cố gắng rời khỏi máy chủ ${id}`, error);
		    }
		}else {
			return interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(client.config.embedColor)
						.setDescription("Bạn không được ủy quyền để sử dụng lệnh này!"),
				],
				ephemeral: true,
			});
		}
	});

module.exports = command;
