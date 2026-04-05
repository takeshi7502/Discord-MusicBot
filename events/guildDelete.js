const { EmbedBuilder } = require("discord.js");

module.exports = async (client, guild) => {
    try {
        client.warn(`Bot vừa bị đuổi khỏi máy chủ: ${guild.name} (ID: ${guild.id})`);

        // Lấy ID kênh log từ database
        const logChannelId = await client.database.get("admin_log_channel");
        
        if (logChannelId) {
            const logChannel = client.channels.cache.get(logChannelId);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor("#FF0000") // Màu đỏ: Bị kick/ẩn
                    .setAuthor({ name: "💔 BOT ĐÃ RỜI KHỎI MÁY CHỦ!" })
                    .setThumbnail(guild.iconURL() || client.user.displayAvatarURL())
                    .addFields(
                        { name: "Tên Server", value: `\`${guild.name}\``, inline: true },
                        { name: "ID Server", value: `\`${guild.id}\``, inline: true },
                        { name: "Tổng Server Bot đang ở", value: `\`${client.guilds.cache.size}\` Server`, inline: false }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] }).catch(() => {});
            }
        }
    } catch (error) {
        client.error(`Lỗi guildDelete: ${error.message}`);
    }
};
