const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Collection,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { escapeMarkdown } = require("discord.js");
const fs = require("fs");
const path = require("path");
const prettyMilliseconds = require("pretty-ms");
const jsoning = require("jsoning"); // Documentation: https://jsoning.js.org/
const { LavalinkManager } = require("lavalink-client");
const ConfigFetcher = require("../util/getConfig");
const Logger = require("./Logger");
const getLavalink = require("../util/getLavalink");
const getChannel = require("../util/getChannel");
const colors = require("colors");

class DiscordMusicBot extends Client {
  /**
   * Create the music client
   * @param {import("discord.js").ClientOptions} props - Client options
   */
  constructor(
    props = {
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
      ],
    }
  ) {
    super(props);

    ConfigFetcher().then((conf) => {
      this.config = conf;
      this.build();
    });

    //Load Events and stuff
    /**@type {Collection<string, import("./SlashCommand")} */
    this.slashCommands = new Collection();
    this.contextCommands = new Collection();

    this.logger = new Logger(path.join(__dirname, "..", "logs.log"));

    this.LoadCommands();
    this.LoadEvents();

    this.database = new jsoning("db.json");

    this.deletedMessages = new WeakSet();
    this.getLavalink = getLavalink;
    this.getChannel = getChannel;
    this.ms = prettyMilliseconds;
    this.commandsRan = 0;
    this.songsPlayed = 0;
  }

  /**
   * Send an info message
   * @param {string} text
   */
  log(text) {
    this.logger.log(text);
  }

  /**
   * Send an warning message
   * @param {string} text
   */
  warn(text) {
    this.logger.warn(text);
  }

  /**
   * Send an error message
   * @param {string} text
   */
  error(text) {
    this.logger.error(text);
  }

  /**
   * Build em
   */
  build() {
    this.warn("Đã bắt đầu bot...");
    this.login(this.config.token);

    if (this.config.debug === true) {
      this.warn("Chế độ gỡ lỗi đã được kích hoạt!");
      this.warn("Chỉ kích hoạt điều này nếu bạn biết bạn đang làm gì!");
      process.on("unhandledRejection", (error) => console.log(error));
      process.on("uncaughtException", (error) => console.log(error));
    } else {
      process.on("unhandledRejection", (error) => {
        console.error("Unhandled Rejection:", error);
      });
      process.on("uncaughtException", (error) => {
        console.error("Uncaught Exception:", error);
      });
    }

    let client = this;

    /**
     * will hold at most 100 tracks, for the sake of autoqueue
     */
    let playedTracks = [];

    // ==========================================
    // LavalinkManager (lavalink-client v4)
    // ==========================================
    this.manager = new LavalinkManager({
      nodes: this.config.nodes,
      sendToShard: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      },
      autoSkip: true,
      client: {
        id: this.config.clientId,
        username: "DiscordMusicBot",
      },
      playerOptions: {
        defaultSearchPlatform: this.config.searchEngine || "youtube",
        onDisconnect: {
          autoReconnect: true,
          destroyPlayer: false,
        },
        onEmptyQueue: {
          autoPlayFunction: async (player, lastTrack) => {
            const autoQueue = player.get("autoQueue");
            if (!autoQueue) return;
            if (!lastTrack) return;

            // YouTube autoplay - tìm mix dựa trên bài cuối
            const search = `https://www.youtube.com/watch?v=${lastTrack.info.identifier}&list=RD${lastTrack.info.identifier}`;
            const requester = player.get("requester");
            const res = await player
              .search({ query: search, source: "youtube" }, requester)
              .then((response) => {
                response.tracks = response.tracks.filter(
                  (v) =>
                    v.info.identifier !== lastTrack.info.identifier &&
                    !playedTracks.includes(v.info.identifier)
                );
                return response;
              })
              .catch((err) => {
                client.warn(`AutoQueue error: ${err.message}`);
                return null;
              });

            if (res && res.tracks && res.tracks.length > 0) {
              await player.queue.add(res.tracks.slice(0, 5));
              if (!player.playing && !player.paused) await player.play();
            }
          },
        },
      },
    });

    // ==========================================
    // Node events (via nodeManager)
    // ==========================================
    this.manager.nodeManager
      .on("connect", (node) =>
        this.log(
          `Node: ${node.id} | Nút Lavalink đã kết nối.`
        )
      )
      .on("reconnecting", (node) =>
        this.warn(
          `Node: ${node.id} | Nút Lavalink đang kết nối lại.`
        )
      )
      .on("destroy", (node) =>
        this.warn(
          `Node: ${node.id} | Nút Lavalink đã bị hủy.`
        )
      )
      .on("disconnect", (node) =>
        this.warn(
          `Node: ${node.id} | Nút Lavalink đã ngắt kết nối.`
        )
      )
      .on("error", (node, err) => {
        this.warn(
          `Node: ${node.id} | Nút Lavalink có lỗi: ${err.message}.`
        );
      });

    // ==========================================
    // Player events (via manager)
    // ==========================================

    // on track error warn and create embed
    this.manager
      .on("trackError", (player, track, payload) => {
        this.warn(
          `Bot: ${player.guildId} | Bài hát gặp lỗi: ${payload?.exception?.message || "Unknown error"}.`
        );
        let title = track ? escapeMarkdown(track.info.title) : "Unknown";
        title = title.replace(/\]/g, "").replace(/\[/g, "");

        let errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle("Lỗi phát nhạc!")
          .setDescription(`Không thể tải bài hát: \`${title}\``)
          .setFooter({
            text: "Oops! Có điều gì đó đã xảy ra không đúng, nhưng không phải lỗi của bạn!",
          });
        const channel = client.channels.cache.get(player.textChannelId);
        if (channel) {
          channel.send({ embeds: [errorEmbed] }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 30000));
        }
      })

      .on("trackStuck", (player, track) => {
        this.warn(`Bài hát bị kẹt: ${track?.info?.title || "Unknown"}`);
        let title = track ? escapeMarkdown(track.info.title) : "Unknown";
        title = title.replace(/\]/g, "").replace(/\[/g, "");

        let errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle("Lỗi bài hát!")
          .setDescription(`Không thể tải bài hát: \`${title}\``)
          .setFooter({
            text: "Ồ! Có điều gì đó đã xảy ra không đúng nhưng không phải lỗi của bạn!",
          });
        const channel = client.channels.cache.get(player.textChannelId);
        if (channel) {
          channel.send({ embeds: [errorEmbed] }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 30000));
        }
      })

      .on("playerMove", (player, oldChannel, newChannel) => {
        const guild = client.guilds.cache.get(player.guildId);
        if (!guild) return;
        const channel = guild.channels.cache.get(player.textChannelId);
        if (oldChannel === newChannel) return;

        if (newChannel === null || !newChannel) {
          if (!player) return;
          if (channel) {
            channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.config.embedColor)
                  .setDescription(`Đã ngắt kết nối từ <#${oldChannel}>`),
              ],
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 30000));
          }
          return player.destroy();
        } else {
          player.voiceChannelId = newChannel;
          setTimeout(() => player.resume(), 1000);
          return undefined;
        }
      })

      .on("playerCreate", (player) => {
        player.set("twentyFourSeven", client.config.twentyFourSeven);
        player.set("autoQueue", client.config.autoQueue);
        player.set("autoPause", client.config.autoPause);
        player.set("autoLeave", client.config.autoLeave);
        this.warn(
          `Bot: ${player.guildId} | Một Bot mới đã được tạo trong ${
            client.guilds.cache.get(player.guildId)
              ? client.guilds.cache.get(player.guildId).name
              : "một máy chủ"
          }`
        );
      })

      .on("playerDestroy", (player) => {
        this.warn(
          `Bot: ${player.guildId} | Một Bot mới đã bị hủy trong ${
            client.guilds.cache.get(player.guildId)
              ? client.guilds.cache.get(player.guildId).name
              : "một máy chủ"
          }`
        );
        // Delete now playing message
        deleteNowPlayingMessage(client, player);
      })

      // on TRACK_START send or edit message
      .on("trackStart", async (player, track) => {
        this.songsPlayed++;
        playedTracks.push(track.info.identifier);
        if (playedTracks.length >= 100) {
          playedTracks.shift();
        }

        this.warn(
          `Bot: ${player.guildId} | Bài hát đã bắt đầu phát [${colors.blue(track.info.title)}]`
        );
        let title = escapeMarkdown(track.info.title);
        title = title.replace(/\]/g, "").replace(/\[/g, "");

        let trackStartedEmbed = this.Embed()
          .setAuthor({ name: "Đang phát", iconURL: this.config.iconURL })
          .setDescription(
            `[${title}](${track.info.uri})` || "Không có mô tả"
          )
          .addFields(
            {
              name: "Yêu cầu từ",
              value: `${track.requester ? `<@${track.requester.id || track.requester}>` : `<@${client.user.id}>`}`,
              inline: true,
            },
            {
              name: "Thời lượng",
              value: track.info.isStream
                ? `\`LIVE\``
                : `\`${prettyMilliseconds(track.info.duration, {
                    colonNotation: true,
                  })}\``,
              inline: true,
            }
          );

        if (track.info.artworkUrl) {
          trackStartedEmbed.setThumbnail(track.info.artworkUrl);
        }

        const messagePayload = {
          embeds: [trackStartedEmbed],
          components: [
            client.createController(player.guildId, player),
          ],
        };

        // Try to edit existing now playing message, fallback to sending new one
        const existingMsg = player.get("nowPlayingMessage");
        let nowPlaying = null;

        if (existingMsg && !client.isMessageDeleted(existingMsg)) {
          try {
            nowPlaying = await existingMsg.edit(messagePayload);
          } catch {
            // Edit failed (message deleted externally, etc.), send new one
            nowPlaying = await client.channels.cache
              .get(player.textChannelId)
              ?.send(messagePayload)
              .catch(this.warn);
          }
        } else {
          nowPlaying = await client.channels.cache
            .get(player.textChannelId)
            ?.send(messagePayload)
            .catch(this.warn);
        }

        // Store now playing message
        if (nowPlaying) {
          player.set("nowPlayingMessage", nowPlaying);
        }
      })

      .on("playerDisconnect", async (player) => {
        const twentyFourSeven = player.get("twentyFourSeven");
        if (twentyFourSeven) {
          player.queue.splice(0);
          player.stopPlaying(false, false);
          player.set("autoQueue", false);
        } else {
          player.destroy();
        }
      })

      .on("queueEnd", async (player, track) => {
        // Xóa tin nhắn "Đang phát" cũ khi hàng đợi kết thúc
        deleteNowPlayingMessage(client, player);

        const autoQueue = player.get("autoQueue");
        const tracksAdded = player.queue.tracks.length > 0;

        // Nếu không có autoQueue hoặc autoQueue không tìm thấy bài hát nào mới
        if (!autoQueue || !tracksAdded) {
          const twentyFourSeven = player.get("twentyFourSeven");

          let queueEmbed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setAuthor({
              name: "Hàng đợi đã kết thúc",
              iconURL: client.config.iconURL,
            })
            .setFooter({ text: "Hàng đợi đã kết thúc" })
            .setTimestamp();

          const textChannel = client.channels.cache.get(player.textChannelId);
          if (textChannel) {
            let EndQueue = await textChannel.send({ embeds: [queueEmbed] });
            setTimeout(() => EndQueue.delete().catch(() => {}), 5000);
          }

          try {
            if (!player.playing && !twentyFourSeven) {
              setTimeout(async () => {
                if (!player.playing && player.connected) {
                  let disconnectedEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setAuthor({
                      name: "Đã ngắt kết nối!",
                      iconURL: client.config.iconURL,
                    })
                    .setDescription(
                      `Bot đã bị ngắt kết nối do không có hoạt động.`
                    );
                  const ch = client.channels.cache.get(player.textChannelId);
                  if (ch) {
                    let Disconnected = await ch.send({
                      embeds: [disconnectedEmbed],
                    });
                    setTimeout(() => Disconnected.delete().catch(() => {}), 6000);
                  }
                  player.destroy();
                } else if (player.playing) {
                  client.warn(
                    `Bot: ${player.guildId} | Vẫn đang phát`
                  );
                }
              }, client.config.disconnectTime);
            } else if (!player.playing && twentyFourSeven) {
              client.warn(
                `Bot: ${player.guildId} | Hàng đợi đã kết thúc [${colors.blue("24/7 ENABLED")}]`
              );
            }
          } catch (err) {
            client.error(err);
          }
        }
      });
  }

  /**
   * Checks if a message has been deleted during the run time of the Bot
   * @param {Message} message
   * @returns
   */
  isMessageDeleted(message) {
    return this.deletedMessages.has(message);
  }

  /**
   * Marks (adds) a message on the client's `deletedMessages` WeakSet so it's
   * state can be seen through the code
   * @param {Message} message
   */
  markMessageAsDeleted(message) {
    this.deletedMessages.add(message);
  }

  /**
   *
   * @param {string} text
   * @returns {EmbedBuilder}
   */
  Embed(text) {
    let embed = new EmbedBuilder().setColor(this.config.embedColor);

    if (text) {
      embed.setDescription(text);
    }

    return embed;
  }

  /**
   *
   * @param {string} text
   * @returns {EmbedBuilder}
   */
  ErrorEmbed(text) {
    let embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription("❌ | " + text);

    return embed;
  }

  LoadEvents() {
    let EventsDir = path.join(__dirname, "..", "events");
    fs.readdir(EventsDir, (err, files) => {
      if (err) {
        throw err;
      } else {
        files.forEach((file) => {
          const event = require(EventsDir + "/" + file);
          this.on(file.split(".")[0], event.bind(null, this));
          this.warn("Sự kiện đã được tải: " + file.split(".")[0]);
        });
      }
    });
  }

  LoadCommands() {
    let SlashCommandsDirectory = path.join(
      __dirname,
      "..",
      "commands",
      "slash"
    );
    fs.readdir(SlashCommandsDirectory, (err, files) => {
      if (err) {
        throw err;
      } else {
        files.forEach((file) => {
          let cmd = require(SlashCommandsDirectory + "/" + file);

          if (!cmd || !cmd.run) {
            return this.warn(
              "Không thể tải lệnh: " +
                file.split(".")[0] +
                ", Tệp không có một lệnh hợp lệ với chức năng chạy"
            );
          }
          this.slashCommands.set(file.split(".")[0].toLowerCase(), cmd);
          this.log("Slash Command Loaded: " + file.split(".")[0]);
        });
      }
    });

    let ContextCommandsDirectory = path.join(
      __dirname,
      "..",
      "commands",
      "context"
    );
    fs.readdir(ContextCommandsDirectory, (err, files) => {
      if (err) {
        throw err;
      } else {
        files.forEach((file) => {
          let cmd = require(ContextCommandsDirectory + "/" + file);
          if (!cmd.command || !cmd.run) {
            return this.warn(
              "Không thể tải lệnh: " +
                file.split(".")[0] +
                ", Tệp không chứa lệnh command/run"
            );
          }
          this.contextCommands.set(file.split(".")[0].toLowerCase(), cmd);
          this.log("ContextMenu Loaded: " + file.split(".")[0]);
        });
      }
    });
  }

  /**
   *
   * @param {import("discord.js").TextChannel} textChannel
   * @param {import("discord.js").VoiceChannel} voiceChannel
   */
  createPlayer(textChannel, voiceChannel) {
    return this.manager.createPlayer({
      guildId: textChannel.guild.id,
      voiceChannelId: voiceChannel.id,
      textChannelId: textChannel.id,
      selfDeaf: this.config.serverDeafen,
      selfMute: false,
    });
  }

  createController(guild, player) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`controller:${guild}:Stop`)
        .setEmoji("⏹️"),

      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`controller:${guild}:Replay`)
        .setEmoji("⏮️"),

      new ButtonBuilder()
        .setStyle(player.playing ? ButtonStyle.Primary : ButtonStyle.Danger)
        .setCustomId(`controller:${guild}:PlayAndPause`)
        .setEmoji(player.playing ? "⏸️" : "▶️"),

      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`controller:${guild}:Next`)
        .setEmoji("⏭️"),

      new ButtonBuilder()
        .setStyle(
          player.repeatMode !== "off"
            ? ButtonStyle.Success
            : ButtonStyle.Danger
        )
        .setCustomId(`controller:${guild}:Loop`)
        .setEmoji(player.repeatMode === "track" ? "🔂" : "🔁")
    );
  }
}

/**
 * Helper to delete the now playing message
 */
function deleteNowPlayingMessage(client, player) {
  const msg = player.get("nowPlayingMessage");
  if (msg && !client.isMessageDeleted(msg)) {
    msg.delete().catch(() => {});
    client.markMessageAsDeleted(msg);
  }
  player.set("nowPlayingMessage", null);
}

module.exports = DiscordMusicBot;
