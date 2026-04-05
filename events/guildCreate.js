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
                } catch (e) {}

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

                await logChannel.send({ embeds: [embed] }).catch(() => {});
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
                .setTitle("👋 Hướng dẫn nhận thông báo Cập Nhật, Fix Lỗi")
                .setDescription(
                    `Chào mn! Mình là một Bot Âm Nhạc xịn xò con bò.\n\n` +
                    `Để không bỏ lỡ các thông báo quan trọng từ Admin Bot (Ví dụ: thông báo đứt cáp, cập nhật sửa lỗi, bảo trì server,...), ` +
                    `**Chủ Server hoặc Quản Trị Viên (Admin) vui lòng gõ lệnh sau để chỉ định kênh nhận tin nhé:**\n\n` +
                    `👉 Gõ lệnh: \`/setup\`\n\n` +
                    `Bot sẽ lưu kênh đó lại và vĩnh viễn chỉ gửi thông báo quan trọng vào đúng kênh đó thôi, không làm phiền kênh chat chính của các bạn!\n\n` +
                    `*Một lần nữa cảm ơn bạn đã mời bot. Gõ \`/help\` để khám phá các lệnh nhạc nhé!*`
                )
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();

            await targetChannel.send({ embeds: [welcomeEmbed] }).catch(() => {});
        }
    } catch (error) {
        client.error(`Lỗi guildCreate: ${error.message}`);
    }
};
