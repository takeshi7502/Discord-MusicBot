const Controller = require("../util/Controller");

/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {import("discord.js").Interaction} interaction
 */
module.exports = async (client, interaction) => {
    if (interaction.isChatInputCommand()) {
        let command = client.slashCommands.find(
            (x) => x.name == interaction.commandName,
        );
        if (!command || !command.run) {
            return interaction.reply(
                "Xin lỗi, lệnh bạn đã sử dụng không có bất kỳ chức năng thực thi nào",
            );
        }
        if (command.adminOnly && interaction.user.id !== client.config.adminId) {
            return interaction.reply({
                content: "Bạn không có quyền sử dụng lệnh này!",
                ephemeral: true,
            });
        }

        client.commandsRan++;
        command.run(client, interaction, interaction.options);
        return;
    }

    if (interaction.isContextMenuCommand()) {
        let command = client.contextCommands.find(
            (x) => x.command.name == interaction.commandName,
        );
        if (!command || !command.run) {
            return interaction.reply(
                "Xin lỗi, lệnh bạn vừa sử dụng không có bất kỳ chức năng thực thi nào",
            );
        }
        if (command.adminOnly && interaction.user.id !== client.config.adminId) {
            return interaction.reply({
                content: "Bạn không có quyền sử dụng lệnh này!",
                ephemeral: true,
            });
        }

        client.commandsRan++;
        command.run(client, interaction, interaction.options);
        return;
    }

    if (interaction.isButton()) {
        if (interaction.customId.startsWith("controller")) {
            Controller(client, interaction);
        }
    }

    if (interaction.isAutocomplete()) {
        const query = interaction.options.getString("query");
        if (!query || query === "") return interaction.respond([]).catch(() => {});

        if (interaction.commandName === "play") {
            try {
                // Check if it's a URL
                const isUrl = /^https?:\/\//.test(query);
                if (isUrl) {
                    return interaction.respond([{ name: query, value: query }]).catch(() => {});
                }

                // Search using lavalink-client
                const connectedNodes = [...client.manager.nodeManager.nodes.values()].filter(n => n.connected);
                const node = connectedNodes.length > 0 ? connectedNodes[Math.floor(Math.random() * connectedNodes.length)] : undefined;
                if (!node) return interaction.respond([]).catch(() => {});

                const res = await node.search({ query, source: "youtube" }, interaction.user);
                let choices = [];
                if (res.loadType === "search" && res.tracks) {
                    res.tracks.slice(0, 10).forEach((track) => {
                        const name = `${track.info.title} by ${track.info.author}`;
                        choices.push({
                            name: name.length > 100 ? name.substring(0, 97) + "..." : name,
                            value: track.info.uri,
                        });
                    });
                }
                return interaction.respond(choices).catch(() => {});
            } catch (err) {
                return interaction.respond([]).catch(() => {});
            }
        }
    }
};
