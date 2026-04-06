const { EmbedBuilder, ChannelType } = require("discord.js");

module.exports = async (client, guild) => {
    try {
        client.log(`Bot vừa được mời vào máy chủ mới: ${guild.name} (ID: ${guild.id}) - Bề tôi: ${guild.memberCount}`);

        // Lấy ID kênh log từ database (Kênh này do Admin gốc gõ /setlog để cấu hình)
        const logChannelId = await client.database.get("admin_log_channel");

        if (logChannelId) {
            const logChannel = client.channels.cache.get(logChannelId);
            if (logChannel) {
                // Lấy thông tin người chủ của Server mới bế bot vào (tuỳ chọn)
                let ownerStr = "Không rõ";
                try {
                    const owner = await guild.fetchOwner();
                    ownerStr = `${owner.user.tag} (ID: ${owner.id})`;
                } catch (e) { }

                const embed = new EmbedBuilder()
                    .setColor("#00FF00") // Màu xanh lá: Vào mới
                    .setAuthor({ name: "🚀 BOT VỪA CẬP BẾN MÁY CHỦ MỚI!" })
                    .setThumbnail(guild.iconURL() || client.user.displayAvatarURL())
                    .addFields(
                        { name: "Tên Server", value: `\`${guild.name}\``, inline: true },
                        { name: "ID Server", value: `\`${guild.id}\``, inline: true },
                        { name: "Số thành viên", value: `\`${guild.memberCount}\`👤`, inline: true },
                        { name: "Chủ Server", value: `\`${ownerStr}\``, inline: false },
                        { name: "Tổng Server Bot đang ở", value: `\`${client.guilds.cache.size}\` Server`, inline: false }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] }).catch(() => { });
            }
        }

        // ----------------------------------------------------
        // GỬI LỜI CHÀO MỜI ĐẾN MÁY CHỦ VỪA THAM GIA
        // ----------------------------------------------------
        const targetChannel = guild.channels.cache.find(c =>
            c.type === ChannelType.GuildText &&
            c.permissionsFor(guild.members.me).has("SendMessages") &&
            c.permissionsFor(guild.members.me).has("ViewChannel")
        );

        if (targetChannel) {
            const welcomeEmbed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setAuthor({ name: "Cảm ơn vì đã sử dụng Bot!", iconURL: client.config.iconURL || client.user.displayAvatarURL() })
                .setTitle("👋 Xin chào!")
                .setDescription(
                    `Chào mn! Tekisha Music là một Bot Nghe nhạc miễn phí với đầy đủ tính năng, không quảng cáo, không tính phí, không giới hạn thời gian sử dụng.\n` +
                    `*Cảm ơn bạn đã sử dụng Bot. Gõ \`/help\` để khám phá các lệnh nhé!*\n\n` +
                    `**Bạn Admin Server gõ lệnh sau để chỉ định kênh nhận tin nhé:**\n` +
                    `👉 Gõ lệnh: \`/setup\`\n`

                )
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();

            await targetChannel.send({ embeds: [welcomeEmbed] }).catch(() => { });
        }
    } catch (error) {
        client.error(`Lỗi guildCreate: ${error.message}`);
    }
};
