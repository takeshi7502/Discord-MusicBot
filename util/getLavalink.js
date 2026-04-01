/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @returns {import("lavalink-client").LavalinkNode | undefined}
 */
module.exports = async (client) => {
  const nodes = client.manager.nodeManager.leastUsedNodes();
  return nodes.length > 0 ? nodes[0] : undefined;
};
