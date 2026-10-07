const config = require('../../config.json');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    // Permission check
    if (command.permissions) {
      const missing = message.member.permissions.missing(command.permissions);
      if (missing.length) {
        return message.reply(`❌ You need the **${missing.join(', ')}** permission(s) to use this command.`);
      }
    }

    try {
      await command.execute(message, args, client);
    } catch (err) {
      console.error(err);
      message.reply('❌ Something went wrong running that command.');
    }
  },
};
