const { Client, Intents } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
const config = require("../config");

client.login(config.token);

client.on("ready", async () => {
  const commands = await client.application.commands.fetch();

  if (commands.size === 0) {
    console.log("Không tìm thấy bất kỳ lệnh nào toàn cầu.");
    process.exit();
  }

  let deletedCount = 0;

  commands.forEach(async (command) => {
    await client.application.commands.delete(command.id);
    console.log(`Lệnh Slash với ID ${command.id} đã được xóa.`);
    deletedCount++;

    if (deletedCount === commands.size) {
      console.log(`Đã xóa thành công tất cả các lệnh Slash toàn cầu.`);
      process.exit();
    }
  });
});
