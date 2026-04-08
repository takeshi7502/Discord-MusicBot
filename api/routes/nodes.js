const { Router } = require("express");
const api = Router();
const { getClient } = require("../../");

// Public API — no auth required
api.get("/", (req, res) => {
  try {
    const client = getClient();
    if (!client || !client.manager) {
      return res.json([]);
    }

    const nodes = [...client.manager.nodeManager.nodes.values()].map((node) => ({
      id: node.id || "unknown",
      host: node.options?.host || "unknown",
      port: node.options?.port || 0,
      connected: !!node.connected,
      players: [...client.manager.players.values()].filter(
        (p) => p.node?.id === node.id
      ).length,
      ping: node.stats?.ping ?? 0,
    }));

    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = api;
